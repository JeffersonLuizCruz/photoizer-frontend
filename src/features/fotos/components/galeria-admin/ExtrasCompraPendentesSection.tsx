import { useRef, useState, type ChangeEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Clock, Download, Loader2, RefreshCw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import { downloadProtected, extractErrorMessage } from '@/shared/api'
import { fotoThumbUrl, numeroGaleriaLabel } from '@/shared/lib/foto'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import type { FotoEnsaio } from '@/features/ecommerce/types/ecommerce.types'
import { fotoService } from '../../services/foto.service'

interface ExtrasCompraPendentesSectionProps {
  /** Quando definido, mostra apenas as pendências deste agendamento. */
  agendamentoId?: string
  onChanged?: () => void
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * Fila de edição sob demanda: fotos extras compradas depois da publicação da
 * galeria e que ainda precisam da versão editada do estúdio.
 */
export function ExtrasCompraPendentesSection({
  agendamentoId,
  onChanged,
}: ExtrasCompraPendentesSectionProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadAlvo, setUploadAlvo] = useState<{ agendamentoId: string; fotoId: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [liberandoId, setLiberandoId] = useState<string | null>(null)

  const queryKey = ['extras-compra-pendentes-edicao', agendamentoId ?? 'all']
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => ecommerceService.adminExtrasPendentesEdicao(agendamentoId),
  })

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey })
    void queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
    void queryClient.invalidateQueries({ queryKey: ['selecoes-ensaio', agendamentoId] })
    void queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
    onChanged?.()
  }

  const abrirUpload = (foto: FotoEnsaio) => {
    setUploadAlvo({ agendamentoId: foto.agendamentoId, fotoId: foto.id })
    inputRef.current?.click()
  }

  const handleArquivo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const alvo = uploadAlvo
    setUploadAlvo(null)
    if (!file || !alvo) return

    setIsUploading(true)
    try {
      await fotoService.uploadEditadaCompraExtra(alvo.agendamentoId, alvo.fotoId, file)
      toast.success('Versão editada enviada. Libere o download quando estiver pronta.')
      invalidar()
      await refetch()
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao enviar a versão editada'))
    } finally {
      setIsUploading(false)
    }
  }

  const liberar = async (foto: FotoEnsaio) => {
    setLiberandoId(foto.id)
    try {
      await fotoService.publicarEditadaCompraExtra(foto.agendamentoId, foto.id)
      toast.success('Edição liberada para download do cliente.')
      invalidar()
      await refetch()
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao liberar a edição'))
    } finally {
      setLiberandoId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border bg-card py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-4 py-8 text-center">
        <AlertTriangle className="mb-2 h-6 w-6 text-amber-600" />
        <p className="text-sm font-medium">Não foi possível carregar os extras comprados</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {extractErrorMessage(error, 'Tente novamente em instantes.')}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  const compras = data ?? []
  if (compras.length === 0) return null

  const totalFotos = compras.reduce((total, compra) => total + compra.fotos.length, 0)

  return (
    <section className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleArquivo}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-amber-600" />
            Extras comprados aguardando edição
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-700">
              {totalFotos}
            </span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Fotos compradas após a publicação. Envie a versão editada e libere o download
            para o cliente.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="space-y-3">
        {compras.map((compra) => (
          <div key={compra.compraId} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {compra.clienteNome || 'Cliente'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Compra #{compra.compraId.slice(0, 8)} · {formatBRL(compra.valorTotal)}
                  {compra.dataPagamento
                    ? ` · paga em ${new Date(compra.dataPagamento).toLocaleDateString('pt-BR')}`
                    : ''}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                {compra.fotos.length} foto(s)
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {compra.fotos.map((foto) => {
                const editada = foto.versaoAtual === 'EDITADA'
                const liberando = liberandoId === foto.id
                return (
                  <div key={foto.id} className="overflow-hidden rounded-xl border bg-background">
                    <div className="relative aspect-[3/2] bg-muted">
                      <AuthImage
                        src={fotoThumbUrl(foto)}
                        alt={`${numeroGaleriaLabel(foto.numeroGaleria)} ${foto.fileName}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-2 top-2 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur">
                        {numeroGaleriaLabel(foto.numeroGaleria)}
                      </span>
                    </div>
                    <div className="space-y-2 p-2.5">
                      <p className="truncate text-xs font-medium" title={foto.fileName}>
                        {foto.fileName}
                      </p>
                      {foto.originalUrl && (
                        <button
                          type="button"
                          onClick={() => downloadProtected(foto.originalUrl!, foto.fileName)}
                          className="flex w-full items-center justify-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          <Download className="h-3 w-3" />
                          Baixar original para editar
                        </button>
                      )}
                      {editada ? (
                        <p className="flex items-center justify-center gap-1 rounded-md bg-emerald-50 py-2 text-[11px] font-medium text-emerald-700">
                          <Check className="h-3.5 w-3.5" />
                          Editada
                        </p>
                      ) : foto.temVersaoEditada ? (
                        <>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => void liberar(foto)}
                            disabled={liberando || isUploading}
                          >
                            {liberando
                              ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              : <Check className="mr-1 h-4 w-4" />}
                            {liberando ? 'Liberando...' : 'Liberar edição'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => abrirUpload(foto)}
                            disabled={liberando || isUploading}
                          >
                            <Upload className="mr-1 h-4 w-4" />
                            Substituir
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => abrirUpload(foto)}
                            disabled={isUploading}
                          >
                            {isUploading
                              ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              : <Upload className="mr-1 h-4 w-4" />}
                            {isUploading ? 'Enviando...' : 'Enviar edição'}
                          </Button>
                          <p className="flex items-center justify-center gap-1 text-[10px] text-amber-600">
                            <Clock className="h-3 w-3" />
                            Aguardando edição
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
