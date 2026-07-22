export const ROUTES = {
  DASHBOARD: '/',
  CLIENTES_NOVO: '/clientes/novo',
  CLIENTES_EDITAR: '/clientes/:id/editar',
  CLIENTES: '/clientes',
  AGENDA: '/agenda',
  AGENDA_NOVO: '/agenda/novo',
  AGENDA_DETALHES: '/agenda/:id',
  AGENDA_EDITAR: '/agenda/:id/editar',
  PACOTES: '/pacotes',
  PACOTES_NOVO: '/pacotes/novo',
  PACOTES_EDITAR: '/pacotes/:id/editar',
  FINANCEIRO: '/financeiro',
  FINANCEIRO_RELATORIOS: '/financeiro/relatorios',
  TAREFAS: '/tarefas',
} as const

export const QUERY_KEYS = {
  CLIENTES: ['clientes'],
  AGENDA: ['agenda'],
  PACOTES: ['pacotes'],
  FINANCEIRO: ['financeiro'],
  DASHBOARD: ['dashboard'],
  TAREFAS: ['tarefas'],
} as const

export const AGENDAMENTO_STATUS = {
  CONFIRMADO: 'CONFIRMADO',
  REALIZADO: 'REALIZADO',
  AGUARDANDO_PAGAMENTO_FINAL: 'AGUARDANDO_PAGAMENTO_FINAL',
  EM_EDICAO: 'EM_EDICAO',
  SELECAO_DAS_FOTOS: 'SELECAO_DAS_FOTOS',
  FOTOS_ENVIADAS_PARA_SELECAO: 'FOTOS_ENVIADAS_PARA_SELECAO',
  FOTOS_ENTREGUES: 'FOTOS_ENTREGUES',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
  NO_SHOW: 'NO_SHOW',
} as const

export const TAREFA_STATUS = {
  PENDENTE: 'PENDENTE',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDA: 'CONCLUIDA',
  ATRASADA: 'ATRASADA',
} as const

export const TAREFA_TIPO = {
  EDITAR_FOTOS: 'EDITAR_FOTOS',
  ENVIAR_PARA_SELECAO: 'ENVIAR_PARA_SELECAO',
  ENTREGA_FINAL: 'ENTREGA_FINAL',
} as const

export const ORIGEM = {
  INDICACAO: 'INDICACAO',
  ANUNCIO: 'ANUNCIO',
  OUTROS: 'OUTROS',
} as const

export type AgendamentoStatus = (typeof AGENDAMENTO_STATUS)[keyof typeof AGENDAMENTO_STATUS]
export type TarefaStatus = (typeof TAREFA_STATUS)[keyof typeof TAREFA_STATUS]
export type TarefaTipo = (typeof TAREFA_TIPO)[keyof typeof TAREFA_TIPO]
export type Origem = (typeof ORIGEM)[keyof typeof ORIGEM]
