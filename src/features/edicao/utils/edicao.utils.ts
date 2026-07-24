import type { StatusEdicao } from '../types'

export function formatEdicaoStatus(status: StatusEdicao): string {
  const map: Record<StatusEdicao, string> = {
    AGUARDANDO_RAW: 'Aguardando RAW',
    RAW_ENVIADOS: 'RAW Enviados',
    EM_EDICAO: 'Em Edição',
    EDICAO_CONCLUIDA: 'Edição Concluída',
  }
  return map[status] ?? status
}
