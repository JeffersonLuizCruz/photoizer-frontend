import type { ReactNode } from 'react'
import { FileText, HardDrive, Images, Layers } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/cn'
import { formatarBytes, formatarPercentual } from '@/shared/lib/bytes'
import type { ArmazenamentoResumo } from '../types/armazenamento.types'

interface ResumoArmazenamentoCardsProps {
  resumo: ArmazenamentoResumo
}

function Cartao({
  titulo,
  valor,
  detalhe,
  icone,
  destaque = false,
}: {
  titulo: string
  valor: string
  detalhe?: string
  icone: ReactNode
  destaque?: boolean
}) {
  return (
    <div className={cn('rounded-xl border p-4', destaque ? 'border-primary/30 bg-primary/5' : 'bg-card')}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icone}
        <p className="text-xs font-medium">{titulo}</p>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{valor}</p>
      {detalhe && <p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p>}
    </div>
  )
}

export function ResumoArmazenamentoCards({ resumo }: ResumoArmazenamentoCardsProps) {
  const derivados = resumo.bytesDerivados + resumo.bytesEditadas
  const documentos = resumo.bytesDocumentos + resumo.bytesPropostas
  const usado = Math.max(0, resumo.volumeTotal - resumo.volumeLivre)
  const percentual = Math.min(100, Math.max(0, resumo.percentualUso))
  const corBarra = percentual >= 80 ? 'bg-destructive' : percentual >= 60 ? 'bg-amber-500' : 'bg-primary'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartao
          titulo="Consumo dos uploads"
          valor={formatarBytes(resumo.bytesTotal)}
          detalhe={`${resumo.totalGalerias} galeria(s) · ${resumo.totalFotos} foto(s)`}
          icone={<HardDrive className="h-4 w-4" />}
          destaque
        />
        <Cartao
          titulo="Originais"
          valor={formatarBytes(resumo.bytesFotos)}
          detalhe="Maior parte do consumo"
          icone={<Images className="h-4 w-4" />}
        />
        <Cartao
          titulo="Derivados e editadas"
          valor={formatarBytes(derivados)}
          detalhe="Marca d'água, thumbs, prévias e editadas"
          icone={<Layers className="h-4 w-4" />}
        />
        <Cartao
          titulo="Documentos"
          valor={formatarBytes(documentos)}
          detalhe="Comprovantes e contratos (preservados)"
          icone={<FileText className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-medium">Volume do servidor</p>
            <p className="text-muted-foreground">
              {formatarBytes(usado)} usados de {formatarBytes(resumo.volumeTotal)} ·{' '}
              <span className="font-medium text-foreground">{formatarPercentual(percentual)}</span>
            </p>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentual)}
            aria-label="Uso do volume do servidor"
          >
            <div className={cn('h-full rounded-full transition-all', corBarra)} style={{ width: `${percentual}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>{formatarBytes(resumo.volumeLivre)} livres</span>
            <span>
              {resumo.galeriasArquivadas} galeria(s) arquivada(s) ·{' '}
              {formatarBytes(resumo.bytesLiberados)} liberados
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
