import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/shared/api'
import { formatarBytes } from '@/shared/lib/bytes'
import { armazenamentoService } from '../services/armazenamento.service'

const QUERY_KEY = 'armazenamento'

export function useArmazenamentoResumo() {
  return useQuery({
    queryKey: [QUERY_KEY, 'resumo'],
    queryFn: () => armazenamentoService.resumo(),
    refetchInterval: 60_000,
  })
}

export function useGaleriasArmazenamento() {
  return useQuery({
    queryKey: [QUERY_KEY, 'galerias'],
    queryFn: () => armazenamentoService.galerias(),
    refetchInterval: 60_000,
  })
}

export function useGaleriaArmazenamento(agendamentoId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'galeria', agendamentoId],
    queryFn: () => armazenamentoService.galeria(agendamentoId!),
    enabled: !!agendamentoId,
  })
}

export function useExpurgarGaleria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agendamentoId: string) => armazenamentoService.expurgar(agendamentoId),
    onSuccess: (resultado, agendamentoId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['galeria-ensaio', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
      toast.success(
        `${resultado.fotos} foto(s) expurgada(s) · ${formatarBytes(resultado.bytesLiberados)} liberados`,
      )
    },
    onError: (error: Error) =>
      toast.error(extractErrorMessage(error, 'Não foi possível expurgar a galeria')),
  })
}
