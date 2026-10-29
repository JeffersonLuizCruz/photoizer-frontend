import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { AGENDAMENTO_STATUS, QUERY_KEYS } from '@/shared/constants'
import type { Agendamento } from '@/features/agenda/types'

interface UseEntregasPendentesOptions {
  enabled?: boolean
  userId?: string
}

/**
 * Fonte compartilhada das entregas pendentes (agendamentos em EM_EDICAO).
 *
 * A query key inclui o usuário para evitar que o cache de um login anterior
 * seja exibido para outro usuário no mesmo navegador. Dashboard, sidebar,
 * mobile nav e toast compartilham a mesma entrada de cache.
 */
export function useEntregasPendentes({ enabled = true, userId }: UseEntregasPendentesOptions = {}) {
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.AGENDA, 'list', undefined, userId],
    queryFn: async () => {
      const { data } = await apiClient.get<Agendamento[]>('/agendamentos')
      return data
    },
    enabled,
  })

  return useMemo(() => {
    const entregasPendentes = (data ?? [])
      .filter((agendamento) => agendamento.status === AGENDAMENTO_STATUS.EM_EDICAO)
      .sort((a, b) => {
        const aData = new Date(a.dataRealizacao ?? a.dataHoraEnsaio).getTime()
        const bData = new Date(b.dataRealizacao ?? b.dataHoraEnsaio).getTime()
        return aData - bData
      })

    return {
      entregasPendentes,
      quantidade: entregasPendentes.length,
      maisAntiga: entregasPendentes[0] ?? null,
      isLoading,
    }
  }, [data, isLoading])
}
