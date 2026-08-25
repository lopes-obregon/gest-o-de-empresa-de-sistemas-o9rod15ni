// Função para adicionar 30 dias a uma data no formato dd/mm/yyyy, hh:mm:ss
function add30Days(dataStr) {
  const [partData, partHora] = dataStr.split(' ') || dataStr.split(', ')
  const [dia, mes, ano] = partData.split('/')
  const [hora, minuto, segundo] = partHora.split(':')
  const data = new Date(ano, mes - 1, dia, hora, minuto, segundo)
  //add 30 day in the data
  data.setDate(data.getDate() + 30)
  // formatando de volta ao padrão dd/mm/yyyy, hh:mm:ss
  return data.tolocaleString('pt-BR')
}
// Função para calcular a diferença em dias entre a data final e a data atual
function CalclarDiasRestantes(finalDateStr) {
  const [dataPart, horaPart] = finalDateStr.split(' ') || finalDateStr.split(', ')
  const [dia, mes, ano] = dataPart.split('/')
  const [hora, minuto, segundo] = horaPart.split(':')
  const finalDate = new Date(ano, mes - 1, dia, hora, minuto, segundo)
  const now = new Date()
  const diffTime = finalDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

module.exports = {
  add30Days,
  CalclarDiasRestantes,
}
