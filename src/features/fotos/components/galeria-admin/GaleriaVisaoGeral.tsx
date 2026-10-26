import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Loader2,
  ShoppingBag,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/shared/components/ui/button'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import { extractErrorMessage } from '@/shared/api'
import { fotoThumbUrl } from '@/shared/lib/foto'
import type { GaleriaEnsaioResponse, FotoEnsaio, SelecaoEnsaioResponse } from '@/features/ecommerce/types/ecommerce.types'
import type { AgendamentoRef } from '../../services/foto.service'
import type { GaleriaWorkspaceCounts } from '../../api/queries'

interface GaleriaVisaoGeralProps {
  agendamento: AgendamentoRef | undefined
  galeria: GaleriaEnsaioResponse | undefined
  fotos: FotoEnsaio[]
  counts: GaleriaWorkspaceCounts
  selecaoAtual: SelecaoEnsaioResponse | null
  isLoading: boolean
  error?: unknown
  onRetry?: () => void
  podeVerCompras: boolean
}

const FASES = [
  { id: 'SELECAO', label: 'Seleção' },
  { id: 'SELECAO_ENVIADA', label: 'Seleção enviada' },
  { id: 'EM_EDICAO', label: 'Em edição' },
  { id: 'COMERCIALIZACAO', label: 'Comercialização' },
] as const

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_SELECAO: Record<string, string> = {
  ENVIADA: 'Aguardando início',
  EM_EDICAO: 'Em edição',
  CONCLUIDA: 'Edição concluída',
  PUBLICADA: 'Publicada',
  CANCELADA: 'Cancelada',
}

function formatarData(data: string | null | undefined): string {
  if (!data) return 'Data não definida'
  const valor = new Date(data)
  if (Number.isNaN(valor.getTime())) return 'Data não definida'
  return format(valor, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

function ResumoCard({
  titulo,
  valor,
  detalhe,
  destaque = false,
}: {
  titulo: string
  valor: string | number
  detalhe?: string
  destaque?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${destaque ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}>
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {detalhe && <p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p>}
    </div>
  )
}

export function GaleriaVisaoGeral({
  agendamento,
  galeria,
  fotos,
  counts,
  selecaoAtual,
  isLoading,
  error,
  onRetry,
  podeVerCompras,
}: GaleriaVisaoGeralProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-4 py-16 text-center">
        <AlertTriangle className="mb-2 h-8 w-8 text-amber-600" />
        <p className="text-sm font-medium">Não foi possível carregar a visão geral</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {extractErrorMessage(error, 'Tente novamente em instantes.')}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    )
  }

  const capa = fotos.find((foto) => foto.id === galeria?.capaFotoId)
    ?? fotos.find((foto) => foto.destaque)
    ?? fotos[0]
    ?? null
  const faseAtual = FASES.findIndex((fase) => fase.id === galeria?.fase)
  const modoEdicao = galeria?.modo === 'COM_EDICAO'

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
              {capa ? (
                <AuthImage
                  src={fotoThumbUrl(capa)}
                  alt="Capa da galeria"
                  priority
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {agendamento?.pacoteNome || 'Galeria do ensaio'}
              </p>
              <h2 className="truncate text-lg font-semibold">
                {agendamento?.clienteNome || 'Cliente'}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatarData(agendamento?.dataHoraEnsaio)}
                </span>
                {agendamento?.localEnsaio && <span>{agendamento.localEnsaio}</span>}
              </p>
            </div>
          </div>

        </div>

        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="rounded-full bg-background px-2 py-1 font-medium text-foreground ring-1 ring-border">
            {modoEdicao ? 'Seleção + edição' : 'Fluxo direto'}
          </span>
          <span>
            {selecaoAtual
              ? `Seleção #${selecaoAtual.numero} · ${STATUS_SELECAO[selecaoAtual.status] ?? selecaoAtual.status}`
              : 'Nenhuma seleção enviada ainda'}
          </span>
        </div>
      </section>

      {modoEdicao && (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Etapa da galeria
          </p>
          <ol className="flex flex-wrap items-center gap-2">
            {FASES.map((fase, index) => {
              const concluida = faseAtual >= 0 && index < faseAtual
              const atual = faseAtual === index
              return (
                <li key={fase.id} className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      atual
                        ? 'bg-primary text-primary-foreground'
                        : concluida
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {concluida ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className={`text-xs ${atual ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {fase.label}
                  </span>
                  {index < FASES.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResumoCard titulo="Total de fotos" valor={counts.total} detalhe="Enviadas para a galeria" />
        <ResumoCard titulo="Publicadas" valor={counts.publicadas} detalhe="Visíveis ao cliente" />
        <ResumoCard titulo="No pacote" valor={counts.pacote} destaque />
        <ResumoCard
          titulo="Extras"
          valor={counts.extras}
          detalhe={counts.valorExtras > 0 ? formatBRL(counts.valorExtras) : 'Nenhum extra selecionado'}
          destaque={counts.extras > 0}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Aguardando edição</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{counts.aguardandoEdicao}</p>
            <p className="text-xs text-muted-foreground">Fotos da seleção sem versão editada</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <div className="rounded-full bg-violet-100 p-2 text-violet-700">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Compras pendentes</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {podeVerCompras ? counts.comprasPendentes : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {podeVerCompras ? 'Aguardando comprovante ou confirmação' : 'Disponível para administradores'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
