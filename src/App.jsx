import { useState } from 'react'
import Icon from './Icon'
import Hero from './Hero'
import Journey from './Journey'
import PollCard from './PollCard'
import PlaygroundModal from './PlaygroundModal'
import usePlayground from './usePlayground'
import { categories } from './data'
import './App.css'

const navigation = [{ id: 'discover', label: 'Descobrir', icon: 'compass' }, { id: 'vote', label: 'Modo votação', icon: 'vote' }, { id: 'game', label: 'Modo adivinhação', icon: 'game' }, { id: 'journey', label: 'Minha jornada', icon: 'trophy' }]

export default function App() {
  const game = usePlayground()
  const { auth, demo, ready, preview, polls, votes, guesses, points, name, isAdmin, loading, serviceError, notice, openModal, startDemo, login } = game
  const [page, setPage] = useState('discover')
  const [category, setCategory] = useState('Todas')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [mobileOpen, setMobileOpen] = useState(false)
  const level = Math.floor(points / 100) + 1
  const mode = page === 'game' ? 'game' : 'vote'
  const activeNav = navigation.find(item => item.id === page)
  let filtered = polls.filter(poll => (category === 'Todas' || poll.categoria === category) && `${poll.pergunta} ${poll.opcoes?.map(option => option.texto).join(' ')}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
  if (sort === 'az') filtered = [...filtered].sort((a, b) => a.pergunta.localeCompare(b.pergunta, 'pt-BR'))
  if (sort === 'unplayed') filtered = [...filtered].sort((a, b) => Number(Boolean((mode === 'game' ? guesses : votes)[a.id])) - Number(Boolean((mode === 'game' ? guesses : votes)[b.id])))
  function navigate(next) { setPage(next); setMobileOpen(false); setCategory('Todas'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const help = () => openModal({ type: 'help' })

  return <div className="app-shell">
    {mobileOpen && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <a href="#" className="brand" onClick={event => { event.preventDefault(); navigate('discover') }} aria-label="Chouse, início"><span className="brand-symbol"><i /><i /></span>chouse<span className="brand-dot">.</span></a>
      <span className="sidebar-caption">ESCOLHER É SÓ O COMEÇO</span><div className="nav-caption">PLAYGROUND</div>
      <nav aria-label="Menu principal">{navigation.map(item => <button key={item.id} className={`nav-link ${page === item.id ? 'active' : ''}`} aria-current={page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'game' && <span className="nav-new">PLAY</span>}</button>)}</nav>
      <div className="sidebar-promo"><span className="promo-spark">✳</span><h3>Tem opinião?<br />Então tem jogo.</h3><p>Vote com o coração.<br />Adivinhe com a intuição.</p><button onClick={() => navigate('game')}>Bora jogar <Icon name="arrow" size={17} /></button></div>
      <div className="sidebar-bottom"><button className="nav-link" onClick={help}><Icon name="help" />Como funciona</button><div className="sidebar-footer"><span className="tiny-symbol">✳</span><span>Feito para discordar.<br /><strong>E se divertir junto.</strong></span></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menu" aria-expanded={mobileOpen}><Icon name="menu" /></button><span>Playground</span><Icon name="chevron" size={13} /><strong>{activeNav.label}</strong></div><div className="header-actions"><span className="header-motto"><i />Toda opinião tem seu lado.</span>{demo ? <><span className="demo-badge">Demo</span><button className="user-button" onClick={() => navigate('journey')}><span className="avatar">J</span><span>Jogador</span></button></> : auth.isAuthenticated ? <button className="user-button" onClick={() => navigate('journey')}><span className="avatar">{name.charAt(0).toUpperCase()}</span><span>{name.split(' ')[0]}</span><Icon name="down" size={14} /></button> : <button className="button button-dark button-small" disabled={auth.isLoading} onClick={login}>{auth.isLoading ? 'Conectando…' : 'Entrar no jogo'}<Icon name="arrow" size={16} /></button>}</div></header>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {demo && <div className="demo-notice"><span><Icon name="spark" size={15} />Playground de demonstração. Votos e pontos são ilustrativos.</span><button onClick={game.exitDemo}>Sair da demo <Icon name="close" size={13} /></button></div>}
        {(serviceError || auth.error) && !demo && <div className="connection-notice" role="alert"><div><strong>A conexão deu uma pausa.</strong><p>{serviceError || 'Não foi possível concluir a autenticação. Tente entrar novamente.'}</p></div><div className="inline-actions"><button className="button button-small button-outline" onClick={game.reconnect}><Icon name="refresh" size={15} />Reconectar</button><button className="text-button" onClick={startDemo}>Experimentar demo</button></div></div>}
        {page === 'journey' ? <Journey game={game} navigate={navigate} /> : <>
          <Hero page={page} onHelp={help} onPlay={() => page === 'game' ? document.getElementById('polls')?.scrollIntoView({ behavior: 'smooth' }) : navigate('game')} />
          <div className="mode-strip"><button className={mode === 'vote' ? 'selected' : ''} onClick={() => navigate('vote')}><span className="mode-icon"><Icon name="vote" size={22} /></span><span><strong>Vote na sua preferência</strong><small>Sua opinião ajuda a formar o consenso.</small></span><Icon name="arrow" size={18} /></button><span className="mode-divider" /><button className={mode === 'game' ? 'selected' : ''} onClick={() => navigate('game')}><span className="mode-icon"><Icon name="game" size={23} /></span><span><strong>Adivinhe a maioria</strong><small>Acerte o consenso e acumule pontos.</small></span><Icon name="arrow" size={18} /></button></div>
          <div className="content-columns"><section className="poll-section" id="polls"><div className="section-heading"><div><span className="eyebrow">{page === 'game' ? 'CONFIE NO SEU PALPITE' : 'PEQUENAS ESCOLHAS, GRANDES DEBATES'}</span><h2>{page === 'game' ? 'Desafie sua intuição' : 'Qual vai ser a sua?'} <span className="heading-spark">✳</span></h2></div>{isAdmin && <button className="button button-outline button-small" onClick={() => openModal({ type: 'create' })}><Icon name="plus" size={16} />Criar enquete</button>}</div>
            <div className="category-tabs" role="group" aria-label="Filtrar por categoria">{categories.map(item => <button key={item} className={item === category ? 'active' : ''} aria-pressed={item === category} onClick={() => setCategory(item)}>{item === 'Todas' && <Icon name="compass" size={14} />}{item}</button>)}</div>
            <div className="poll-toolbar"><label className="search-field"><Icon name="search" size={17} /><input aria-label="Buscar enquetes" placeholder="Encontre sua próxima polêmica…" value={search} onChange={event => setSearch(event.target.value)} />{search && <button className="icon-button" aria-label="Limpar busca" onClick={() => setSearch('')}><Icon name="close" size={14} /></button>}</label><label className="sort-field"><span className="sr-only">Ordenar enquetes</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Ordem padrão</option><option value="az">De A a Z</option><option value="unplayed">Não respondidas</option></select></label></div>
            {preview && !demo && <div className="preview-label"><span><i />Uma prévia do playground</span><button onClick={startDemo}>Experimentar demo <Icon name="arrow" size={13} /></button></div>}
            {loading && !demo ? <div className="poll-grid" aria-busy="true" aria-label="Carregando confrontos">{[1, 2, 3, 4].map(item => <div className="skeleton-card" key={item}><i /><i /><i /></div>)}</div> : filtered.length ? <div className="poll-grid">{filtered.map(poll => <PollCard key={poll.id} poll={poll} mode={mode} vote={votes[poll.id]} guess={guesses[poll.id]} onSelect={(poll, option) => game.selectOption(poll, option, mode)} isAdmin={isAdmin} onViewResult={game.viewResult} onClosePoll={poll => openModal({ type: 'close', poll })} />)}</div> : <div className="empty-state"><Icon name={serviceError ? 'refresh' : 'search'} size={34} /><h3>{serviceError ? 'Os confrontos já voltam.' : 'Nenhum confronto por aqui.'}</h3><p>{serviceError ? 'Reconecte aos serviços ou explore a demonstração.' : search || category !== 'Todas' ? 'Tente outra busca ou explore todas as categorias.' : 'Assim que a comunidade publicar enquetes, elas aparecem aqui.'}</p>{(search || category !== 'Todas') && <button className="button button-outline" onClick={() => { setSearch(''); setCategory('Todas') }}>Limpar filtros</button>}</div>}
            <div className="list-footnote"><span>✦</span> Aqui, discordar faz parte da diversão.</div>
          </section>
          <aside className="right-rail"><section className="score-card"><div className="rail-card-heading"><span>SUA JORNADA</span><Icon name="trophy" size={17} /></div><div className="level-icon"><Icon name="bolt" size={24} /></div><h3>{ready ? `Boa, ${name.split(' ')[0]}!` : 'De palpite em palpite…'}</h3><p>{ready ? 'Sua intuição está ganhando experiência.' : 'Sua intuição pode te levar longe.'}</p><div className="score-line"><strong>{points}<small> pts</small></strong><span>Nível {level}</span></div><div className="progress-track" role="progressbar" aria-label="Pontos até o próximo nível" aria-valuenow={points % 100} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${points % 100}%` }} /></div><div className="level-description">{ready ? `${100 - points % 100} pontos para o próximo nível` : 'Entre para começar sua jornada'}</div><button className="button button-outline" onClick={() => ready ? navigate('journey') : login()}>{ready ? 'Ver minha jornada' : 'Desbloquear meu perfil'}<Icon name={ready ? 'arrow' : 'lock'} size={15} /></button></section>
          <section className="how-card"><span className="eyebrow">O JOGO É SIMPLES</span><h3>Do seu jeito.<br />Ou do jeito da galera?</h3><div className="how-step"><span>01</span><div><strong>Escolha seu lado</strong><p>Vote na opção que tem mais a ver com você.</p></div></div><div className="how-step"><span>02</span><div><strong>Leia a mente da galera</strong><p>No modo adivinhação, tente acertar a maioria.</p></div></div><div className="how-step"><span>03</span><div><strong>Acerte e pontue</strong><p>Descubra o resultado depois do seu palpite.</p></div></div><button className="text-button" onClick={help}>Entenda as regras <Icon name="arrow" size={15} /></button></section><div className="rail-note"><Icon name="people" size={19} /><p>O mundo não precisa concordar.<br /><strong>Só precisa participar.</strong></p></div></aside></div>
        </>}
        <footer className="page-footer"><span>chouse<span>.</span> <small>Um jogo de opiniões.</small></span><button onClick={help}>Feito para gente curiosa <span>↗</span></button></footer>
      </main>
    </div>
    {notice && <div className="toast" role="status"><Icon name="spark" size={18} /><span>{notice}</span><button className="icon-button" onClick={game.dismissNotice} aria-label="Dispensar mensagem"><Icon name="close" size={16} /></button></div>}
    <PlaygroundModal game={game} navigate={navigate} />
  </div>
}
