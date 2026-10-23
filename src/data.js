export const categories = ['Todas', 'Comida', 'Lifestyle', 'Entretenimento', 'Tecnologia', 'Polêmicas']
export const demoPolls = [
  { id: 'demo-1', pergunta: 'O verdadeiro duelo do café da manhã.', categoria: 'Comida', status: 'ATIVA', emojis: ['🍪', '🍞'], opcoes: [{ id: 'd1-a', texto: 'Biscoito' }, { id: 'd1-b', texto: 'Bolacha' }], demoPercent: 42, theme: 'peach' },
  { id: 'demo-2', pergunta: 'Seu fim de semana ideal tem…', categoria: 'Lifestyle', status: 'ATIVA', emojis: ['🛋️', '🪩'], opcoes: [{ id: 'd2-a', texto: 'Sofá e série' }, { id: 'd2-b', texto: 'Rolê com a galera' }], demoPercent: 63, theme: 'lavender' },
  { id: 'demo-3', pergunta: 'Uma pizza. Uma decisão difícil.', categoria: 'Comida', status: 'ATIVA', emojis: ['🍍', '🍕'], opcoes: [{ id: 'd3-a', texto: 'Com abacaxi' }, { id: 'd3-b', texto: 'Sem abacaxi' }], demoPercent: 29, theme: 'mint' },
  { id: 'demo-4', pergunta: 'Na hora de dar o play…', categoria: 'Entretenimento', status: 'ATIVA', emojis: ['🎬', '📺'], opcoes: [{ id: 'd4-a', texto: 'Um bom filme' }, { id: 'd4-b', texto: 'Maratonar uma série' }], demoPercent: 46, theme: 'blue' },
  { id: 'demo-5', pergunta: 'De que lado da força você está?', categoria: 'Tecnologia', status: 'ATIVA', emojis: ['🎮', '⌨️'], opcoes: [{ id: 'd5-a', texto: 'Console' }, { id: 'd5-b', texto: 'PC gamer' }], demoPercent: 54, theme: 'pink' },
  { id: 'demo-6', pergunta: 'Vamos resolver isso de uma vez?', categoria: 'Polêmicas', status: 'ATIVA', emojis: ['🥣', '🥛'], opcoes: [{ id: 'd6-a', texto: 'Cereal primeiro' }, { id: 'd6-b', texto: 'Leite primeiro' }], demoPercent: 77, theme: 'yellow' },
]
export function pollAppearance(poll) {
  const themes = { Comida: 'peach', Lifestyle: 'lavender', Entretenimento: 'blue', Tecnologia: 'mint', Polêmicas: 'pink' }
  const emojis = { Comida: ['🍴', '🍽️'], Lifestyle: ['☀️', '🌙'], Entretenimento: ['🎬', '🎧'], Tecnologia: ['🎮', '💻'], Polêmicas: ['💬', '💭'] }
  return { theme: poll.theme || themes[poll.categoria] || 'lavender', emojis: poll.emojis || emojis[poll.categoria] || ['✨', '⚡'] }
}
