import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { galeriaResumoQueryKey } from '@/shared/constants'

interface GaleriasPendentesResumo {
  selecaoEmEdicao: number
  selecaoAguardandoAprovacao: number
  comprasAguardandoComprovante: number
  comprasAguardandoConfirmacao: number
}

interface UseGaleriasPendentesOptions {
  enabled?: boolean
  userId?: string
  papel?: string | null
}

const PAPEIS_COM_COMPRAS = ['ADMIN', 'FOTOGRAFO']

/**
 * Fonte compartilhada das pendências da Central de Galerias.
 *
 * Conta o que ainda depende de ação do estúdio: seleções ativas (enviadas,
 * em edição ou concluídas aguardando publicação) e compras de extras
 * aguardando comprovante/confirmação. Sidebar, barra inferior do mobile e o
 * painel da Central compartilham a mesma entrada de cache (polling de 60s,
 * não há WebSocket) — quando o estúdio publica a edição ou aprova a compra o
 * badge some na próxima invalidação/refetch.
 */
export function useGaleriasPendentes({
  enabled = true,
  userId,
  papel,
}: UseGaleriasPendentesOptions = {}) {
  const podeVerCompras = !!papel && PAPEIS_COM_COMPRAS.includes(papel)

  const { data, isLoading } = useQuery({
    queryKey: galeriaResumoQueryKey(userId, papel),
    queryFn: async () => {
      const { data } = await apiClient.get<GaleriasPendentesResumo>('/admin/galerias/pipeline/resumo')
      return data
    },
    enabled: enabled && !!papel,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return useMemo(() => {
    const selecoesPendentes =
      (data?.selecaoEmEdicao ?? 0) + (data?.selecaoAguardandoAprovacao ?? 0)
    const comprasPendentes = podeVerCompras
      ? (data?.comprasAguardandoComprovante ?? 0) + (data?.comprasAguardandoConfirmacao ?? 0)
      : 0

    return {
      selecoesPendentes,
      comprasPendentes,
      total: selecoesPendentes + comprasPendentes,
      isLoading,
    }
  }, [data, podeVerCompras, isLoading])
}
