import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, FilterX } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { useFinanceiroRelatorios } from '../api/queries'
import { FiltroPeriodo } from '../components/FiltroPeriodo'
import type { DateRange } from '@/shared/components/layout/DateRangePicker'
import type { Agendamento } from '@/features/agenda/types'

function gerarCSV(agendamentos: Agendamento[]): string {
  const header = 'Data,Cliente,Local,Status,Valor Total,Entrada,Restante,Extras,Total Final'
  const rows = agendamentos.map((a) => {
    const data = format(new Date(a.dataHoraEnsaio), "dd/MM/yyyy", { locale: ptBR })
    return `${data},"${a.clienteId.slice(0, 8)}...","${a.localEnsaio}","${a.status}",${a.valorTotal.toFixed(2)},${a.valorEntradaPago.toFixed(2)},${a.valorRestante.toFixed(2)},${a.valorExtras.toFixed(2)},${a.valorTotalFinal.toFixed(2)}`
  })
  return [header, ...rows].join('\n')
}

function exportarCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function RelatoriosPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const dataInicio = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
  const dataFim = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

  const { data, isLoading } = useFinanceiroRelatorios(dataInicio, dataFim)

  const agendamentos = data?.agendamentos ?? []
  const totais = data?.totais

  const handleExport = useCallback(() => {
    if (agendamentos.length === 0) return
    const csv = gerarCSV(agendamentos)
    const periodo = dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, 'yyyyMMdd')}-${format(dateRange.to, 'yyyyMMdd')}`
      : 'completo'
    exportarCSV(csv, `relatorio-financeiro-${periodo}.csv`)
  }, [agendamentos, dateRange])

  const hasFilter = !!dateRange?.from || !!dateRange?.to

  return (
    <div>
      <PageTitle
        title="Relatórios Financeiros"
        description="Exporte relatórios financeiros por período"
        breadcrumbs={[
          { label: 'Financeiro', href: '/financeiro' },
          { label: 'Relatórios' },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FiltroPeriodo value={dateRange} onChange={setDateRange} />
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
              <FilterX className="mr-1 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        <Button onClick={handleExport} disabled={agendamentos.length === 0}>
          <Download className="mr-1 h-4 w-4" />
          Exportar CSV ({agendamentos.length})
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse h-8 w-full bg-muted rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-12 w-full bg-muted rounded" />
          ))}
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhum agendamento encontrado no período</p>
        </div>
      ) : (
        <div className="space-y-6">
          {totais && (
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold tabular-nums">R$ {totais.total.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="text-lg font-bold tabular-nums text-emerald-600">R$ {totais.entrada.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Restante</p>
                <p className="text-lg font-bold tabular-nums text-blue-600">R$ {totais.restante.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Extras</p>
                <p className="text-lg font-bold tabular-nums text-purple-600">R$ {totais.extras.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Total Final</p>
                <p className="text-lg font-bold tabular-nums text-amber-600">R$ {totais.totalFinal.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Data</th>
                    <th className="text-left px-4 py-2 font-medium">Cliente</th>
                    <th className="text-left px-4 py-2 font-medium">Local</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-right px-4 py-2 font-medium">Valor Total</th>
                    <th className="text-right px-4 py-2 font-medium">Entrada</th>
                    <th className="text-right px-4 py-2 font-medium">Restante</th>
                    <th className="text-right px-4 py-2 font-medium">Extras</th>
                    <th className="text-right px-4 py-2 font-medium">Total Final</th>
                  </tr>
                </thead>
                <tbody>
                  {agendamentos.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2">{format(new Date(a.dataHoraEnsaio), "dd/MM/yyyy", { locale: ptBR })}</td>
                      <td className="px-4 py-2 font-medium">{a.clienteId.slice(0, 8)}...</td>
                      <td className="px-4 py-2">{a.localEnsaio}</td>
                      <td className="px-4 py-2">{a.status}</td>
                      <td className="px-4 py-2 text-right tabular-nums">R$ {a.valorTotal.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">R$ {a.valorEntradaPago.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">R$ {a.valorRestante.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">R$ {a.valorExtras.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">R$ {a.valorTotalFinal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t px-4 py-2 text-xs text-muted-foreground">
              {agendamentos.length} agendamento(s) no relatório
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
