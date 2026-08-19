import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Wallet, ReceiptText, ArrowDownLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ROUTES } from '@/shared/constants'
import { useFinanceiroDashboard } from '../api/queries'
import { FiltroFinanceiro } from '../components/FiltroFinanceiro'
import { FinanceiroCards } from '../components/FinanceiroCards'
import { GraficoReceitasDespesas } from '../components/GraficoReceitasDespesas'
import { GraficoDespesasCategoria } from '../components/GraficoDespesasCategoria'
import { GraficoLucroLiquido } from '../components/GraficoLucroLiquido'
import { GraficoRentabilidade } from '../components/GraficoRentabilidade'
import { UltimosLancamentos } from '../components/UltimosLancamentos'
import { RentabilidadePorTrabalho } from '../components/RentabilidadePorTrabalho'
import type { DashboardQueryParams } from '../types/dashboard.types'

function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function FinanceiroDashboardPage() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<DashboardQueryParams>({})
  const { data, isLoading } = useFinanceiroDashboard(filtros)

  return (
    <div>
      <PageTitle
        title="Financeiro"
        description="Dashboard financeiro, receitas, despesas e rentabilidade"
        breadcrumbs={[{ label: 'Financeiro' }]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FiltroFinanceiro value={filtros} onChange={setFiltros} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.FINANCEIRO_RECEITAS)}>
            <ReceiptText className="mr-1 h-4 w-4" />
            Receitas
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.FINANCEIRO_DESPESAS)}>
            <ArrowDownLeft className="mr-1 h-4 w-4" />
            Despesas
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <FinanceiroCards cards={data?.cards} isLoading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Receitas vs Despesas" subtitle="Por mês no período">
          <GraficoReceitasDespesas data={data?.barraMensal ?? []} isLoading={isLoading} />
        </ChartCard>
        <ChartCard title="Despesas por Categoria" subtitle="Distribuição no período">
          <GraficoDespesasCategoria data={data?.despesasPorCategoria ?? []} isLoading={isLoading} />
        </ChartCard>
        <ChartCard title="Lucro Líquido" subtitle="Evolução mensal">
          <GraficoLucroLiquido data={data?.lucroMensal ?? []} isLoading={isLoading} />
        </ChartCard>
        <ChartCard title="Rentabilidade por Serviço" subtitle="Receita e líquido por tipo de serviço">
          <GraficoRentabilidade data={data?.rentabilidadePorServico ?? []} isLoading={isLoading} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Últimos Lançamentos" subtitle="Entradas e saídas recentes">
          <UltimosLancamentos lancamentos={data?.ultimosLancamentos ?? []} isLoading={isLoading} />
        </ChartCard>
        <ChartCard title="Rentabilidade por Trabalho" subtitle="ROI por trabalho">
          <RentabilidadePorTrabalho trabalhos={data?.rentabilidadePorTrabalho ?? []} isLoading={isLoading} />
        </ChartCard>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Wallet className="h-4 w-4" />
        Período padrão: últimos 6 meses. Use os filtros acima para refinar a análise.
      </div>
    </div>
  )
}
