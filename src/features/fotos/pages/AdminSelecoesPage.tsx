import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Check, ChevronRight, Clock, Download, History, Loader2, Package, RefreshCw, ShoppingBag, Upload, X, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import { PageLoading } from '@/shared/components/layout/Loading'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { ROUTES, QUERY_KEYS } from '@/shared/constants'
import { extractErrorMessage } from '@/shared/api'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import type {
  SelecaoEnsaioItemResponse,
  SelecaoEnsaioResponse,
  SelecaoPendenteResponse,
} from '@/features/ecommerce/types/ecommerce.types'
import { fotoService } from '../services/foto.service'
import { ExtrasCompraPendentesSection } from '../components/galeria-admin/ExtrasCompraPendentesSection'
import { fotoThumbUrl, numeroGaleriaLabel } from '@/shared/lib/foto'

function statusLabel(status: string, requerEdicao = true): string {
  switch (status) {
    case 'ENVIADA': return requerEdicao ? 'Aguardando início' : 'Aguardando aprovação'
    case 'EM_EDICAO': return 'Em edição'
    case 'CONCLUIDA': return 'Edição concluída'
    case 'PUBLICADA': return requerEdicao ? 'Publicada' : 'Aprovada'
    case 'CANCELADA': return 'Cancelada'
    default: return status
  }
}

function selecaoAtiva(status: string): boolean {
  return status === 'ENVIADA' || status === 'EM_EDICAO' || status === 'CONCLUIDA'
}

/**
 * A seleção ativa aceita a primeira edição; a publicada aceita reedição
 * enquanto a galeria não estiver arquivada. A reedição substitui a versão
 * entregue sem reabrir a seleção.
 */
function permiteEnviarEdicao(status: string, requerEdicao: boolean, arquivada: boolean): boolean {
  return selecaoAtiva(status) || (requerEdicao && status === 'PUBLICADA' && !arquivada)
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'ENVIADA': return 'bg-amber-100 text-amber-700'
    case 'EM_EDICAO': return 'bg-sky-100 text-sky-700'
    case 'CONCLUIDA': return 'bg-emerald-100 text-emerald-700'
    case 'PUBLICADA': return 'bg-emerald-100 text-emerald-700'
    case 'CANCELADA': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

function ErroSelecao({ mensagem, onRetry }: { mensagem: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-4 py-12 text-center">
      <AlertTriangle className="mb-2 h-8 w-8 text-amber-600" />
      <p className="text-sm font-medium">Não foi possível carregar a seleção</p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{mensagem}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

export function AdminSelecoesPage({
  requerEdicao = true,
  arquivada = false,
}: {
  requerEdicao?: boolean
  arquivada?: boolean
}) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const loteInputRef = useRef<HTMLInputElement>(null)
  const [pendentes, setPendentes] = useState<SelecaoPendenteResponse[]>([])
  const [selecao, setSelecao] = useState<SelecaoEnsaioResponse | null>(null)
  const [historico, setHistorico] = useState<SelecaoEnsaioResponse[]>([])
  const [historicoSelecao, setHistoricoSelecao] = useState<SelecaoEnsaioResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [uploadFotoId, setUploadFotoId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ atual: number; total: number } | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isReopening, setIsReopening] = useState(false)
  const [confirmReabrir, setConfirmReabrir] = useState(false)

  const carregar = useCallback(async () => {
    if (!id) {
      setIsLoading(true)
      try {
        setPendentes(await ecommerceService.adminSelecoesPendentes())
        setErro(null)
      } catch (err: unknown) {
        const mensagem = extractErrorMessage(err, 'Erro ao carregar seleções')
        setErro(mensagem)
        toast.error(mensagem)
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)
    try {
      const lista = await ecommerceService.adminSelecoesDoAgendamento(id)
      const ativa = lista.find((s) => s.status === 'ENVIADA' || s.status === 'EM_EDICAO' || s.status === 'CONCLUIDA')
      const publicada = lista.find((s) => s.status === 'PUBLICADA')
      setHistorico(lista)
      setSelecao(ativa ?? publicada ?? null)
      setErro(null)
    } catch (err: unknown) {
      const mensagem = extractErrorMessage(err, 'Erro ao carregar a seleção')
      setErro(mensagem)
      toast.error(mensagem)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void carregar()
  }, [carregar])

  // As abas do workspace leem fotos/seleção/resumo por React Query. Sem esta
  // invalidação, upload/publicação/reabertura deixam o overview defasado.
  const invalidarWorkspace = useCallback(() => {
    if (!id) return
    void queryClient.invalidateQueries({ queryKey: ['fotos', id] })
    void queryClient.invalidateQueries({ queryKey: ['selecoes-ensaio', id] })
    void queryClient.invalidateQueries({ queryKey: ['galeria-ensaio', id] })
    void queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', id] })
    // Atualiza o badge de pendências do menu (seleções aguardando o estúdio).
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GALERIAS })
  }, [id, queryClient])

  const abrirArquivoEdicao = (fotoId: string) => {
    setUploadFotoId(fotoId)
    inputRef.current?.click()
  }

  const handleArquivoEdicao = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !id || !uploadFotoId || !selecao
      || !permiteEnviarEdicao(selecao.status, requerEdicao, arquivada)
      || isBatchUploading) return
    setIsUploading(true)
    try {
      if (selecao.status === 'PUBLICADA') {
        await fotoService.uploadReedicao(id, uploadFotoId, file)
        toast.success('Reedição enviada. O cliente já pode baixar a nova versão.')
      } else {
        await fotoService.uploadEditada(id, uploadFotoId, file)
        toast.success('Versão editada enviada')
      }
      invalidarWorkspace()
      await carregar()
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao enviar a versão editada'))
    } finally {
      setIsUploading(false)
      setUploadFotoId(null)
    }
  }

  const handleArquivosLote = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!id || !selecao || files.length === 0
      || !permiteEnviarEdicao(selecao.status, requerEdicao, arquivada)
      || isUploading) return

    const reedicao = selecao.status === 'PUBLICADA'
    const base = (nome: string) => nome.replace(/\.[^.]+$/, '').toLowerCase()
    const normalizar = (nome: string) => base(nome)
      .replace(/[-_ ]?(edit|editada|edited|final)+$/g, '')
    const itensBase = new Map(
      selecao.itens.map((item) => [normalizar(item.nomeArquivo || ''), item]),
    )
    const pares: { file: File; item: SelecaoEnsaioItemResponse }[] = []
    const semPar: string[] = []
    for (const file of files) {
      const nomeNormalizado = normalizar(file.name)
      const numero = String(file.name.match(/^(\d{1,4})[_-]/)?.[1] ?? '').replace(/^0+/, '')
      const item = itensBase.get(nomeNormalizado)
        ?? selecao.itens.find((i) => file.name.toLowerCase().includes(i.fotoId.toLowerCase()))
        ?? selecao.itens.find((i) => numero && String(i.numeroGaleria) === numero)
      if (item) pares.push({ file, item })
      else semPar.push(file.name)
    }
    if (semPar.length > 0) {
      toast.error(`Sem correspondência pelo nome/número: ${semPar.join(', ')}`)
    }
    if (pares.length === 0) return

    setIsBatchUploading(true)
    const falhas: string[] = []
    try {
      for (let i = 0; i < pares.length; i++) {
        setBatchProgress({ atual: i + 1, total: pares.length })
        try {
          if (reedicao) {
            await fotoService.uploadReedicao(id, pares[i].item.fotoId, pares[i].file)
          } else {
            await fotoService.uploadEditada(id, pares[i].item.fotoId, pares[i].file)
          }
        } catch {
          falhas.push(pares[i].file.name)
        }
      }
      const enviadas = pares.length - falhas.length
      if (enviadas > 0) {
        toast.success(`${enviadas} foto(s) ${reedicao ? 'reeditada(s)' : 'editada(s)'} enviada(s)`)
      }
      if (falhas.length > 0) {
        toast.error(`Falha em ${falhas.length} arquivo(s): ${falhas.join(', ')}`)
      }
      if (enviadas > 0) invalidarWorkspace()
      await carregar()
    } finally {
      setIsBatchUploading(false)
      setBatchProgress(null)
    }
  }

  const publicar = async () => {
    if (!id || !selecao || !selecaoAtiva(selecao.status)) return
    setIsPublishing(true)
    try {
      await ecommerceService.adminPublicarSelecao(id, selecao.id)
      toast.success(requerEdicao
        ? 'Edição publicada! O cliente já pode comprar e baixar.'
        : 'Seleção aprovada! O cliente já pode baixar as fotos do pacote.')
      invalidarWorkspace()
      await carregar()
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao publicar a edição'))
    } finally {
      setIsPublishing(false)
    }
  }

  const reabrir = async () => {
    if (!id || !selecao || !selecao.podeReabrir) return
    setIsReopening(true)
    try {
      await ecommerceService.adminReabrirSelecao(id, selecao.id)
      toast.success('Seleção reaberta para o cliente ajustar')
      setConfirmReabrir(false)
      invalidarWorkspace()
      await carregar()
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao reabrir a seleção'))
    } finally {
      setIsReopening(false)
    }
  }

  if (isLoading) return <PageLoading />

  if (!id) {
    return (
      <div>
        <PageTitle
          title="Seleções para edição"
          breadcrumbs={[{ label: 'Agenda', href: ROUTES.AGENDA }, { label: 'Seleções' }]}
        />
        {erro ? (
          <ErroSelecao mensagem={erro} onRetry={() => void carregar()} />
        ) : pendentes.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhuma seleção aguardando edição.
          </div>
        ) : (
          <div className="space-y-3">
            {pendentes.map((p) => (
              <button
                key={p.selecaoId}
                onClick={() => navigate(`/agenda/${p.agendamentoId}/selecoes`)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.clienteNome}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.pacoteNome} · {p.quantidadePacote} do pacote · {p.quantidadeExtras} extra(s)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">
                    {statusLabel(p.status, p.requerEdicao)}
                  </span>
                  {!p.requerEdicao && (
                    <span className="rounded-full bg-sky-100 px-2 py-1 font-medium text-sky-700">
                      Seleção com edição
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {p.diasAguardando} dia(s)
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          <ExtrasCompraPendentesSection onChanged={() => void carregar()} />
        </div>
      </div>
    )
  }

  if (!selecao) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Seleção do cliente</h2>
          <p className="text-sm text-muted-foreground">
            O pacote e os extras escolhidos pelo cliente aparecerão aqui.
          </p>
        </div>
        {erro && <ErroSelecao mensagem={erro} onRetry={() => void carregar()} />}
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          {historico.length > 0
            ? 'Nenhuma seleção ativa. Aguardando o cliente enviar uma nova seleção.'
            : 'Este ensaio ainda não possui seleção enviada pelo cliente.'}
        </div>
        {historico.length > 0 && (
          <div className="mt-4">
            <HistoricoSelecoes historico={historico} onOpen={setHistoricoSelecao} requerEdicao={requerEdicao} />
          </div>
        )}
        <HistoricoSelecaoSheet
          selecao={historicoSelecao}
          onOpenChange={(open) => { if (!open) setHistoricoSelecao(null) }}
          requerEdicao={requerEdicao}
        />

        <div className="mt-6">
          <ExtrasCompraPendentesSection
            agendamentoId={id}
            onChanged={() => void carregar()}
          />
        </div>
      </div>
    )
  }

  const editadas = selecao.itens.filter((i) => i.editada).length
  const total = selecao.itens.length
  const ativa = selecaoAtiva(selecao.status)
  const publicada = selecao.status === 'PUBLICADA'
  const podeReeditar = requerEdicao && publicada && !arquivada
  const podeEnviarAgora = requerEdicao && (ativa || podeReeditar)
  const podePublicar = ativa && total > 0 && (requerEdicao ? editadas === total : true)
  const itensPacote = selecao.itens.filter((item) => item.tipo === 'PACOTE')
  const itensExtras = selecao.itens.filter((item) => item.tipo === 'EXTRA')
  const editadasPacote = itensPacote.filter((item) => item.editada).length
  const editadasExtras = itensExtras.filter((item) => item.editada).length
  const valorExtras = itensExtras.reduce((soma, item) => soma + (item.valorUnitario ?? 0), 0)
  const percentualEdicao = total > 0 ? Math.round((editadas / total) * 100) : 0
  const faltamEditar = Math.max(0, total - editadas)
  const historicoAnterior = historico.filter((item) => item.id !== selecao.id)

  return (
    <div className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleArquivoEdicao}
      />
      <input
        ref={loteInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleArquivosLote}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
          <div className="mr-auto">
            <p className="text-sm font-semibold">Seleção #{selecao.numero}</p>
            <p className="text-xs text-muted-foreground">
              {selecao.quantidadePacote} do pacote · {selecao.quantidadeExtras} extra(s)
              {valorExtras > 0 && ` · ${formatBRL(valorExtras)}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void carregar()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Atualizar
          </Button>
          {((ativa && requerEdicao) || podeReeditar) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loteInputRef.current?.click()}
              disabled={isBatchUploading}
            >
              {isBatchUploading
                ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                : podeReeditar ? <RefreshCw className="mr-1 h-4 w-4" /> : <Upload className="mr-1 h-4 w-4" />}
              {batchProgress
                ? `${batchProgress.atual}/${batchProgress.total}`
                : podeReeditar ? 'Enviar várias reedições' : 'Enviar várias editadas'}
            </Button>
          )}
          {ativa && requerEdicao && (
            <a
              href={ecommerceService.adminSelecaoZipUrl(id, selecao.id)}
              className="inline-flex h-8 items-center gap-1 rounded-md border bg-background px-3 text-xs font-medium hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Baixar originais
            </a>
          )}
          {(ativa || selecao.podeReabrir) && (
            <Button variant="outline" size="sm" onClick={() => setConfirmReabrir(true)}>
              <X className="mr-1 h-4 w-4" />
              Reabrir seleção
            </Button>
          )}
          {ativa && (
            <Button size="sm" onClick={publicar} disabled={!podePublicar || isPublishing || isBatchUploading}>
              {isPublishing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
              {requerEdicao ? 'Publicar edição' : 'Aprovar seleção'}
            </Button>
          )}
      </div>

      {podeReeditar && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-medium">Seleção publicada</p>
          <p className="mt-1">
            Se o cliente pedir um ajuste, reenvie a versão editada da foto. A nova versão
            substitui a anterior e fica disponível para download imediatamente.
          </p>
        </div>
      )}

      {erro && <ErroSelecao mensagem={erro} onRetry={() => void carregar()} />}

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(selecao.status)}`}>
            {statusLabel(selecao.status, requerEdicao)}
          </span>
          <span className="text-muted-foreground">
            Seleção #{selecao.numero} · enviada em {new Date(selecao.enviadaEm).toLocaleString('pt-BR')}
          </span>
        </div>

        <div className={`grid grid-cols-2 gap-3 ${requerEdicao ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
          <ResumoSelecao titulo="Pacote" valor={String(itensPacote.length)} />
          <ResumoSelecao
            titulo="Extras"
            valor={String(itensExtras.length)}
            detalhe={valorExtras > 0 ? formatBRL(valorExtras) : undefined}
            destaque={itensExtras.length > 0}
          />
          {requerEdicao && (
            <>
              <ResumoSelecao titulo="Editadas" valor={`${editadas}/${total}`} />
              <ResumoSelecao titulo="Progresso" valor={`${percentualEdicao}%`} />
            </>
          )}
        </div>

        {requerEdicao && (
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso da edição</span>
              <span className={percentualEdicao === 100 ? 'font-medium text-emerald-600' : 'font-medium text-amber-600'}>
                {percentualEdicao}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${percentualEdicao === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${percentualEdicao}%` }}
              />
            </div>
            {ativa && faltamEditar > 0 && (
              <p className="mt-1.5 text-[11px] text-amber-600">
                Faltam {faltamEditar} foto(s) para liberar a publicação.
              </p>
            )}
          </div>
        )}
      </div>

      {(isBatchUploading || batchProgress) && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Enviando editadas...</span>
            <span className="tabular-nums text-muted-foreground">
              {batchProgress?.atual ?? 0}/{batchProgress?.total ?? 0}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${batchProgress && batchProgress.total > 0 ? Math.round((batchProgress.atual / batchProgress.total) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Os arquivos são enviados em sequência; falhas individuais não interrompem o lote.
          </p>
        </div>
      )}

      {selecao.observacaoCliente && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4 text-sm">
          <p className="mb-1 text-xs font-semibold text-cyan-800">Observação do cliente</p>
          <p className="whitespace-pre-wrap text-cyan-950">{selecao.observacaoCliente}</p>
        </div>
      )}

      <SelecaoItensSection
        titulo="Fotos do pacote"
        icone={Package}
        itens={itensPacote}
        editadas={editadasPacote}
        descricao={podeReeditar
          ? 'Fotos já entregues. Reenvie a edição se o cliente pedir um ajuste.'
          : requerEdicao
            ? 'Essas fotos já estão incluídas no pacote, sem custo adicional.'
            : 'Essas fotos já estão incluídas no pacote e serão entregues em versão original.'}
        disabled={isUploading || isBatchUploading || !podeEnviarAgora}
        uploadingId={isUploading ? uploadFotoId : null}
        onUpload={abrirArquivoEdicao}
        readOnly={!podeEnviarAgora}
        requerEdicao={requerEdicao}
        publicada={podeReeditar}
      />

      <SelecaoItensSection
        titulo="Fotos extras"
        icone={ShoppingBag}
        itens={itensExtras}
        editadas={editadasExtras}
        descricao={podeReeditar
          ? 'Extras já entregues. Reenvie a edição se o cliente pedir um ajuste.'
          : requerEdicao
            ? 'Fotos adicionais escolhidas pelo cliente; o valor é congelado no envio da seleção.'
            : 'Fotos adicionais escolhidas pelo cliente; liberadas após a confirmação do pagamento.'}
        valorTotal={valorExtras}
        destaque
        disabled={isUploading || isBatchUploading || !podeEnviarAgora}
        uploadingId={isUploading ? uploadFotoId : null}
        onUpload={abrirArquivoEdicao}
        readOnly={!podeEnviarAgora}
        requerEdicao={requerEdicao}
        publicada={podeReeditar}
      />

      {historicoAnterior.length > 0 && (
        <HistoricoSelecoes
          historico={historicoAnterior}
          onOpen={setHistoricoSelecao}
          requerEdicao={requerEdicao}
        />
      )}

      <HistoricoSelecaoSheet
        selecao={historicoSelecao}
        onOpenChange={(open) => { if (!open) setHistoricoSelecao(null) }}
        requerEdicao={requerEdicao}
      />

      <ExtrasCompraPendentesSection
        agendamentoId={id}
        onChanged={() => {
          invalidarWorkspace()
          void carregar()
        }}
      />

      <ConfirmDialog
        open={confirmReabrir}
        onOpenChange={setConfirmReabrir}
        onConfirm={reabrir}
        isLoading={isReopening}
        title="Reabrir a seleção?"
        description={requerEdicao
          ? 'O cliente poderá alterar a seleção novamente. O trabalho de edição já feito não será perdido, mas a seleção atual será cancelada.'
          : 'O cliente poderá alterar a seleção novamente. A seleção aprovada será cancelada e ele precisará enviar uma nova.'}
        confirmText="Reabrir"
        variant="destructive"
      />
    </div>
  )
}

function ResumoSelecao({
  titulo,
  valor,
  detalhe,
  destaque = false,
}: {
  titulo: string
  valor: string
  detalhe?: string
  destaque?: boolean
}) {
  return (
    <div className={`rounded-lg border p-3 ${destaque ? 'border-orange-200 bg-orange-50/50' : 'bg-background'}`}>
      <p className="text-[11px] font-medium text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{valor}</p>
      {detalhe && <p className="text-[11px] text-muted-foreground">{detalhe}</p>}
    </div>
  )
}

function valorExtrasSelecao(selecao: SelecaoEnsaioResponse): number {
  return selecao.itens
    .filter((item) => item.tipo === 'EXTRA')
    .reduce((soma, item) => soma + (item.valorUnitario ?? 0), 0)
}

function SelecaoItensSection({
  titulo,
  icone: Icone,
  itens,
  editadas,
  descricao,
  valorTotal,
  destaque = false,
  disabled,
  uploadingId,
  onUpload,
  readOnly = false,
  requerEdicao = true,
  publicada = false,
}: {
  titulo: string
  icone: LucideIcon
  itens: SelecaoEnsaioItemResponse[]
  editadas: number
  descricao: string
  valorTotal?: number
  destaque?: boolean
  disabled: boolean
  uploadingId: string | null
  onUpload: (fotoId: string) => void
  readOnly?: boolean
  requerEdicao?: boolean
  publicada?: boolean
}) {
  const total = itens.length
  const percentual = total > 0 ? Math.round((editadas / total) * 100) : 0

  return (
    <section className={`rounded-xl border p-4 ${destaque ? 'border-orange-200 bg-orange-50/40' : 'bg-card'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <div className={`rounded-full p-2 ${destaque ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}>
            <Icone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{titulo} ({total})</h3>
            <p className="text-xs text-muted-foreground">{descricao}</p>
            {valorTotal != null && valorTotal > 0 && (
              <p className="mt-0.5 text-xs font-semibold text-orange-700">Total: {formatBRL(valorTotal)}</p>
            )}
          </div>
        </div>
        {requerEdicao && (
          <div className="text-right text-xs">
            <p className={percentual === 100 ? 'font-medium text-emerald-600' : 'font-medium text-amber-600'}>
              {editadas}/{total} editadas
            </p>
            <p className="text-muted-foreground">{percentual}%</p>
          </div>
        )}
      </div>

      {requerEdicao && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${percentual === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${percentual}%` }}
          />
        </div>
      )}

      {total === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Nenhuma foto nesta seção.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {itens.map((item) => (
            <ItemSelecaoCard
              key={item.fotoId}
              item={item}
              disabled={disabled}
              readOnly={readOnly}
              requerEdicao={requerEdicao}
              publicada={publicada}
              uploading={uploadingId === item.fotoId}
              onUpload={() => onUpload(item.fotoId)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function HistoricoSelecoes({
  historico,
  onOpen,
  requerEdicao = true,
}: {
  historico: SelecaoEnsaioResponse[]
  onOpen: (selecao: SelecaoEnsaioResponse) => void
  requerEdicao?: boolean
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Histórico de seleções</h3>
      </div>
      {historico.map((item) => {
        const extras = valorExtrasSelecao(item)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item)}
            className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="min-w-0">
              <p className="font-medium">Seleção #{item.numero}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantidadePacote} do pacote · {item.quantidadeExtras} extra(s)
                {extras > 0 && ` · ${formatBRL(extras)}`}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`rounded-full px-2 py-1 font-medium ${statusBadgeClass(item.status)}`}>
                {statusLabel(item.status, requerEdicao)}
              </span>
              <span>{new Date(item.enviadaEm).toLocaleDateString('pt-BR')}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        )
      })}
    </section>
  )
}

function HistoricoSelecaoSheet({
  selecao,
  onOpenChange,
  requerEdicao = true,
}: {
  selecao: SelecaoEnsaioResponse | null
  onOpenChange: (open: boolean) => void
  requerEdicao?: boolean
}) {
  const itens = selecao?.itens ?? []
  const itensPacote = itens.filter((item) => item.tipo === 'PACOTE')
  const itensExtras = itens.filter((item) => item.tipo === 'EXTRA')
  const editadas = itens.filter((item) => item.editada).length

  return (
    <Sheet open={selecao !== null} onOpenChange={onOpenChange}>
      <SheetContent className="gap-4">
        <SheetTitle className="pr-8 text-base">Histórico da seleção</SheetTitle>
        {selecao && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(selecao.status)}`}>
                {statusLabel(selecao.status, requerEdicao)}
              </span>
              <span className="text-muted-foreground">
                Seleção #{selecao.numero} · {new Date(selecao.enviadaEm).toLocaleString('pt-BR')}
              </span>
            </div>

            {selecao.observacaoCliente && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-cyan-800">Observação do cliente</p>
                <p className="whitespace-pre-wrap text-cyan-950">{selecao.observacaoCliente}</p>
              </div>
            )}

            <SelecaoItensSection
              titulo="Fotos do pacote"
              icone={Package}
              itens={itensPacote}
              editadas={itensPacote.filter((item) => item.editada).length}
              descricao="Fotos incluídas no pacote desta seleção."
              disabled
              uploadingId={null}
              onUpload={() => {}}
              readOnly
              requerEdicao={requerEdicao}
            />

            <SelecaoItensSection
              titulo="Fotos extras"
              icone={ShoppingBag}
              itens={itensExtras}
              editadas={itensExtras.filter((item) => item.editada).length}
              descricao="Fotos adicionais escolhidas nesta seleção."
              valorTotal={valorExtrasSelecao(selecao)}
              destaque
              disabled
              uploadingId={null}
              onUpload={() => {}}
              readOnly
              requerEdicao={requerEdicao}
            />

            {requerEdicao && (
              <p className="text-xs text-muted-foreground">
                {editadas} de {itens.length} foto(s) editada(s) nesta seleção.
              </p>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ItemSelecaoCard({
  item,
  disabled,
  readOnly = false,
  requerEdicao = true,
  publicada = false,
  uploading = false,
  onUpload,
}: {
  item: SelecaoEnsaioItemResponse
  disabled: boolean
  readOnly?: boolean
  requerEdicao?: boolean
  publicada?: boolean
  uploading?: boolean
  onUpload: () => void
}) {
  const foto = item.foto
  const acaoEdicao = publicada ? 'Reeditar' : item.editada ? 'Substituir editada' : 'Enviar editada'
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-[3/2] bg-muted">
        {foto ? (
          <AuthImage src={fotoThumbUrl(foto)} alt={`${numeroGaleriaLabel(item.numeroGaleria)} ${item.nomeArquivo}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Arquivo indisponível</div>
        )}
        <span className="absolute left-2 top-2 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur">
          {numeroGaleriaLabel(item.numeroGaleria)}
        </span>
        <span className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
          item.tipo === 'PACOTE' ? 'bg-teal-500 text-white' : 'bg-orange-400 text-white'
        }`}>
          {item.tipo === 'PACOTE' ? 'Pacote' : 'Extra'}
        </span>
        {item.editada && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Check className="h-3 w-3" /> Editada
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <p className="truncate text-xs font-medium" title={item.nomeArquivo ?? ''}>
          {item.nomeArquivo || 'Sem nome'}
        </p>
        {item.tipo === 'EXTRA' && (
          <p className="text-xs font-semibold text-orange-700">{formatBRL(item.valorUnitario ?? 0)}</p>
        )}
        {item.editada && item.editadaEm && (
          <p className="text-[10px] text-emerald-700">
            Editada em {new Date(item.editadaEm).toLocaleString('pt-BR')}
          </p>
        )}
        {!readOnly ? (
          <Button
            variant={publicada || item.editada ? 'outline' : 'default'}
            size="sm"
            className="w-full"
            onClick={onUpload}
            disabled={disabled || uploading}
            aria-label={
              publicada
                ? `Reeditar ${item.nomeArquivo}`
                : item.editada
                  ? `Substituir editada de ${item.nomeArquivo}`
                  : `Enviar editada de ${item.nomeArquivo}`
            }
          >
            {uploading
              ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              : publicada || item.editada
                ? <RefreshCw className="mr-1 h-4 w-4" />
                : <Upload className="mr-1 h-4 w-4" />}
            {uploading ? 'Enviando...' : acaoEdicao}
          </Button>
        ) : (
          <p className={`rounded-md py-2 text-center text-xs font-medium ${
            item.editada ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
          }`}>
            {item.editada ? 'Editada' : requerEdicao ? 'Aguardando edição' : 'Incluída'}
          </p>
        )}
      </div>
    </div>
  )
}
