import { useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { extractErrorMessage } from '@/shared/api'
import { useColetarHistorico, useHistoricoArmazenamento } from '../api/queries'
import { HistoricoConsumoChart } from './HistoricoConsumoChart'
import { HistoricoConsumoTable } from './HistoricoConsumoTable'

const PERIODOS = [30, 90, 365] as const

export function HistoricoConsumoSection() {
  const [dias, setDias] = useState<number>(30)
  const historico = useHistoricoArmazenamento(dias)
  const coletar = useColetarHistorico()

  const snapshots = historico.data?.snapshots ?? []

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Histórico de consumo</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Um snapshot por dia, coletado às 23:55 (America/Sao_Paulo). O histórico começa na
            primeira coleta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5" role="group" aria-label="Período do histórico">
            {PERIODOS.map((periodo) => (
              <Button
                key={periodo}
                type="button"
                size="sm"
                variant={dias === periodo ? 'default' : 'outline'}
                aria-pressed={dias === periodo}
                onClick={() => setDias(periodo)}
              >
                {periodo} dias
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => coletar.mutate()}
            disabled={coletar.isPending}
          >
            {coletar.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-4 w-4" />
            )}
            Coletar agora
          </Button>
        </div>
      </div>

      {historico.isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando histórico...
        </div>
      ) : historico.isError ? (
        <div className="flex items-start gap-2 rounded-xl border bg-card p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
          <div>
            <p className="font-medium">Não foi possível carregar o histórico</p>
            <p className="text-xs text-muted-foreground">
              {extractErrorMessage(historico.error, 'Tente novamente em instantes.')}
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => void historico.refetch()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : snapshots.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Ainda não há histórico</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            O primeiro snapshot pode ser criado agora com o botão <strong>Coletar agora</strong>. A
            partir do segundo dia o gráfico de evolução fica disponível.
          </p>
        </div>
      ) : (
        <>
          {snapshots.length >= 2 ? (
            <HistoricoConsumoChart snapshots={snapshots} />
          ) : (
            <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
              Já existe um snapshot. O gráfico de evolução aparece a partir do segundo dia.
            </p>
          )}
          <HistoricoConsumoTable snapshots={snapshots} />
        </>
      )}
    </section>
  )
}
