import { FileDown } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/features/auth/AuthProvider'
import { useFotografoDashboard, useFotografoEnsaios, useExportarCsvFotografo } from '../api/queries'
import { FotografoCard } from '../components/FotografoCard'
import { TabelaEnsaiosFotografo } from '../components/TabelaEnsaiosFotografo'

export function MinhasFinancasPage() {
  const { user } = useAuth()
  const fotografoId = user?.userId
  const { data: dashboard, isLoading } = useFotografoDashboard(fotografoId)
  const { data: ensaios = [] } = useFotografoEnsaios(fotografoId)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas Finanças</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus ganhos, repasses e histórico financeiro completo.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fotografoId && exportCsv.mutate(fotografoId)}
          disabled={exportCsv.isPending}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {dashboard && (
        <FotografoCard
          totalEnsaios={dashboard.totalEnsaios}
          totalPartilha={dashboard.totalPartilha}
          totalRepasse={dashboard.totalRepasse}
        />
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Histórico Completo de Ensaios</h2>
        <p className="text-sm text-muted-foreground">
          {ensaios.length} ensaio{ensaios.length !== 1 ? 's' : ''} no total
        </p>
        <TabelaEnsaiosFotografo ensaios={ensaios} />
      </div>
    </div>
  )
}