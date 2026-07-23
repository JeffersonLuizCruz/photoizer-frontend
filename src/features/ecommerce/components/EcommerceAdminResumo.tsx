import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Link2, Loader2, Check, X, ImagePlus, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { useState } from 'react'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface EcommerceAdminResumoProps {
  agendamentoId: string
}

export function EcommerceAdminResumo({ agendamentoId }: EcommerceAdminResumoProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ecommerce', agendamentoId],
    queryFn: () => ecommerceService.adminResumo(agendamentoId),
  })

  const { mutate: overrideSelecao } = useMutation({
    mutationFn: ({ fotoId, selecionada }: { fotoId: string; selecionada: boolean }) =>
      ecommerceService.adminOverrideSelecao(agendamentoId, fotoId, selecionada),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      toast.success('Seleção atualizada')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao atualizar seleção'),
  })

  const { mutate: regenToken, isPending: isRegenning } = useMutation({
    mutationFn: () => ecommerceService.adminRegenToken(agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      setShowRegenConfirm(false)
      toast.success('Token regenerado! O link anterior não funciona mais.')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao regenerar token'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ImagePlus className="h-8 w-8 mb-2" />
        <p className="text-sm">Nenhum dado disponível</p>
      </div>
    )
  }

  const copiarLink = () => {
    const link = `${window.location.origin}${data.linkGaleria}`
    navigator.clipboard.writeText(link)
    toast.success('Link da galeria copiado!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={copiarLink}>
            <Link2 className="mr-1 h-4 w-4" />
            Copiar Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRegenConfirm(true)} disabled={isRegenning}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Regenerar Token
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos`)}>
            <ImagePlus className="mr-1 h-4 w-4" />
            Upload Fotos
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}`)}>
            <DollarSign className="mr-1 h-4 w-4" />
            Ver Financeiro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold">{data.totalFotos}</p>
        </div>
        <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-3">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Publicadas</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{data.fotosPublicadas}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">No Pacote</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{data.fotosSelecionadasPacote}</p>
        </div>
        <div className="rounded-lg border bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 p-3">
          <p className="text-xs text-violet-600 dark:text-violet-400">Pagas</p>
          <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{data.fotosPagas}</p>
        </div>
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400">Aguardando</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{data.fotosAguardando}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Valor Extras</p>
          <p className="text-lg font-bold">{formatCurrency(data.valorTotalExtras)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Fotos ({data.fotos.length})</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {data.fotos.map((foto) => (
            <div key={foto.id} className="group relative rounded-lg border bg-card overflow-hidden">
              <div className="aspect-[3/2] relative">
                <img src={foto.thumbUrl} alt={foto.fileName} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  {foto.status === 'PUBLICADA' && (
                    <button
                      onClick={() => overrideSelecao({ fotoId: foto.id, selecionada: !foto.selecionadaPacote })}
                      className={`h-6 w-6 rounded-full flex items-center justify-center ${foto.selecionadaPacote ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      title={foto.selecionadaPacote ? 'Remover do pacote' : 'Incluir no pacote'}
                    >
                      {foto.selecionadaPacote ? <X className="h-3 w-3 text-white" /> : <Check className="h-3 w-3 text-white" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-1">
                <span className={`block text-[9px] font-medium px-1 py-0.5 rounded text-center ${
                  foto.status === 'PAGA' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                  foto.status === 'PUBLICADA' && foto.selecionadaPacote ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  foto.status === 'PUBLICADA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  foto.status === 'AGUARDANDO_CONFIRMACAO' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  foto.status === 'AGUARDANDO_COMPROVANTE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {foto.status === 'PAGA' ? 'Paga' :
                   foto.status === 'PUBLICADA' && foto.selecionadaPacote ? 'Selec.' :
                   foto.status === 'PUBLICADA' ? 'Pub.' :
                   foto.status === 'AGUARDANDO_CONFIRMACAO' ? 'Aguad. Conf.' :
                   foto.status === 'AGUARDANDO_COMPROVANTE' ? 'Aguad. Comp.' : foto.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.comprasExtras.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Compras de Extras</h3>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-xs">ID</th>
                  <th className="text-right px-3 py-2 font-medium text-xs">Valor</th>
                  <th className="text-center px-3 py-2 font-medium text-xs">Status</th>
                  <th className="text-center px-3 py-2 font-medium text-xs">Data Pagamento</th>
                  <th className="text-center px-3 py-2 font-medium text-xs">Comprovante</th>
                </tr>
              </thead>
              <tbody>
                {data.comprasExtras.map((compra) => (
                  <tr key={compra.id} className="border-b last:border-0">
                    <td className="px-3 py-2 text-xs font-mono">{compra.id.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(compra.valorTotal)}</td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge status={compra.status === 'PAGA' ? 'active' : compra.status === 'AGUARDANDO_CONFIRMACAO' ? 'warning' : 'inactive'}
                        customLabels={{
                          active: { label: 'Pago', variant: 'success' },
                          warning: { label: 'Aguad. Confirmação', variant: 'warning' },
                          inactive: { label: 'Aguad. Comprovante', variant: 'secondary' },
                        }} />
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                      {compra.dataPagamento ? new Date(compra.dataPagamento).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {compra.urlComprovante ? (
                        <a href={compra.urlComprovante} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Ver</a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showRegenConfirm}
        onOpenChange={setShowRegenConfirm}
        onConfirm={() => regenToken()}
        isLoading={isRegenning}
        title="Regenerar Token?"
        description="O link atual da galeria deixará de funcionar. Um novo link será gerado. Tem certeza?"
        confirmText="Regenerar"
        variant="destructive"
      />
    </div>
  )
}
