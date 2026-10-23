import Icon from './Icon'
import { pollAppearance } from './data'
export default function PollCard({ poll, mode, onSelect, vote, guess, isAdmin, onClosePoll, onViewResult }) {
  const { theme, emojis } = pollAppearance(poll)
  const closed = poll.status !== 'ATIVA'
  const played = mode === 'game' ? guess : vote
  return <article className={`poll-card ${theme}`}>
    <div className="poll-card-top"><span className="category-label">{poll.categoria || 'Geral'}</span><span className={`poll-state ${closed ? 'closed' : ''}`}><i />{closed ? 'Votação encerrada' : 'Em jogo'}</span></div>
    <h3>{poll.pergunta}</h3>
    <div className="duel-options">{poll.opcoes?.slice(0, 2).map((option, index) => <button key={option.id} className={`duel-option option-${index} ${played && String(played.opcaoPalpitadaId ?? played) === String(option.id) ? 'chosen' : ''}`} onClick={() => onSelect(poll, option)} disabled={(closed && mode !== 'game') || Boolean(played)}>
      <span className="option-emoji" aria-hidden="true">{emojis[index]}</span><span>{option.texto}</span>{played && String(played.opcaoPalpitadaId ?? played) === String(option.id) && <Icon name="check" size={15} />}
    </button>)}<span className="versus">ou</span></div>
    <div className="poll-card-footer"><span><Icon name={played ? 'check' : mode === 'game' ? 'game' : 'lock'} size={14} />{played ? mode === 'game' ? guess.acertou ? `Acertou! +${guess.pontosGanhos} pts` : 'Palpite registrado' : 'Voto registrado' : mode === 'game' ? 'Qual é a escolha da maioria?' : 'O resultado fica em segredo'}</span>
      {mode === 'game' && guess ? <button className="text-button" onClick={() => onViewResult(poll)}>Ver resultado</button> : isAdmin && !closed ? <button className="text-button" onClick={() => onClosePoll(poll)}>Encerrar</button> : <Icon name="arrow" size={16} />}
    </div>
  </article>
}
