import { useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { readRoles, request } from './api'
import { demoPolls } from './data'

const emptyDemo = { votes: {}, guesses: {}, points: 0 }
function loadDemo() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('chouse-demo'))
    return saved && saved.votes && saved.guesses && Number.isFinite(saved.points) ? saved : emptyDemo
  } catch { return emptyDemo }
}

export default function usePlayground() {
  const auth = useAuth0()
  const { user, isAuthenticated, getAccessTokenSilently } = auth
  const [demo, setDemo] = useState(false)
  const [demoData, setDemoData] = useState(loadDemo)
  const [polls, setPolls] = useState([])
  const [dbUser, setDbUser] = useState(null)
  const [token, setToken] = useState('')
  const [guesses, setGuesses] = useState({})
  const [votes, setVotes] = useState({})
  const [loading, setLoading] = useState(false)
  const [serviceError, setServiceError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState(null)
  const actionLock = useRef(false)

  useEffect(() => {
    try { sessionStorage.setItem('chouse-demo', JSON.stringify(demoData)) } catch { /* A demo funciona sem armazenamento. */ }
  }, [demoData])

  useEffect(() => {
    if (!isAuthenticated || !user || demo) return
    const controller = new AbortController()
    async function connect() {
      setLoading(true); setServiceError('')
      try {
        const accessToken = await getAccessTokenSilently()
        if (controller.signal.aborted) return
        setToken(accessToken)
        const options = { token: accessToken, signal: controller.signal }
        let profile
        try { profile = await request(`/usuarios/auth0/${encodeURIComponent(user.sub)}`, options) }
        catch (error) {
          if (error.status !== 404) throw error
          profile = await request('/usuarios', { ...options, method: 'POST', body: { auth0Id: user.sub, nome: user.name || user.nickname || 'Jogador', email: user.email } })
        }
        const [pollData, history] = await Promise.all([request('/enquetes', options), request(`/palpites/usuario/${profile.id}`, options)])
        if (!Array.isArray(pollData) || !Array.isArray(history)) throw new Error('O serviço retornou dados inesperados. Tente novamente.')
        if (controller.signal.aborted) return
        setDbUser(profile); setPolls(pollData)
        setGuesses(Object.fromEntries(history.map(item => [item.enqueteId, item])))
        try { setVotes(JSON.parse(sessionStorage.getItem(`chouse-votes-${user.sub}`)) || {}) } catch { setVotes({}) }
      } catch (error) {
        if (!controller.signal.aborted) setServiceError(error.message === 'Failed to fetch' ? 'Não foi possível conectar ao Chouse. Confira se os serviços estão disponíveis.' : error.message)
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    connect()
    return () => controller.abort()
  }, [isAuthenticated, user, getAccessTokenSilently, demo, retry])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 5500)
    return () => clearTimeout(timer)
  }, [notice])

  function openModal(value) { setActionError(''); setResult(null); setModal(value) }
  function closeModal() { if (!actionLock.current) setModal(null) }
  function startDemo() { setDemo(true); setModal(null); setNotice('Demonstração ativada. Seus votos e pontos ficam apenas nesta sessão.'); setServiceError('') }
  async function login() {
    try { await auth.loginWithRedirect({ appState: { returnTo: window.location.pathname } }) }
    catch { setNotice('Não foi possível abrir o login. Tente novamente.') }
  }
  const ready = demo || (isAuthenticated && Boolean(dbUser) && !serviceError && !loading)
  function selectOption(poll, option, mode) {
    if (!demo && !isAuthenticated) { openModal({ type: 'login' }); return }
    if (!ready) { setNotice('Aguarde a conexão com sua conta ou experimente a demonstração.'); return }
    openModal({ type: 'play', poll, option, mode })
  }

  async function viewResult(poll) {
    if (actionLock.current) return
    const guess = (demo ? demoData.guesses : guesses)[poll.id]
    if (!guess) return
    openModal({ type: 'play', poll, mode: 'game' })
    setResult(guess)
    if (demo) { setResult({ ...guess, percentualA: poll.demoPercent, percentualB: 100 - poll.demoPercent }); return }
    actionLock.current = true; setBusy(true)
    try { setResult({ ...guess, ...await request(`/enquetes/${poll.id}/resultado`, { token }) }) }
    catch { setNotice('Seu palpite está salvo. Os percentuais estão indisponíveis no momento.') }
    finally { actionLock.current = false; setBusy(false) }
  }

  async function submitChoice() {
    if (actionLock.current) return
    actionLock.current = true; setBusy(true); setActionError('')
    const { poll, option, mode } = modal
    try {
      if (demo) {
        if (mode === 'vote') {
          setDemoData(previous => ({ ...previous, votes: { ...previous.votes, [poll.id]: option.id } })); setResult({ voted: true })
        } else {
          const index = poll.opcoes.findIndex(item => item.id === option.id)
          const correct = (poll.demoPercent > 50 && index === 0) || (poll.demoPercent < 50 && index === 1)
          const guess = { enqueteId: poll.id, opcaoPalpitadaId: option.id, acertou: correct, pontosGanhos: correct ? 10 : 0 }
          setDemoData(previous => ({ ...previous, guesses: { ...previous.guesses, [poll.id]: guess }, points: previous.points + guess.pontosGanhos }))
          setResult({ ...guess, percentualA: poll.demoPercent, percentualB: 100 - poll.demoPercent })
        }
      } else if (mode === 'vote') {
        await request(`/enquetes/${poll.id}/votos`, { token, method: 'POST', body: { usuarioId: dbUser.id, opcaoId: option.id } })
        const nextVotes = { ...votes, [poll.id]: option.id }
        setVotes(nextVotes)
        try { sessionStorage.setItem(`chouse-votes-${user.sub}`, JSON.stringify(nextVotes)) } catch { /* O servidor impede duplicatas. */ }
        setResult({ voted: true })
      } else {
        const guess = await request('/palpites', { token, method: 'POST', body: { usuarioId: dbUser.id, enqueteId: poll.id, opcaoId: option.id } })
        setGuesses(previous => ({ ...previous, [poll.id]: guess })); setResult(guess)
        const updates = await Promise.allSettled([request(`/enquetes/${poll.id}/resultado`, { token }), request(`/usuarios/${dbUser.id}`, { token })])
        if (updates[0].status === 'fulfilled') setResult({ ...guess, ...updates[0].value })
        if (updates[1].status === 'fulfilled') setDbUser(updates[1].value)
        else setNotice('Palpite salvo. Sua pontuação será sincronizada na próxima conexão.')
      }
    } catch (error) { setActionError(error.message) }
    finally { actionLock.current = false; setBusy(false) }
  }

  async function mutate(action, success) {
    if (actionLock.current) return
    actionLock.current = true; setBusy(true); setActionError('')
    try { await action(); setModal(null); setNotice(success) }
    catch (error) { setActionError(error.message) }
    finally { actionLock.current = false; setBusy(false) }
  }
  async function createPoll(event) {
    event.preventDefault()
    const form = Object.fromEntries(new FormData(event.currentTarget))
    for (const key of Object.keys(form)) form[key] = form[key].trim()
    if (!form.pergunta || !form.textoA || !form.textoB) { setActionError('Preencha a pergunta e as duas opções.'); return }
    if (form.textoA.toLocaleLowerCase() === form.textoB.toLocaleLowerCase()) { setActionError('O confronto precisa de duas opções diferentes.'); return }
    await mutate(async () => {
      const created = await request('/enquetes', { token, method: 'POST', body: form })
      setPolls(previous => [created, ...previous])
    }, 'Confronto publicado. Que comece a discussão!')
  }
  async function closePoll() {
    await mutate(async () => {
      await request(`/enquetes/${modal.poll.id}/encerrar`, { token, method: 'POST' })
      setPolls(previous => previous.map(poll => poll.id === modal.poll.id ? { ...poll, status: 'ENCERRADA' } : poll))
    }, 'Enquete encerrada.')
  }
  async function saveProfile(event) {
    event.preventDefault()
    const nome = new FormData(event.currentTarget).get('nome').trim()
    if (!nome) { setActionError('Seu nome não pode ficar vazio.'); return }
    await mutate(async () => setDbUser(await request(`/usuarios/${dbUser.id}/perfil`, { token, method: 'PATCH', body: { nome } })), 'Perfil atualizado. Ficou a sua cara!')
  }
  return {
    auth, demo, ready, loading, serviceError, notice, modal, busy, actionError, result, dbUser,
    preview: demo || !isAuthenticated,
    polls: demo || !isAuthenticated ? demoPolls : polls,
    votes: demo ? demoData.votes : votes,
    guesses: demo ? demoData.guesses : guesses,
    points: demo ? demoData.points : Number(dbUser?.pontuacaoTotal || 0),
    name: demo ? 'Jogador' : dbUser?.nome || user?.given_name || user?.nickname || 'Jogador',
    isAdmin: !demo && readRoles(token).includes('ADMIN'),
    openModal, closeModal, startDemo, login, selectOption, viewResult, submitChoice, createPoll, closePoll, saveProfile,
    dismissNotice: () => setNotice(''),
    reconnect: () => setRetry(previous => previous + 1),
    exitDemo: () => { setDemo(false); setNotice('Você saiu da demonstração.') },
    logout: () => auth.logout({ logoutParams: { returnTo: window.location.origin } }),
  }
}
