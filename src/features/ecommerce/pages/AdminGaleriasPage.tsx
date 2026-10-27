import { useSearchParams } from 'react-router-dom'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ROUTES } from '@/shared/constants'
import { useAuth } from '@/features/auth/AuthProvider'
import { GaleriaPipelinePanel } from '../components/GaleriaPipelinePanel'
import { GaleriaPerformancePanel } from '../components/GaleriaPerformancePanel'
import { AdminEcommercePage } from './AdminEcommercePage'

type GaleriaAdminTab = 'fila' | 'vendas' | 'desempenho'

export function AdminGaleriasPage() {
  const { user } = useAuth()
  const podeVerDesempenho = user?.papel === 'ADMIN' || user?.papel === 'FOTOGRAFO'
  const abasDisponiveis: GaleriaAdminTab[] = podeVerDesempenho
    ? ['fila', 'vendas', 'desempenho']
    : ['fila', 'vendas']
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as GaleriaAdminTab | null
  const activeTab: GaleriaAdminTab = tabParam && abasDisponiveis.includes(tabParam) ? tabParam : 'fila'

  const mudarTab = (tab: string) => {
    setSearchParams(tab === 'fila' ? {} : { tab }, { replace: true })
  }

  return (
    <div>
      <PageTitle
        title="Galerias"
        description="Acompanhe a entrega de cada ensaio e as vendas de fotos extras"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Galerias' },
        ]}
      />

      <Tabs value={activeTab} onValueChange={mudarTab}>
        <TabsList scrollable aria-label="Seções da central de galerias">
          <TabsTrigger value="fila">Fila de trabalho</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          {podeVerDesempenho && <TabsTrigger value="desempenho">Desempenho</TabsTrigger>}
        </TabsList>

        <TabsContent value="fila">
          <GaleriaPipelinePanel />
        </TabsContent>

        <TabsContent value="vendas">
          <AdminEcommercePage embedded />
        </TabsContent>

        {podeVerDesempenho && (
          <TabsContent value="desempenho">
            <GaleriaPerformancePanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
