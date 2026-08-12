import type { ContratoStatus } from '@/shared/constants'
import { CONTRATO_STATUS } from '@/shared/constants'

export const STATUS_LABEL: Record<ContratoStatus, string> = {
  [CONTRATO_STATUS.RASCUNHO]: 'Rascunho',
  [CONTRATO_STATUS.PUBLICADO]: 'Publicado',
  [CONTRATO_STATUS.ASSINADO_PELO_CLIENTE]: 'Assinado pelo cliente',
  [CONTRATO_STATUS.PAGAMENTO_CONFIRMADO]: 'Pagamento confirmado',
  [CONTRATO_STATUS.APROVADO]: 'Aprovado',
  [CONTRATO_STATUS.DEVOLVIDO]: 'Devolvido',
  [CONTRATO_STATUS.CANCELADO]: 'Cancelado',
  [CONTRATO_STATUS.EXPIRADO]: 'Expirado',
}

export const STATUS_COR: Record<ContratoStatus, string> = {
  [CONTRATO_STATUS.RASCUNHO]: 'bg-gray-100 text-gray-700',
  [CONTRATO_STATUS.PUBLICADO]: 'bg-blue-100 text-blue-700',
  [CONTRATO_STATUS.ASSINADO_PELO_CLIENTE]: 'bg-yellow-100 text-yellow-700',
  [CONTRATO_STATUS.PAGAMENTO_CONFIRMADO]: 'bg-purple-100 text-purple-700',
  [CONTRATO_STATUS.APROVADO]: 'bg-green-100 text-green-700',
  [CONTRATO_STATUS.DEVOLVIDO]: 'bg-orange-100 text-orange-700',
  [CONTRATO_STATUS.CANCELADO]: 'bg-red-100 text-red-700',
  [CONTRATO_STATUS.EXPIRADO]: 'bg-gray-100 text-gray-500',
}