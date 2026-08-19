import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Download, FileText, FilterX, Table2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { formatCurrency, formatPercent } from '@/shared/lib/format'
import { exportarCSV, exportarXLS } from '@/shared/lib/export'
import { FiltroPeriodo } from '../components/FiltroPeriodo'
import type { DateRange } from '@/shared/components/layout/DateRangePicker'
import {
  useRelatorioResumoMensal,
  useRelatorioDespesasCategoria,
  useRelatorioInadimplencia,
  useRelatorioRentabilidadeServico,
  useRelatorioRentabilidadeCliente,
  useRelatorioComparativo,
  useRelatorioFiscal,
} from '../api/queries'
import { RELATORIOS_DISPONIVEIS, type TipoRelatorio } from '../types/relatorio.types'

const TIPO_SERVICO_LABEL: Record<string, string> = {
  ENSAIO: 'Ensaio',
  CASAMENTO: 'Casamento',
  EVENTO: 'Evento',
  PRODUTO: 'Produto',
  OUTRO: 'Outro',
}

function margemVariant(margem: number): 'success' | 'warning' | 'destructive' {
  if (margem > 60) return 'success'
  if (margem >= 30) return 'warning'
  return 'destructive'
}

function Card({
  label,
  value,
  accent,
  isLoading,
}: {
  label: string
  value?: string
  accent?: string
  isLoading: boolean
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-1 h-6 w-28 rounded-md" />
      ) : (
        <p className={`text-lg font-bold tabular-nums ${accent ?? ''}`}>{value}</p>
      )}
    </div>
  )
}

function TabelaSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  )
}

function TabelaVazia({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        Nenhum dado encontrado no período
      </td>
    </tr>
  )
}

export function RelatoriosPage() {
  const [tipo, setTipo] = useState<TipoRelatorio>('resumo-mensal')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [comparativoTipo, setComparativoTipo] = useState<'MENSAL' | 'ANUAL'>('MENSAL')

  const hoje = useMemo(() => new Date(), [])
  const anoInicio = useMemo(() => new Date(hoje.getFullYear(), 0, 1), [hoje])

  const dataInicio = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(anoInicio, 'yyyy-MM-dd')
  const dataFim = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(hoje, 'yyyy-MM-dd')

  const resumo = useRelatorioResumoMensal(dataInicio, dataFim, tipo === 'resumo-mensal')
  const despesasCategoria = useRelatorioDespesasCategoria(dataInicio, dataFim, tipo === 'despesas-categoria')
  const inadimplencia = useRelatorioInadimplencia(dateRange ? dataInicio : undefined, dateRange ? dataFim : undefined, tipo === 'inadimplencia')
  const rentServico = useRelatorioRentabilidadeServico(dataInicio, dataFim, tipo === 'rentabilidade-servico')
  const rentCliente = useRelatorioRentabilidadeCliente(dataInicio, dataFim, tipo === 'rentabilidade-cliente')
  const comparativo = useRelatorioComparativo(comparativoTipo, dataInicio, dataFim, tipo === 'comparativo')
  const fiscal = useRelatorioFiscal(dataInicio, dataFim, tipo === 'fiscal')

  const ativo = RELATORIOS_DISPONIVEIS.find((r) => r.valor === tipo)

  const handleExport = (ext: 'csv' | 'xls') => {
    if (!tipo) return
    const base = `relatorio-${tipo}`
    const periodo = `${dataInicio}-${dataFim}`

    if (tipo === 'resumo-mensal' && resumo.data) {
      const r = resumo.data
      const rows = [
        ['Receitas brutas', r.receitasBrutas],
        ['Receitas recebidas', r.receitasRecebidas],
        ['A receber', r.aReceber],
        ['Despesas totais', r.despesasTotal],
        ['Despesas pagas', r.despesasPagas],
        ['A pagar', r.aPagar],
        ['Lucro previsto', r.lucroPrevisto],
        ['Lucro realizado', r.lucroRealizado],
        ['Margem (%)', r.margemLucro],
        ['Quantidade de receitas', r.qtdReceitas],
        ['Quantidade de despesas', r.qtdDespesas],
      ]
      exportCommon(ext, base, periodo, ['Indicador', 'Valor'], rows.map(([l, v]) => [l as string, v as number]))
      return
    }

    if (tipo === 'despesas-categoria' && despesasCategoria.data) {
      const d = despesasCategoria.data
      const rows = d.categorias.map((c) => [c.categoria, c.qtd, c.valor, c.percentual])
      exportCommon(ext, base, periodo, ['Categoria', 'Quantidade', 'Valor', 'Percentual (%)'], rows)
      return
    }

    if (tipo === 'inadimplencia' && inadimplencia.data) {
      const d = inadimplencia.data
      const rows = d.itens.map((i) => [
        i.clienteNome,
        i.descricao ?? '',
        i.tipoServico,
        i.dataPrevisaoRecebimento ?? '',
        i.diasAtraso,
        i.valorEmAberto,
      ])
      exportCommon(ext, base, periodo, ['Cliente', 'Descrição', 'Tipo de serviço', 'Previsão', 'Dias em atraso', 'Valor em aberto'], rows)
      return
    }

    if (tipo === 'rentabilidade-servico' && rentServico.data) {
      const rows = rentServico.data.map((s) => [s.tipoServico, s.receita, s.liquido, s.margem])
      exportCommon(ext, base, periodo, ['Tipo de serviço', 'Receita', 'Líquido', 'Margem (%)'], rows)
      return
    }

    if (tipo === 'rentabilidade-cliente' && rentCliente.data) {
      const rows = rentCliente.data.clientes.map((c) => [
        c.clienteNome,
        c.receitaBruta,
        c.receitaLiquida,
        c.recebido,
        c.aReceber,
        c.qtdReceitas,
        c.margem,
      ])
      exportCommon(ext, base, periodo, ['Cliente', 'Receita bruta', 'Receita líquida', 'Recebido', 'A receber', 'Qtde receitas', 'Margem (%)'], rows)
      return
    }

    if (tipo === 'comparativo' && comparativo.data) {
      const rows = comparativo.data.periodos.map((p) => [p.periodo, p.receitas, p.despesas, p.lucro, p.variacao])
      exportCommon(ext, base, periodo, ['Período', 'Receitas', 'Despesas', 'Lucro', 'Variação (%)'], rows)
      return
    }

    if (tipo === 'fiscal' && fiscal.data) {
      const f = fiscal.data
      const rows = f.despesasPorCategoria.map((d) => [d.categoria, d.valor])
      exportCommon(ext, base, periodo, ['Categoria', 'Valor'], rows)
    }
  }

  const exportCommon = (
    ext: 'csv' | 'xls',
    base: string,
    periodo: string,
    header: string[],
    rows: (string | number | null | undefined)[][],
  ) => {
    if (ext === 'csv') exportarCSV(`${base}-${periodo}.csv`, header, rows)
    else exportarXLS(`${base}-${periodo}.xls`, header, rows)
  }

  const hasFilter = !!dateRange?.from || !!dateRange?.to

  return (
    <div>
      <PageTitle
        title="Relatórios"
        description="Relatórios financeiros com exportação em CSV ou Excel"
        breadcrumbs={[{ label: 'Financeiro' }, { label: 'Relatórios' }]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRelatorio)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Selecione o relatório" />
          </SelectTrigger>
          <SelectContent>
            {RELATORIOS_DISPONIVEIS.map((r) => (
              <SelectItem key={r.valor} value={r.valor}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FiltroPeriodo value={dateRange} onChange={setDateRange} />
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
            <FilterX className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}

        {tipo === 'comparativo' && (
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              size="sm"
              variant={comparativoTipo === 'MENSAL' ? 'secondary' : 'ghost'}
              onClick={() => setComparativoTipo('MENSAL')}
            >
              Mensal
            </Button>
            <Button
              size="sm"
              variant={comparativoTipo === 'ANUAL' ? 'secondary' : 'ghost'}
              onClick={() => setComparativoTipo('ANUAL')}
            >
              Anual
            </Button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('xls')}>
            <Table2 className="mr-1 h-4 w-4" />
            XLS
          </Button>
          <Button size="sm" variant="outline" disabled title="Em breve">
            <FileText className="mr-1 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {ativo && (
        <p className="mb-4 text-sm text-muted-foreground">{ativo.descricao}</p>
      )}

      {tipo === 'resumo-mensal' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Receitas brutas" value={formatCurrency(resumo.data?.receitasBrutas)} isLoading={resumo.isLoading} />
          <Card label="Receitas recebidas" value={formatCurrency(resumo.data?.receitasRecebidas)} accent="text-emerald-600" isLoading={resumo.isLoading} />
          <Card label="A receber" value={formatCurrency(resumo.data?.aReceber)} accent="text-amber-600" isLoading={resumo.isLoading} />
          <Card label="Despesas totais" value={formatCurrency(resumo.data?.despesasTotal)} accent="text-rose-500" isLoading={resumo.isLoading} />
          <Card label="Despesas pagas" value={formatCurrency(resumo.data?.despesasPagas)} accent="text-emerald-600" isLoading={resumo.isLoading} />
          <Card label="A pagar" value={formatCurrency(resumo.data?.aPagar)} accent="text-amber-600" isLoading={resumo.isLoading} />
          <Card label="Lucro previsto" value={formatCurrency(resumo.data?.lucroPrevisto)} isLoading={resumo.isLoading} />
          <Card label="Lucro realizado" value={formatCurrency(resumo.data?.lucroRealizado)} accent="text-emerald-600" isLoading={resumo.isLoading} />
          <Card
            label="Margem de lucro"
            value={resumo.data ? formatPercent(resumo.data.margemLucro) : undefined}
            isLoading={resumo.isLoading}
          />
          <Card label="Qtde receitas" value={resumo.data ? String(resumo.data.qtdReceitas) : undefined} isLoading={resumo.isLoading} />
          <Card label="Qtde despesas" value={resumo.data ? String(resumo.data.qtdDespesas) : undefined} isLoading={resumo.isLoading} />
        </div>
      )}

      {tipo === 'despesas-categoria' && (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 text-right font-medium">Quantidade</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                  <th className="px-4 py-2 text-right font-medium">Percentual</th>
                </tr>
              </thead>
              <tbody>
                {despesasCategoria.isLoading ? (
                  <tr><td colSpan={4}><TabelaSkeleton /></td></tr>
                ) : (despesasCategoria.data?.categorias ?? []).length === 0 ? (
                  <TabelaVazia colSpan={4} />
                ) : (
                  (despesasCategoria.data?.categorias ?? []).map((c) => (
                    <tr key={c.categoria} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium">{c.categoria}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{c.qtd}</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">{formatCurrency(c.valor)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatPercent(c.percentual)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {despesasCategoria.data && (
                <tfoot>
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {(despesasCategoria.data.categorias ?? []).reduce((acc, c) => acc + c.qtd, 0)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(despesasCategoria.data.total)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {tipo === 'inadimplencia' && (
        <div>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <Card label="Total em aberto" value={formatCurrency(inadimplencia.data?.totalEmAberto)} accent="text-rose-500" isLoading={inadimplencia.isLoading} />
            <Card
              label="Itens vencidos"
              value={inadimplencia.data ? String(inadimplencia.data.itens.length) : undefined}
              isLoading={inadimplencia.isLoading}
            />
            <Card
              label="Maior atraso"
              value={
                inadimplencia.data?.itens.length
                  ? `${Math.max(...inadimplencia.data.itens.map((i) => i.diasAtraso))} dias`
                  : undefined
              }
              isLoading={inadimplencia.isLoading}
            />
          </div>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Descrição</th>
                    <th className="px-4 py-2 font-medium">Serviço</th>
                    <th className="px-4 py-2 text-right font-medium">Valor em aberto</th>
                    <th className="px-4 py-2 text-right font-medium">Previsão</th>
                    <th className="px-4 py-2 text-right font-medium">Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {inadimplencia.isLoading ? (
                    <tr><td colSpan={6}><TabelaSkeleton /></td></tr>
                  ) : (inadimplencia.data?.itens ?? []).length === 0 ? (
                    <TabelaVazia colSpan={6} />
                  ) : (
                    (inadimplencia.data?.itens ?? []).map((i) => (
                      <tr key={i.receitaId} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-2 font-medium">{i.clienteNome}</td>
                        <td className="px-4 py-2 text-muted-foreground">{i.descricao ?? '—'}</td>
                        <td className="px-4 py-2">{TIPO_SERVICO_LABEL[i.tipoServico] ?? i.tipoServico}</td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums text-rose-500">{formatCurrency(i.valorEmAberto)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {i.dataPrevisaoRecebimento ? i.dataPrevisaoRecebimento.split('-').reverse().join('/') : '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Badge variant={i.diasAtraso > 30 ? 'destructive' : i.diasAtraso > 7 ? 'warning' : 'outline'}>
                            {i.diasAtraso} dia(s)
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tipo === 'rentabilidade-servico' && (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Tipo de serviço</th>
                  <th className="px-4 py-2 text-right font-medium">Receita</th>
                  <th className="px-4 py-2 text-right font-medium">Líquido</th>
                  <th className="px-4 py-2 text-right font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {rentServico.isLoading ? (
                  <tr><td colSpan={4}><TabelaSkeleton /></td></tr>
                ) : (rentServico.data ?? []).length === 0 ? (
                  <TabelaVazia colSpan={4} />
                ) : (
                  (rentServico.data ?? []).map((s) => (
                    <tr key={s.tipoServico} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium">{TIPO_SERVICO_LABEL[s.tipoServico] ?? s.tipoServico}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(s.receita)}</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">{formatCurrency(s.liquido)}</td>
                      <td className="px-4 py-2 text-right">
                        <Badge variant={margemVariant(s.margem)}>{formatPercent(s.margem)}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tipo === 'rentabilidade-cliente' && (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 text-right font-medium">Receita bruta</th>
                  <th className="px-4 py-2 text-right font-medium">Receita líquida</th>
                  <th className="px-4 py-2 text-right font-medium">Recebido</th>
                  <th className="px-4 py-2 text-right font-medium">A receber</th>
                  <th className="px-4 py-2 text-right font-medium">Qtde</th>
                  <th className="px-4 py-2 text-right font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {rentCliente.isLoading ? (
                  <tr><td colSpan={7}><TabelaSkeleton /></td></tr>
                ) : (rentCliente.data?.clientes ?? []).length === 0 ? (
                  <TabelaVazia colSpan={7} />
                ) : (
                  (rentCliente.data?.clientes ?? []).map((c) => (
                    <tr key={c.clienteId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium">{c.clienteNome}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(c.receitaBruta)}</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">{formatCurrency(c.receitaLiquida)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-600">{formatCurrency(c.recebido)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-amber-600">{formatCurrency(c.aReceber)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{c.qtdReceitas}</td>
                      <td className="px-4 py-2 text-right">
                        <Badge variant={margemVariant(c.margem)}>{formatPercent(c.margem)}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tipo === 'comparativo' && (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Período</th>
                  <th className="px-4 py-2 text-right font-medium">Receitas</th>
                  <th className="px-4 py-2 text-right font-medium">Despesas</th>
                  <th className="px-4 py-2 text-right font-medium">Lucro</th>
                  <th className="px-4 py-2 text-right font-medium">Variação</th>
                </tr>
              </thead>
              <tbody>
                {comparativo.isLoading ? (
                  <tr><td colSpan={5}><TabelaSkeleton /></td></tr>
                ) : (comparativo.data?.periodos ?? []).length === 0 ? (
                  <TabelaVazia colSpan={5} />
                ) : (
                  (comparativo.data?.periodos ?? []).map((p) => (
                    <tr key={p.periodo} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium">{p.periodo}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(p.receitas)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-rose-500">{formatCurrency(p.despesas)}</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">{formatCurrency(p.lucro)}</td>
                      <td className="px-4 py-2 text-right">
                        <Badge variant={p.variacao >= 0 ? 'success' : 'destructive'}>
                          {p.variacao >= 0 ? '+' : ''}{p.variacao.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tipo === 'fiscal' && (
        <div>
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Total de receitas" value={formatCurrency(fiscal.data?.totalReceitas)} isLoading={fiscal.isLoading} />
            <Card label="Comissões" value={formatCurrency(fiscal.data?.totalComissoes)} accent="text-amber-600" isLoading={fiscal.isLoading} />
            <Card label="Total de despesas" value={formatCurrency(fiscal.data?.totalDespesas)} accent="text-rose-500" isLoading={fiscal.isLoading} />
            <Card label="Lucro líquido" value={formatCurrency(fiscal.data?.lucroLiquido)} accent="text-emerald-600" isLoading={fiscal.isLoading} />
          </div>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Categoria de despesa</th>
                    <th className="px-4 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {fiscal.isLoading ? (
                    <tr><td colSpan={2}><TabelaSkeleton /></td></tr>
                  ) : (fiscal.data?.despesasPorCategoria ?? []).length === 0 ? (
                    <TabelaVazia colSpan={2} />
                  ) : (
                    (fiscal.data?.despesasPorCategoria ?? []).map((d) => (
                      <tr key={d.categoria} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-2 font-medium">{d.categoria}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(d.valor)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
