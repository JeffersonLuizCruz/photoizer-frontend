import { Camera, Check, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { EtapaGaleria, GaleriaStatusResponse } from '../../types/ecommerce.types'

interface GaleriaEmPreparacaoProps {
  status: GaleriaStatusResponse | null
  onRefresh: () => void
  isRefreshing?: boolean
}

const PASSOS: Array<{ titulo: string; etapas: EtapaGaleria[] }> = [
  { titulo: 'Preparação', etapas: ['AGUARDANDO_UPLOAD', 'FOTOS_NAO_PUBLICADAS'] },
  { titulo: 'Escolha', etapas: ['AGUARDANDO_SELECAO'] },
  { titulo: 'Edição', etapas: ['SELECAO_EM_EDICAO', 'SELECAO_AGUARDANDO_APROVACAO'] },
  { titulo: 'Entrega', etapas: ['AGUARDANDO_DOWNLOAD', 'CONCLUIDA'] },
]

function formatarData(valor: string | null | undefined, opcoes?: Intl.DateTimeFormatOptions): string | null {
  if (!valor) return null
  const data = valor.length === 10 ? new Date(`${valor}T00:00:00`) : new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', opcoes ?? { day: '2-digit', month: 'long', year: 'numeric' }).format(data)
}

export function GaleriaEmPreparacao({ status, onRefresh, isRefreshing = false }: GaleriaEmPreparacaoProps) {
  const etapaAtual = status ? PASSOS.findIndex((passo) => passo.etapas.includes(status.etapa)) : 0
  const indiceAtual = etapaAtual < 0 ? 0 : etapaAtual
  const previsao = formatarData(status?.previsaoEntrega)
  const selecaoEnviada = formatarData(status?.selecaoEnviadaEm, { day: '2-digit', month: 'short' })
  const entregue = status?.etapa === 'CONCLUIDA'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gallery-bg px-4 py-12 text-gallery-ink">
      <div className="w-full max-w-md text-center">
        <Camera className="mx-auto h-10 w-10 text-gallery-accent" />

        <p className="mt-5 text-[10px] uppercase tracking-[0.42em] text-gallery-muted">
          {status?.etapaLabel ?? 'Seu ensaio'}
        </p>
        <h1 className="mt-3 text-balance font-display text-2xl sm:text-3xl">
          {entregue ? 'Seu ensaio foi entregue' : 'Estamos cuidando do seu ensaio'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gallery-muted">
          {status?.mensagem ?? 'As fotos ainda não chegaram. Assim que o estúdio publicar sua galeria, elas aparecerão aqui.'}
        </p>

        <ol className="relative mt-9 grid grid-cols-4 gap-2">
          <div className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-gallery-line" aria-hidden="true" />
          {PASSOS.map((passo, index) => {
            const concluido = index < indiceAtual || entregue
            const ativo = index === indiceAtual && !entregue
            return (
              <li key={passo.titulo} className="relative flex flex-col items-center text-center">
                <span
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold',
                    concluido
                      ? 'border-gallery-accent bg-gallery-accent text-white'
                      : ativo
                        ? 'border-gallery-accent bg-gallery-bg text-gallery-accent'
                        : 'border-gallery-line bg-gallery-bg text-gallery-muted',
                  )}
                >
                  {concluido ? <Check className="h-4 w-4" /> : ativo ? <Clock className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'mt-2 text-[11px] font-medium',
                    concluido || ativo ? 'text-gallery-ink' : 'text-gallery-muted',
                  )}
                >
                  {passo.titulo}
                </span>
              </li>
            )
          })}
        </ol>

        {(previsao || selecaoEnviada) && (
          <div className="mt-8 space-y-1 text-[11px] text-gallery-muted">
            {previsao && !entregue && <p>Previsão de entrega: {previsao}</p>}
            {selecaoEnviada && <p>Seleção recebida em {selecaoEnviada}</p>}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="min-h-11 rounded-full border border-gallery-line px-5 text-xs font-semibold text-gallery-ink transition-colors hover:bg-gallery-surface disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              Atualizar
            </span>
          </button>
          <p className="text-[10px] text-gallery-muted/80">
            Esta página atualiza automaticamente. Você pode voltar mais tarde.
          </p>
        </div>
      </div>
    </div>
  )
}
