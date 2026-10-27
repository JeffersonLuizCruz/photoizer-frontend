import { useSearchParams } from 'react-router-dom'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ROUTES } from '@/shared/constants'
import { GaleriaPipelinePanel } from '../components/GaleriaPipelinePanel'
import { AdminEcommercePage } from './AdminEcommercePage'

type GaleriaAdminTab = 'fila' | 'vendas'

export function AdminGaleriasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as GaleriaAdminTab | null
  const activeTab: GaleriaAdminTab = tabParam === 'vendas' ? 'vendas' : 'fila'

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
        </TabsList>

        <TabsContent value="fila">
          <GaleriaPipelinePanel />
        </TabsContent>

        <TabsContent value="vendas">
          <AdminEcommercePage embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}
