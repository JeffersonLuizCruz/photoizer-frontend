export interface DespesaRequest {
  descricao: string
  valor: number
  categoria: 'MANUTENCAO' | 'COMPRA'
  data: string
  observacao?: string
}

export interface DespesaResponse {
  id: string
  descricao: string
  valor: number
  categoria: string
  data: string
  observacao: string | null
}
