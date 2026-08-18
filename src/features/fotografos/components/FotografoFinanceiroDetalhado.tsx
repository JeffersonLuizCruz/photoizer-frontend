import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/shared/lib/format'
import { useResumoFinanceiroFotografo } from '../api/queries'

interface FotografoFinanceiroDetalhadoProps {
  fotografoId: string
}

export function FotografoFinanceiroDetalhado({ fotografoId }: FotografoFinanceiroDetalhadoProps) {
  const { data: resumo, isLoading } = useResumoFinanceiroFotografo(fotografoId)

  const chartData = useMemo(() => [
    { nome: 'Valor Cobrado', valor: resumo?.totalValorCobrado ?? 0 },
    { nome: 'Custos', valor: resumo?.totalCustosFotografo ?? 0 },
    { nome: 'Partilha', valor: resumo?.totalPartilha ?? 0 },
    { nome: 'Repasse', valor: resumo?.totalRepasse ?? 0 },
    { nome: 'Lucro do Estúdio', valor: resumo?.totalLucroCrm ?? 0 },
  ], [resumo])

  const custoCategorias = useMemo(() =>
    Object.entries(resumo?.custosPorCategoria ?? {}).map(([nome, valor]) => ({ nome, valor })),
    [resumo],
  )

  if (isLoading) {
    return <div className="animate-pulse h-64 w-full bg-muted rounded" />
  }

  if (!resumo) {
    return <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Média Partilha/Ensaio</p>
          <p className="text-xl font-bold tabular-nums">{formatCurrency(resumo.mediaPartilhaPorEnsaio)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Repasses Pendentes</p>
          <p className="text-xl font-bold tabular-nums text-amber-600">{formatCurrency(resumo.totalRepassesPendentes)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Repasses Realizados</p>
          <p className="text-xl font-bold tabular-nums text-emerald-600">{formatCurrency(resumo.totalRepassesRealizados)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Status dos Ensaios</p>
          <p className="text-xl font-bold tabular-nums">
            {resumo.ensaiosPendentes}P / {resumo.ensaiosRealizados}R / {resumo.ensaiosFinalizados}F
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">Visão Geral Financeira</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {custoCategorias.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Custos por Categoria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={custoCategorias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="valor" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {resumo.custosPorEnsaio.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">Custos por Ensaio</h3>
          <div className="space-y-2">
            {resumo.custosPorEnsaio.map((c) => (
              <div key={c.agendamentoId} className="flex items-center justify-between py-1 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.clienteNome}</p>
                  <p className="text-xs text-muted-foreground">{c.dataEnsaio}</p>
                </div>
                <p className="text-sm font-medium text-rose-500">{formatCurrency(c.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}