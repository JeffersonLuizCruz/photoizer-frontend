import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Download, Plus, FilterX } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { formatCurrency } from '@/shared/lib/format'
import { exportarCSV } from '@/shared/lib/export'
import { useReceitasList, useReceberReceita, useExcluirReceita, useDuplicarReceita } from '../api/queries'
import { FiltroFinanceiro } from '../components/FiltroFinanceiro'
import { ReceitaTable } from '../components/ReceitaTable'
import { ReceitaFormDialog } from '../components/ReceitaFormDialog'
import type { Receita } from '../types/receita.types'
import type { DashboardQueryParams } from '../types/dashboard.types'

export function ReceitasPage() {
  const [filtros, setFiltros] = useState<DashboardQueryParams>({})
  const [sort, setSort] = useState('data:desc')
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<Receita | null>(null)
  const [excluindo, setExcluindo] = useState<Receita | null>(null)

  const [sortBy, sortDir] = useMemo(() => sort.split(':'), [sort])

  const receitaParams = useMemo(
    () => ({
      ...filtros,
      sortBy,
      sortDir: sortDir as 'asc' | 'desc',
    }),
    [filtros, sortBy, sortDir],
  )

  const { data: receitas, isLoading } = useReceitasList(receitaParams)
  const receber = useReceberReceita()
  const excluir = useExcluirReceita()
  const duplicar = useDuplicarReceita()

  const totais = useMemo(() => {
    const list = receitas ?? []
    const bruto = list.reduce((acc, r) => acc + r.valorBruto, 0)
    const final = list.reduce((acc, r) => acc + r.valorFinal, 0)
    const recebido = list.reduce((acc, r) => acc + r.valorRecebido, 0)
    const aReceber = list
      .filter((r) => r.status !== 'CANCELADO')
      .reduce((acc, r) => acc + Math.max(0, r.valorFinal - r.valorRecebido), 0)
    return { bruto, final, recebido, aReceber }
  }, [receitas])

  const hasFilter =
    !!filtros.dataInicio || !!filtros.tipoServico || !!filtros.status || !!filtros.clienteId || !!filtros.formaPagamento

  const exportCSV = () => {
    if (!receitas || receitas.length === 0) return
    const header = ['Cliente', 'Serviço', 'Descrição', 'Previsão', 'Bruto', 'Comissão', 'Final', 'Recebido', 'Status']
    const rows = receitas.map((r) => [
      r.clienteNome,
      r.tipoServico,
      r.descricao ?? '',
      r.dataPrevisaoRecebimento ?? '',
      r.valorBruto,
      r.valorComissao,
      r.valorFinal,
      r.valorRecebido,
      r.status,
    ])
    exportarCSV(`receitas-${format(new Date(), 'yyyy-MM-dd')}.csv`, header, rows)
  }

  return (
    <div>
      <PageTitle
        title="Receitas"
        description="Controle de entradas, previsões de recebimento e recebimento"
        breadcrumbs={[{ label: 'Financeiro' }, { label: 'Receitas' }]}
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Badge variant="outline">Bruto: {formatCurrency(totais.bruto)}</Badge>
        <Badge variant="outline">Final: {formatCurrency(totais.final)}</Badge>
        <Badge variant="success">Recebido: {formatCurrency(totais.recebido)}</Badge>
        <Badge variant="warning">A receber: {formatCurrency(totais.aReceber)}</Badge>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FiltroFinanceiro value={filtros} onChange={setFiltros} />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="data:desc">Mais recentes</SelectItem>
            <SelectItem value="data:asc">Mais antigas</SelectItem>
            <SelectItem value="valor:desc">Maior valor</SelectItem>
            <SelectItem value="valor:asc">Menor valor</SelectItem>
            <SelectItem value="cliente:asc">Cliente (A-Z)</SelectItem>
          </SelectContent>
        </Select>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => setFiltros({})}>
            <FilterX className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-1 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      <ReceitaTable
        receitas={receitas ?? []}
        isLoading={isLoading}
        onReceber={(r) => receber.mutate(r.id, { onSuccess: () => toast.success('Receita marcada como recebida') })}
        onEditar={(r) => { setEditando(r); setFormOpen(true) }}
        onDuplicar={(r) => duplicar.mutate(r.id, { onSuccess: () => toast.success('Receita duplicada') })}
        onExcluir={(r) => setExcluindo(r)}
      />

      <ReceitaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        receita={editando}
      />

      <ConfirmDialog
        open={!!excluindo}
        onOpenChange={(open) => { if (!open) setExcluindo(null) }}
        onConfirm={() => {
          if (!excluindo) return
          excluir.mutate(excluindo.id, {
            onSuccess: () => { toast.success('Receita excluída'); setExcluindo(null) },
            onError: () => { toast.error('Erro ao excluir receita'); setExcluindo(null) },
          })
        }}
        title="Excluir receita"
        description={`Tem certeza que deseja excluir a receita de "${excluindo?.clienteNome}"?`}
        confirmText="Excluir"
        variant="destructive"
        isLoading={excluir.isPending}
      />
    </div>
  )
}
