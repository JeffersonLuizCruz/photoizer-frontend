export const ROUTES = {
  DASHBOARD: '/',
  DASHBOARD_DETALHES: '/dashboard/detalhes',
  AGENDA: '/agenda',
  AGENDA_NOVO: '/agenda/novo',
  AGENDA_DETALHES: '/agenda/:id',
  AGENDA_EDITAR: '/agenda/:id/editar',
  PACOTES: '/pacotes',
  PACOTES_NOVO: '/pacotes/novo',
  PACOTES_EDITAR: '/pacotes/:id/editar',
  FINANCEIRO: '/financeiro',
  FINANCEIRO_RELATORIOS: '/financeiro/relatorios',
  CONFIG: '/config',
  COMISSOES: '/comissoes',
  AGENDA_GALERIA: '/agenda/:id/fotos',
  ADMIN_ECOMMERCE: '/admin/ecommerce',
  ADMIN_CUPONS: '/admin/cupons',
  ADMIN_ANALYTICS: '/admin/analytics',
  LOGIN: '/login',
  ACESSO_CLIENTE: '/acesso-cliente',
  MINHA_CONTA: '/minha-conta',
  PACOTES_DISPONIVEIS: '/pacotes-disponiveis',
  CHECKOUT: '/checkout/pacote/:pacoteId',
  EDICAO: '/edicao',
  EDICAO_AGENDAMENTO: '/edicao/:agendamentoId',
  EDICAO_UPLOAD_RAW: '/edicao/:agendamentoId/upload-raw',
  EDICAO_REVISAO: '/edicao/:agendamentoId/revisao',
  NOTIFICACOES: '/notificacoes',
} as const

export const QUERY_KEYS = {
  CLIENTES: ['clientes'],
  AGENDA: ['agenda'],
  PACOTES: ['pacotes'],
  FINANCEIRO: ['financeiro'],
  DASHBOARD: ['dashboard'],
  EDICAO: ['edicao'],
  NOTIFICACOES: ['notificacoes'],
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
  RASCUNHO: 'RASCUNHO',
} as const

export const ORIGEM = {
  INDICACAO: 'INDICACAO',
  ANUNCIO: 'ANUNCIO',
  OUTROS: 'OUTROS',
} as const

export type AgendamentoStatus = (typeof AGENDAMENTO_STATUS)[keyof typeof AGENDAMENTO_STATUS]
export type Origem = (typeof ORIGEM)[keyof typeof ORIGEM]
