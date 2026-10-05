import { Camera, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/shared/lib/format'

interface FotografoCardProps {
  totalEnsaios: number
  totalPartilha: number
  totalRepasse: number
  totalLucroCrm?: number
  showStudioProfit?: boolean
}

export function FotografoCard({ totalEnsaios, totalPartilha, totalRepasse, totalLucroCrm, showStudioProfit }: FotografoCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Total de Ensaios</p>
        </div>
        <p className="mt-1 text-xl font-bold sm:text-2xl">{totalEnsaios}</p>
      </div>
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Partilha Total</p>
        </div>
        <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{formatCurrency(totalPartilha)}</p>
      </div>
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          <p className="text-xs text-muted-foreground">Total a Receber</p>
        </div>
        <p className="mt-1 text-xl font-bold tabular-nums text-amber-600 sm:text-2xl">{formatCurrency(totalRepasse)}</p>
      </div>
      {showStudioProfit && totalLucroCrm != null && (
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <p className="text-xs text-muted-foreground">Lucro do Estúdio</p>
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 sm:text-2xl">{formatCurrency(totalLucroCrm)}</p>
        </div>
      )}
    </div>
  )
}