export function parseDuracao(duracao: string | undefined): number {
  if (!duracao) return 60
  const match = duracao.match(/^(\d+)h(?:\s*(\d+)min)?$/)
  if (match) {
    const hours = parseInt(match[1])
    const mins = match[2] ? parseInt(match[2]) : 0
    return hours * 60 + mins
  }
  const onlyMins = duracao.match(/^(\d+)min$/)
  if (onlyMins) return parseInt(onlyMins[1])
  return 60
}
