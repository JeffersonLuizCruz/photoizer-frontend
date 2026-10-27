import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Image,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Timer,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { copyToClipboard } from '@/shared/lib/clipboard'
import { cn } from '@/shared/lib/cn'
import { extractErrorMessage } from '@/shared/api'
import { ecommerceService } from '../services/ecommerce.service'
import { GALERIA_PIPELINE_KEYS, useGaleriaPipeline, useGaleriaPipelineResumo } from '../api/queries'
import type { EtapaGaleria, GaleriaPipelineItem, GaleriaPipelineResumo } from '../types/ecommerce.types'

type BadgeVariant = 'warning' | 'info' | 'success' | 'destructive' | 'default' | 'secondary'

const ETAPA_VARIANT: Record<EtapaGaleria, BadgeVariant> = {
  AGUARDANDO_UPLOAD: 'warning',
  FOTOS_NAO_PUBLICADAS: 'warning',
  SELECAO_EM_EDICAO: 'info',
  SELECAO_AGUARDANDO_APROVACAO: 'info',
  AGUARDANDO_SELECAO: 'secondary',
  AGUARDANDO_DOWNLOAD: 'default',
  CONCLUIDA: 'success',
  ARQUIVADA: 'secondary',
}

const ETAPAS: Array<{ value: EtapaGaleria; label: string }> = [
  { value: 'AGUARDANDO_UPLOAD', label: 'Aguardando envio de fotos' },
  { value: 'FOTOS_NAO_PUBLICADAS', label: 'Fotos aguardando publicação' },
  { value: 'AGUARDANDO_SELECAO', label: 'Aguardando escolha do cliente' },
  { value: 'SELECAO_EM_EDICAO', label: 'Seleção em edição' },
  { value: 'SELECAO_AGUARDANDO_APROVACAO', label: 'Seleção aguardando aprovação' },
  { value: 'AGUARDANDO_DOWNLOAD', label: 'Publicada, aguardando download' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'ARQUIVADA', label: 'Arquivada' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  const data = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  return data.toLocaleDateString('pt-BR')
}

interface ResumoCard {
  label: string
  value: number
  etapa?: EtapaGaleria
  atrasadas?: boolean
  tone?: 'default' | 'warning' | 'danger' | 'info'
  interativo?: boolean
}

function montarCards(resumo: GaleriaPipelineResumo | undefined): ResumoCard[] {
  return [
    { label: 'Sem fotos', value: resumo?.aguardandoUpload ?? 0, etapa: 'AGUARDANDO_UPLOAD', tone: 'warning' },
    { label: 'Fotos a publicar', value: resumo?.fotosNaoPublicadas ?? 0, etapa: 'FOTOS_NAO_PUBLICADAS', tone: 'warning' },
    { label: 'Com o cliente', value: resumo?.aguardandoSelecao ?? 0, etapa: 'AGUARDANDO_SELECAO', tone: 'info' },
    { label: 'Em edição', value: resumo?.selecaoEmEdicao ?? 0, etapa: 'SELECAO_EM_EDICAO', tone: 'info' },
    { label: 'Aprovar seleção', value: resumo?.selecaoAguardandoAprovacao ?? 0, etapa: 'SELECAO_AGUARDANDO_APROVACAO', tone: 'info' },
    { label: 'Aguardando download', value: resumo?.aguardandoDownload ?? 0, etapa: 'AGUARDANDO_DOWNLOAD' },
    { label: 'Atrasadas', value: resumo?.atrasadas ?? 0, atrasadas: true, tone: 'danger' },
    { label: 'Extras a editar', value: resumo?.extrasPendentesEdicao ?? 0, interativo: false },
  ]
}

const cardTone: Record<NonNullable<ResumoCard['tone']>, string> = {
  default: 'border bg-card',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-rose-200 bg-rose-50',
  info: 'border-sky-200 bg-sky-50',
}

function PipelineItemCard({
  item,
  podeVerFinanceiro,
  onRegenerarToken,
  regenerandoToken,
}: {
  item: GaleriaPipelineItem
  podeVerFinanceiro: boolean
  onRegenerarToken: (agendamentoId: string) => void
  regenerandoToken: boolean
}) {
  const navigate = useNavigate()
  const [copiado, setCopiado] = useState(false)

  const copiarLink = async () => {
    if (!item.linkGaleria) return
    try {
      await copyToClipboard(`${window.location.origin}${item.linkGaleria}`)
      setCopiado(true)
      toast.success('Link da galeria copiado')
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{item.clienteNome}</p>
            <StatusBadge
              status={item.etapa}
              customLabels={{ [item.etapa]: { label: item.etapaLabel, variant: ETAPA_VARIANT[item.etapa] } }}
            />
            {item.atrasada && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                <AlertTriangle className="h-3 w-3" /> Atrasada
              </span>
            )}
            {item.tokenExpirado && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <Link2 className="h-3 w-3" /> Link expirado
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {item.pacoteNome && <span>{item.pacoteNome}</span>}
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {formatDate(item.dataHoraEnsaio)}
            </span>
            {item.localEnsaio && <span>{item.localEnsaio}</span>}
            {item.prazoEntrega && <span>Entrega prevista: {formatDate(item.prazoEntrega)}</span>}
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3 w-3" /> {item.diasNaEtapa} dia(s) nesta etapa
            </span>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0">
          {item.linkGaleria && (
            <Button variant="outline" size="sm" onClick={copiarLink} aria-label="Copiar link da galeria">
              <Link2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{copiado ? 'Copiado' : 'Copiar link'}</span>
            </Button>
          )}
          {item.tokenExpirado && (
            <Button
              variant="outline"
              size="sm"
              disabled={regenerandoToken}
              onClick={() => onRegenerarToken(item.agendamentoId)}
            >
              <RefreshCw className={cn('h-4 w-4 sm:mr-1', regenerandoToken && 'animate-spin')} />
              <span className="hidden sm:inline">Novo link</span>
            </Button>
          )}
          <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(item.acaoUrl)}>
            {item.proximaAcao}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Image className="h-3.5 w-3.5" />
          {item.totalFotos} foto(s) · {item.fotosPublicadas} publicada(s)
        </span>
        <span>{item.fotosSelecionadas} no pacote</span>
        {item.fotosBaixadas > 0 && <span>{item.fotosBaixadas} baixada(s)</span>}
        {podeVerFinanceiro && item.valorExtras > 0 && (
          <span className="inline-flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" /> {formatCurrency(item.valorExtras)} em extras
          </span>
        )}
        {item.selecaoStatus && (
          <span>
            Seleção {item.selecaoNumero ? `#${item.selecaoNumero}` : ''} · {item.selecaoStatus.toLowerCase()}
          </span>
        )}
        {podeVerFinanceiro && item.comprasPendentes > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
            {item.comprasPendentes} pagamento(s) pendente(s)
          </span>
        )}
        {item.extrasPendentesEdicao > 0 && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700">
            {item.extrasPendentesEdicao} extra(s) a editar
          </span>
        )}
      </div>

      {item.linkGaleria && (
        <button
          type="button"
          onClick={() => window.open(item.linkGaleria!, '_blank', 'noopener,noreferrer')}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Abrir galeria do cliente
        </button>
      )}
    </div>
  )
}

export function GaleriaPipelinePanel({ podeVerFinanceiro = true }: { podeVerFinanceiro?: boolean }) {
  const queryClient = useQueryClient()
  const [etapa, setEtapa] = useState<EtapaGaleria | undefined>()
  const [busca, setBusca] = useState('')
  const [atrasadas, setAtrasadas] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 20
  const [isExporting, setIsExporting] = useState(false)

  const buscaDebounced = useDebounce(busca, 400)

  useEffect(() => {
    setPage(1)
  }, [buscaDebounced, etapa, atrasadas])

  const { data, isLoading, isError, error } = useGaleriaPipeline({
    etapa,
    busca: buscaDebounced || undefined,
    atrasadas: atrasadas || undefined,
    page,
    perPage,
  })
  const { data: resumo } = useGaleriaPipelineResumo()

  const { mutate: regenerarToken, isPending: regenerandoToken } = useMutation({
    mutationFn: (agendamentoId: string) => ecommerceService.adminRegenToken(agendamentoId),
    onSuccess: () => {
      toast.success('Novo link gerado. A validade anterior foi substituída.')
      void queryClient.invalidateQueries({ queryKey: ['galeria-pipeline'] })
      void queryClient.invalidateQueries({ queryKey: GALERIA_PIPELINE_KEYS.resumo })
    },
    onError: (err: Error) => toast.error(extractErrorMessage(err, 'Erro ao gerar novo link')),
  })

  const itens = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0
  const cards = montarCards(resumo)

  const selecionarCard = (card: ResumoCard) => {
    if (card.atrasadas) {
      setAtrasadas((valor) => !valor)
      return
    }
    setEtapa((valor) => (valor === card.etapa ? undefined : card.etapa))
  }

  const exportarCsv = async () => {
    setIsExporting(true)
    try {
      await ecommerceService.adminExportarGaleriaPipeline({
        etapa,
        busca: buscaDebounced || undefined,
        atrasadas: atrasadas || undefined,
      })
      toast.success('Fila exportada em CSV')
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Não foi possível exportar a fila'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible">
        {cards.map((card) => {
          const ativo = card.atrasadas ? atrasadas : etapa === card.etapa
          const classes = cn(
            'min-w-[140px] flex-shrink-0 rounded-lg border p-3 text-left transition-colors md:min-w-0',
            cardTone[card.tone ?? 'default'],
            card.interativo === false ? 'cursor-default' : 'hover:border-primary/40',
            ativo && card.interativo !== false && 'ring-2 ring-primary/40',
          )
          if (card.interativo === false) {
            return (
              <div key={card.label} className={classes}>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold tabular-nums">{card.value}</p>
              </div>
            )
          }
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => selecionarCard(card)}
              className={classes}
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-lg font-bold tabular-nums">{card.value}</p>
            </button>
          )
        })}
      </div>

      {resumo && resumo.atrasadas > 0 && !atrasadas && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="min-w-[200px] flex-1">
            <strong>{resumo.atrasadas}</strong> galeria(s) com o prazo do pacote vencido.
            Priorize estas entregas.
          </p>
          <Button variant="outline" size="sm" onClick={() => setAtrasadas(true)}>
            Ver atrasadas
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por cliente, pacote ou local"
            className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:h-9"
          />
        </div>
        <select
          value={etapa ?? ''}
          onChange={(event) => setEtapa((event.target.value || undefined) as EtapaGaleria | undefined)}
          className="h-11 rounded-lg border bg-background px-3 text-xs font-medium sm:h-9"
        >
          <option value="">Todas as etapas</option>
          {ETAPAS.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
          ))}
        </select>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-medium sm:h-9">
          <input
            type="checkbox"
            checked={atrasadas}
            onChange={(event) => setAtrasadas(event.target.checked)}
            className="h-4 w-4 rounded border"
          />
          Somente atrasadas
        </label>
        {(etapa || busca || atrasadas) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEtapa(undefined)
              setBusca('')
              setAtrasadas(false)
            }}
          >
            Limpar filtros
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={exportarCsv} disabled={isExporting}>
          {isExporting
            ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            : <Download className="mr-1 h-4 w-4" />}
          Exportar CSV
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border bg-card py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {extractErrorMessage(error, 'Não foi possível carregar a fila de galerias')}
        </div>
      )}

      {!isLoading && !isError && itens.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
          <Image className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhuma galeria nesta etapa</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajuste os filtros ou aguarde novos ensaios entrarem na fila.
          </p>
        </div>
      )}

      {!isLoading && !isError && itens.length > 0 && (
        <div className="space-y-3">
          {itens.map((item) => (
            <PipelineItemCard
              key={item.agendamentoId}
              item={item}
              podeVerFinanceiro={podeVerFinanceiro}
              onRegenerarToken={regenerarToken}
              regenerandoToken={regenerandoToken}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {total} galeria(s) · página {data?.page ?? 1} de {Math.max(totalPages, 1)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((valor) => Math.max(1, valor - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((valor) => valor + 1)}
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
