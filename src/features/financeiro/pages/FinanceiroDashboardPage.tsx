import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { FilterX } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { useAgendamentosList } from '@/features/agenda/api/queries'
import { useFinanceiroResumo } from '../api/queries'
import { FinanceiroResumo } from '../components/FinanceiroResumo'
import { FinanceiroTabela } from '../components/FinanceiroTabela'
import { FiltroPeriodo } from '../components/FiltroPeriodo'
import type { DateRange } from '@/shared/components/layout/DateRangePicker'
import { AGENDAMENTO_STATUS } from '@/shared/constants'

export function FinanceiroDashboardPage() {
  const { data: agendamentos, isLoading } = useAgendamentosList()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const dataInicio = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
  const dataFim = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

  const { data: resumoData, isLoading: resumoLoading } = useFinanceiroResumo(dataInicio, dataFim)

  const filtered = useMemo(() => {
    if (!agendamentos) return []
    let list = agendamentos.filter(
      (a) => a.status !== AGENDAMENTO_STATUS.CANCELADO && a.status !== AGENDAMENTO_STATUS.NO_SHOW,
    )
    if (dateRange?.from) {
      list = list.filter((a) => new Date(a.dataHoraEnsaio) >= dateRange.from!)
    }
    if (dateRange?.to) {
      list = list.filter((a) => new Date(a.dataHoraEnsaio) <= dateRange.to!)
    }
    return list
  }, [agendamentos, dateRange])

  const hasFilter = !!dateRange?.from || !!dateRange?.to

  return (
    <div>
      <PageTitle
        title="Financeiro"
        description="Controle financeiro dos agendamentos"
        breadcrumbs={[{ label: 'Financeiro' }]}
      />

      <div className="mb-6">
        <FinanceiroResumo data={resumoData} isLoading={resumoLoading} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <FiltroPeriodo value={dateRange} onChange={setDateRange} />
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
            <FilterX className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      <FinanceiroTabela agendamentos={filtered} dateRange={dateRange} isLoading={isLoading} />
    </div>
  )
}
