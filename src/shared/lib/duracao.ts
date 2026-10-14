/**
 * Interpreta a duração estimada de um pacote (texto livre, ex.: "2h", "2h30",
 * "2 horas", "90min", "2:30") e retorna o total em minutos. Retorna `null`
 * quando o texto não é reconhecido ou a duração é zero, permitindo validar o
 * cadastro do pacote.
 *
 * Premissa: a duração é sempre "wall-clock" no fuso do negócio
 * (America/Sao_Paulo); não há conversão de fuso aqui.
 */
export function duracaoParaMinutos(duracao: string | null | undefined): number | null {
  if (!duracao) return null

  const texto = duracao
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

  const positivo = (total: number) => (total > 0 ? total : null)

  const hhmm = texto.match(/^(\d{1,2}):(\d{2})$/)
  if (hhmm) {
    const minutos = parseInt(hhmm[2], 10)
    if (minutos >= 60) return null
    return positivo(parseInt(hhmm[1], 10) * 60 + minutos)
  }

  const horasMin = texto.match(/^(\d+)\s*h(?:\s*(\d+)\s*(?:min|minuto|minutos)?)?$/)
  if (horasMin) {
    const minutos = horasMin[2] ? parseInt(horasMin[2], 10) : 0
    if (minutos >= 60) return null
    return positivo(parseInt(horasMin[1], 10) * 60 + minutos)
  }

  const soMinutos = texto.match(/^(\d+)\s*(?:min|minuto|minutos)$/)
  if (soMinutos) return positivo(parseInt(soMinutos[1], 10))

  const horasTexto = texto.match(
    /^(\d+)\s*(?:hora|horas)(?:\s*e\s*(?:(\d+)\s*(?:min|minuto|minutos)?|(meia)))?$/,
  )
  if (horasTexto) {
    const horas = parseInt(horasTexto[1], 10)
    if (horasTexto[3] === 'meia') return positivo(horas * 60 + 30)
    const minutos = horasTexto[2] ? parseInt(horasTexto[2], 10) : 0
    if (minutos >= 60) return null
    return positivo(horas * 60 + minutos)
  }

  return null
}

/** Duração em minutos com fallback padrão de 60 para textos não reconhecidos. */
export function parseDuracao(duracao: string | undefined): number {
  return duracaoParaMinutos(duracao) ?? 60
}

/**
 * Validação do cadastro do pacote: a duração precisa ser reconhecível, exceto
 * para pacotes que bloqueiam o dia inteiro (onde o texto é livre/irrelevante).
 */
export function duracaoValida(duracao: string | null | undefined, bloqueiaDiaInteiro?: boolean): boolean {
  return Boolean(bloqueiaDiaInteiro) || duracaoParaMinutos(duracao) !== null
}
