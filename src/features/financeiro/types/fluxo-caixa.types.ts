export interface FluxoCaixaBucket {
  rotulo: string
  inicio: string
  fim: string
  entradasPrevistas: number
  saidasPrevistas: number
  saldoPeriodo: number
  saldoAcumulado: number
  entradasRealizadas: number
  saidasRealizadas: number
}

export interface FluxoCaixaItem {
  id: string
  tipo: 'RECEITA' | 'DESPESA'
  descricao: string
  categoria: string
  data: string | null
  valor: number
  status: string
  origem: string
}

export interface FluxoCaixaData {
  inicio: string
  fim: string
  visao: 'MENSAL' | 'SEMANAL'
  entradasRealizadas: number
  saidasRealizadas: number
  entradasPrevistasTotal: number
  saidasPrevistasTotal: number
  saldoProjetadoFinal: number
  buckets: FluxoCaixaBucket[]
  itens: FluxoCaixaItem[]
}

export interface FluxoCaixaQueryParams {
  dataInicio?: string
  dataFim?: string
  visao?: 'MENSAL' | 'SEMANAL'
}
