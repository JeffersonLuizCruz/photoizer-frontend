import { Check, Clock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { FaseGaleria, SelecaoEnsaioResponse } from '../../types/ecommerce.types'

interface GaleriaTimelineProps {
  fase: FaseGaleria
  selecao: SelecaoEnsaioResponse | null
  requerEdicao?: boolean
}

function formatarData(valor: string | null | undefined): string | null {
  if (!valor) return null
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(data)
}

export function GaleriaTimeline({ fase, selecao, requerEdicao = true }: GaleriaTimelineProps) {
  const etapaAtual = fase === 'COMERCIALIZACAO' ? 3 : fase === 'EM_EDICAO' || fase === 'SELECAO_ENVIADA' ? 2 : 1
  const passos = requerEdicao
    ? [
        { titulo: 'Seleção enviada', data: formatarData(selecao?.enviadaEm) },
        { titulo: 'Em edição', data: formatarData(selecao?.iniciadaEm) },
        { titulo: 'Publicada', data: formatarData(selecao?.publicadaEm) },
      ]
    : [
        { titulo: 'Seleção enviada', data: formatarData(selecao?.enviadaEm) },
        { titulo: 'Aprovação', data: formatarData(selecao?.publicadaEm) },
        { titulo: 'Liberada', data: formatarData(selecao?.publicadaEm) },
      ]

  return (
    <div className="mx-auto mt-8 max-w-lg px-1">
      <div className="relative">
        <div className="absolute left-[16.6%] right-[16.6%] top-4 h-px bg-gallery-line" aria-hidden="true" />
        <ol className="relative grid grid-cols-3 gap-2">
          {passos.map((passo, index) => {
            const numero = index + 1
            const concluido = etapaAtual > numero || fase === 'COMERCIALIZACAO'
            const ativo = etapaAtual === numero && fase !== 'COMERCIALIZACAO'
            return (
              <li key={passo.titulo} className="flex flex-col items-center text-center">
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
                  {concluido ? <Check className="h-4 w-4" /> : ativo ? <Clock className="h-4 w-4" /> : numero}
                </span>
                <span className={cn(
                  'mt-2 text-[11px] font-medium',
                  concluido || ativo ? 'text-gallery-ink' : 'text-gallery-muted',
                )}>
                  {passo.titulo}
                </span>
                {passo.data && (
                  <span className="mt-0.5 text-[10px] text-gallery-muted">{passo.data}</span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
