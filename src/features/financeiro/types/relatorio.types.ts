export interface ResumoMensalRelatorio {
  inicio: string
  fim: string
  receitasBrutas: number
  receitasRecebidas: number
  aReceber: number
  despesasTotal: number
  despesasPagas: number
  aPagar: number
  lucroPrevisto: number
  lucroRealizado: number
  margemLucro: number
  qtdReceitas: number
  qtdDespesas: number
}

export interface DespesaCategoriaItem {
  categoria: string
  cor: string
  valor: number
  qtd: number
  percentual: number
}

export interface DespesasCategoriaRelatorio {
  total: number
  categorias: DespesaCategoriaItem[]
}

export interface InadimplenciaItem {
  receitaId: string
  clienteNome: string
  tipoServico: string
  descricao: string | null
  valorFinal: number
  valorRecebido: number
  valorEmAberto: number
  dataPrevisaoRecebimento: string | null
  diasAtraso: number
}

export interface InadimplenciaRelatorio {
  totalEmAberto: number
  itens: InadimplenciaItem[]
}

export interface RentabilidadeServicoRelatorio {
  tipoServico: string
  receita: number
  liquido: number
  margem: number
}

export interface RentabilidadeClienteItem {
  clienteId: string
  clienteNome: string
  receitaBruta: number
  receitaLiquida: number
  recebido: number
  aReceber: number
  qtdReceitas: number
  margem: number
}

export interface RentabilidadeClienteRelatorio {
  clientes: RentabilidadeClienteItem[]
}

export interface ComparativoPeriodo {
  periodo: string
  receitas: number
  despesas: number
  lucro: number
  variacao: number
}

export interface ComparativoRelatorio {
  tipo: 'MENSAL' | 'ANUAL'
  periodos: ComparativoPeriodo[]
}

export interface RelatorioFiscalDespesa {
  categoria: string
  cor: string
  valor: number
}

export interface RelatorioFiscal {
  inicio: string
  fim: string
  totalReceitas: number
  totalComissoes: number
  totalDespesas: number
  lucroLiquido: number
  qtdReceitas: number
  qtdDespesas: number
  despesasPorCategoria: RelatorioFiscalDespesa[]
}

export const RELATORIOS_DISPONIVEIS = [
  { valor: 'resumo-mensal', label: 'Resumo mensal', descricao: 'Receitas, despesas e lucro do período' },
  { valor: 'despesas-categoria', label: 'Despesas por categoria', descricao: 'Totais e percentuais por categoria' },
  { valor: 'inadimplencia', label: 'Inadimplência', descricao: 'Valores a receber vencidos' },
  { valor: 'rentabilidade-servico', label: 'Rentabilidade por serviço', descricao: 'Lucro e margem por tipo de serviço' },
  { valor: 'rentabilidade-cliente', label: 'Rentabilidade por cliente', descricao: 'Receita, lucro e margem por cliente' },
  { valor: 'comparativo', label: 'Comparativo', descricao: 'Evolução mensal ou anual com variação' },
  { valor: 'fiscal', label: 'Relatório fiscal', descricao: 'Resumo simplificado para o contador' },
] as const

export type TipoRelatorio = (typeof RELATORIOS_DISPONIVEIS)[number]['valor']
