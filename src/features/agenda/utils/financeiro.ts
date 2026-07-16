interface PacoteBase {
  valorBase: number
}

interface ExtraItem {
  valorTotal: number
}

export function calcularValores(
  pacote: PacoteBase,
  taxaDeslocamento = 0,
  extras: ExtraItem[] = [],
) {
  const valorTotal = pacote.valorBase + taxaDeslocamento
  const valorEntradaExigido = valorTotal * 0.3
  const valorRestante = valorTotal - valorEntradaExigido
  const somaExtras = extras.reduce((acc, e) => acc + e.valorTotal, 0)
  const valorTotalFinal = valorTotal + somaExtras

  return { valorTotal, valorEntradaExigido, valorRestante, valorTotalFinal }
}
