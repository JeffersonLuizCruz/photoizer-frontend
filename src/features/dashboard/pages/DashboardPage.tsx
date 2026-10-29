import { Camera, ShoppingCart } from 'lucide-react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Badge } from '@/shared/components/ui/badge'
import { useAuth } from '@/features/auth/AuthProvider'
import { useEntregasPendentes } from '@/shared/hooks/useEntregasPendentes'
import { EntregasPendentes } from '../components/EntregasPendentes'
import { EntregaPendenteAlerta } from '../components/EntregaPendenteAlerta'
import { EcommerceDashboardCards } from '../components/EcommerceDashboardCards'
import { GraficoMensal } from '../components/GraficoMensal'
import { DashboardArmazenamentoCard } from '../components/DashboardArmazenamentoCard'
import { useArmazenamentoResumo } from '../api/queries'

export function DashboardPage() {
  const { papel, user, isLoading: authLoading } = useAuth()
  const { entregasPendentes, maisAntiga, isLoading } = useEntregasPendentes({
    enabled: !!user,
    userId: user?.userId,
  })
  const admin = papel === 'ADMIN'
  const { data: armazenamento } = useArmazenamentoResumo(admin)
  const carregandoEntregas = authLoading || isLoading

  return (
    <div>
      <PageTitle
        title="Dashboard"
        description="Visão geral das operações do dia"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {entregasPendentes.length > 0 && (
        <div className="mb-6">
          <EntregaPendenteAlerta
            quantidade={entregasPendentes.length}
            entregaMaisAntiga={maisAntiga}
            userId={user?.userId}
          />
        </div>
      )}

      {admin && armazenamento && (
        <div className="mb-6">
          <DashboardArmazenamentoCard resumo={armazenamento} />
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Entregas Pendentes</h2>
          {entregasPendentes.length > 0 && (
            <Badge variant="warning">{entregasPendentes.length}</Badge>
          )}
        </div>
        <div className="p-4">
          <EntregasPendentes agendamentos={entregasPendentes} isLoading={carregandoEntregas} />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Ecommerce</h2>
          </div>
          <EcommerceDashboardCards />
        </div>
        <GraficoMensal />
      </div>
    </div>
  )
}
