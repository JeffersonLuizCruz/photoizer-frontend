const UNIDADES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const

/**
 * Formata bytes em unidade legível (pt-BR). Valores ausentes ou negativos
 * viram `0 B` para não poluir a interface com `NaN`/`undefined`.
 */
export function formatarBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNIDADES.length - 1,
  )
  const valor = bytes / 1024 ** indice
  const casas = indice === 0 ? 0 : valor >= 100 ? 0 : valor >= 10 ? 1 : 2

  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })} ${UNIDADES[indice]}`
}

export function formatarPercentual(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return '0%'
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}
