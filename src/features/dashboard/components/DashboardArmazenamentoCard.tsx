import { Link } from 'react-router-dom'
import { AlertTriangle, HardDrive } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ROUTES } from '@/shared/constants'
import { formatarBytes, formatarPercentual } from '@/shared/lib/bytes'
import type { ArmazenamentoResumo } from '@/shared/types/armazenamento'

interface DashboardArmazenamentoCardProps {
  resumo: ArmazenamentoResumo
}

export function DashboardArmazenamentoCard({ resumo }: DashboardArmazenamentoCardProps) {
  const percentual = Math.min(100, Math.max(0, resumo.percentualUso))
  const critico = percentual >= 80
  const corBarra = critico ? 'bg-destructive' : percentual >= 60 ? 'bg-amber-500' : 'bg-primary'
  const usado = Math.max(0, resumo.volumeTotal - resumo.volumeLivre)

  return (
    <Card className={critico ? 'border-destructive/40 bg-destructive/5' : undefined}>
      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
        <div className={critico ? 'text-destructive' : 'text-muted-foreground'}>
          {critico ? <AlertTriangle className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-semibold">
              Armazenamento {critico ? 'quase cheio' : 'das galerias'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatarBytes(usado)} de {formatarBytes(resumo.volumeTotal)} ·{' '}
              <strong className={critico ? 'text-destructive' : 'text-foreground'}>
                {formatarPercentual(percentual)}
              </strong>
            </p>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentual)}
            aria-label="Uso do volume do servidor"
          >
            <div className={`h-full rounded-full ${corBarra}`} style={{ width: `${percentual}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {resumo.totalFotos} foto(s) em {resumo.totalGalerias} galeria(s) ·{' '}
            {formatarBytes(resumo.volumeLivre)} livres
          </p>
        </div>
        <Link
          to={ROUTES.ARMAZENAMENTO}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Gerenciar
        </Link>
      </CardContent>
    </Card>
  )
}
