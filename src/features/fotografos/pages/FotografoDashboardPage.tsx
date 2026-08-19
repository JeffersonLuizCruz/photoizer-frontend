import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileDown } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { useFotografoDashboard, useFotografoEnsaios, useExportarCsvFotografo } from '../api/queries'
import { FotografoCard } from '../components/FotografoCard'
import { FotografoFinanceiroDetalhado } from '../components/FotografoFinanceiroDetalhado'
import { FotografoCustosList } from '../components/FotografoCustosList'
import { TabelaEnsaiosFotografo } from '../components/TabelaEnsaiosFotografo'

export function FotografoDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: dashboard, isLoading } = useFotografoDashboard(id)
  const { data: ensaios = [] } = useFotografoEnsaios(id)
  const exportCsv = useExportarCsvFotografo()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 bg-muted rounded" />
        <div className="animate-pulse h-24 w-full bg-muted rounded" />
        <div className="animate-pulse h-64 w-full bg-muted rounded" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div>
        <p className="text-muted-foreground">Fotógrafo não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/fotografos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/fotografos')} aria-label="Voltar para a lista de fotografos">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{dashboard.fotografoNome}</h1>
            <p className="text-sm text-muted-foreground">
              {dashboard.totalEnsaios} ensaio{dashboard.totalEnsaios !== 1 ? 's' : ''} realizados
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => id && exportCsv.mutate(id)}
          disabled={exportCsv.isPending}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="ensaios">Ensaios</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6 mt-6">
          <FotografoCard
            totalEnsaios={dashboard.totalEnsaios}
            totalPartilha={dashboard.totalPartilha}
            totalRepasse={dashboard.totalRepasse}
            totalLucroCrm={dashboard.totalLucroCrm}
            showStudioProfit
          />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Últimos Ensaios</h2>
            <TabelaEnsaiosFotografo ensaios={dashboard.ultimosEnsaios} showStudioProfit />
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6">
          {id && <FotografoFinanceiroDetalhado fotografoId={id} />}
        </TabsContent>

        <TabsContent value="custos" className="mt-6">
          {id && <FotografoCustosList fotografoId={id} />}
        </TabsContent>

        <TabsContent value="ensaios" className="space-y-2 mt-6">
          <h2 className="text-lg font-semibold">
            Todos os Ensaios ({ensaios.length})
          </h2>
          <TabelaEnsaiosFotografo ensaios={ensaios} showStudioProfit />
        </TabsContent>
      </Tabs>
    </div>
  )
}