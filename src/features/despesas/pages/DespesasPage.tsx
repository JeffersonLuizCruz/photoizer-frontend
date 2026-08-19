import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Download, FilterX, Settings2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { DateRangePicker, type DateRange } from '@/shared/components/layout/DateRangePicker'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { exportarCSV } from '@/shared/lib/export'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useDespesasList, usePagarDespesa, useRemoverDespesa } from '../api/queries'
import { DespesaFormDialog } from '../components/DespesaFormDialog'
import { DespesaTable } from '../components/DespesaTable'
import { AlertaRecorrentes } from '../components/AlertaRecorrentes'
import { GerenciarCategoriasDialog } from '../components/GerenciarCategoriasDialog'
import type { DespesaResponse, StatusDespesa } from '../types/despesa.types'

export function DespesasPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [categoriaId, setCategoriaId] = useState<string>('all')
  const [status, setStatus] = useState<StatusDespesa | 'all'>('all')
  const [sortBy, setSortBy] = useState('data')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<DespesaResponse | null>(null)
  const [categoriasOpen, setCategoriasOpen] = useState(false)
  const [excluindo, setExcluindo] = useState<DespesaResponse | null>(null)

  const params = useMemo(
    () => ({
      dataInicio: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dataFim: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      categoriaId: categoriaId === 'all' ? undefined : categoriaId,
      status: status === 'all' ? undefined : status,
      sortBy,
      sortDir,
    }),
    [dateRange, categoriaId, status, sortBy, sortDir],
  )

  const { data: despesas, isLoading } = useDespesasList(params)
  const pagar = usePagarDespesa()
  const remover = useRemoverDespesa()

  const hasFilter = !!dateRange?.from || categoriaId !== 'all' || status !== 'all'

  const exportCSV = () => {
    if (!despesas || despesas.length === 0) return
    const header = ['Descrição', 'Categoria', 'Data', 'Valor', 'Status', 'Recorrência', 'Observação']
    const rows = despesas.map((d) => [
      d.descricao,
      d.categoria,
      d.data,
      d.valor,
      d.status,
      d.recorrencia,
      d.observacao ?? '',
    ])
    exportarCSV(`despesas-${format(new Date(), 'yyyy-MM-dd')}.csv`, header, rows)
  }

  return (
    <div>
      <PageTitle
        title="Despesas"
        description="Controle de gastos, categorias, recorrências e comprovantes"
        breadcrumbs={[{ label: 'Financeiro' }, { label: 'Despesas' }]}
      />

      <AlertaRecorrentes />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {Array.from(new Set(despesas?.map((d) => d.categoria) ?? [])).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v: StatusDespesa | 'all') => setStatus(v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="PAGO">Pago</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="RECORRENTE">Recorrente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={`${sortBy}:${sortDir}`} onValueChange={(v) => {
          const [sb, sd] = v.split(':')
          setSortBy(sb)
          setSortDir(sd as 'asc' | 'desc')
        }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="data:desc">Mais recentes</SelectItem>
            <SelectItem value="data:asc">Mais antigas</SelectItem>
            <SelectItem value="valor:desc">Maior valor</SelectItem>
            <SelectItem value="valor:asc">Menor valor</SelectItem>
          </SelectContent>
        </Select>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setDateRange(undefined); setCategoriaId('all'); setStatus('all') }}>
            <FilterX className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-1 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCategoriasOpen(true)}>
            <Settings2 className="mr-1 h-4 w-4" />
            Categorias
          </Button>
          <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      <DespesaTable
        despesas={despesas ?? []}
        isLoading={isLoading}
        onPagar={(d) => pagar.mutate(d.id, { onSuccess: () => toast.success('Despesa marcada como paga') })}
        onEditar={(d) => { setEditando(d); setFormOpen(true) }}
        onExcluir={(d) => setExcluindo(d)}
      />

      <DespesaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        despesa={editando}
        onOpenCategorias={() => setCategoriasOpen(true)}
      />

      <GerenciarCategoriasDialog open={categoriasOpen} onOpenChange={setCategoriasOpen} />

      <ConfirmDialog
        open={!!excluindo}
        onOpenChange={(open) => { if (!open) setExcluindo(null) }}
        onConfirm={() => {
          if (!excluindo) return
          remover.mutate(excluindo.id, {
            onSuccess: () => { toast.success('Despesa excluída'); setExcluindo(null) },
            onError: () => { toast.error('Erro ao excluir despesa'); setExcluindo(null) },
          })
        }}
        title="Excluir despesa"
        description={`Tem certeza que deseja excluir "${excluindo?.descricao}"?`}
        confirmText="Excluir"
        variant="destructive"
        isLoading={remover.isPending}
      />
    </div>
  )
}
