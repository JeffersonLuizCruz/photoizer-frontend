import { useState } from 'react'
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ROUTES } from '@/shared/constants'
import { copyToClipboard } from '@/shared/lib/clipboard'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAgendamento, useGaleriaWorkspace } from '../api/queries'
import { AdminGaleriaPage } from './AdminGaleriaPage'
import { AdminSelecoesPage } from './AdminSelecoesPage'
import { GaleriaVisaoGeral } from '../components/galeria-admin/GaleriaVisaoGeral'
import { GaleriaComprasPanel } from '../components/galeria-admin/GaleriaComprasPanel'
import { GaleriaPagamentoPixCard } from '../components/galeria-admin/GaleriaPagamentoPixCard'

type GaleriaAdminTab = 'visao' | 'fotos' | 'selecao' | 'compras'

export function AdminGaleriaWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuth()
  const podeVerCompras = user?.papel === 'ADMIN' || user?.papel === 'FOTOGRAFO'

  const { data: agendamento, isLoading: carregandoAgendamento, refetch: refetchAgendamento } = useAgendamento(id)
  const workspace = useGaleriaWorkspace(id, { incluirResumo: podeVerCompras })

  if (!id) return <PageLoading />
  if (carregandoAgendamento && !agendamento && workspace.isLoading) return <PageLoading />

  const abasDisponiveis: GaleriaAdminTab[] = podeVerCompras
    ? ['visao', 'fotos', 'selecao', 'compras']
    : ['visao', 'fotos', 'selecao']
  const tabParam = searchParams.get('tab') as GaleriaAdminTab | null
  const activeTab = tabParam && abasDisponiveis.includes(tabParam) ? tabParam : 'visao'

  const mudarTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true })
  }

  const linkGaleria = agendamento?.tokenGaleria
    ? `${window.location.origin}/g/${agendamento.tokenGaleria}`
    : null

  const copiarLink = async () => {
    if (!linkGaleria) return
    try {
      await copyToClipboard(linkGaleria)
      toast.success('Link da galeria copiado!')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  return (
    <div>
      <PageTitle
        title={agendamento?.clienteNome ? `Galeria · ${agendamento.clienteNome}` : 'Galeria'}
        description={agendamento?.pacoteNome
          ? `${agendamento.pacoteNome} · gerencie fotos, seleção e compras em um só lugar`
          : 'Gerencie fotos, seleção e compras em um só lugar'}
        breadcrumbs={[
          { label: 'Agenda', href: ROUTES.AGENDA },
          { label: 'Detalhes', href: `/agenda/${id}` },
          { label: 'Galeria' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshKey((valor) => valor + 1)
                void refetchAgendamento()
                void workspace.refetch()
              }}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Voltar ao agendamento"
              onClick={() => navigate(`/agenda/${id}`)}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            {linkGaleria && (
              <>
                <Button variant="outline" size="sm" aria-label="Copiar link da galeria" onClick={copiarLink}>
                  <Copy className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Copiar link</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Abrir galeria do cliente"
                  onClick={() => window.open(linkGaleria, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Abrir galeria</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={mudarTab}>
        <TabsList scrollable aria-label="Seções da galeria">
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="fotos">
            Fotos
            {workspace.counts.total > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {workspace.counts.total}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="selecao">
            Seleção
            {workspace.counts.extras > 0 && (
              <span
                className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-orange-700"
                title={`${workspace.counts.extras} extra(s)`}
              >
                {workspace.counts.extras}
              </span>
            )}
          </TabsTrigger>
          {podeVerCompras && (
            <TabsTrigger value="compras">
              Compras
              {workspace.counts.comprasPendentes > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-700">
                  {workspace.counts.comprasPendentes}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="visao">
          <div className="space-y-5">
            <GaleriaVisaoGeral
              agendamento={agendamento}
              galeria={workspace.galeria}
              fotos={workspace.fotos}
              counts={workspace.counts}
              selecaoAtual={workspace.selecaoAtual}
              isLoading={workspace.isLoading}
              error={workspace.error}
              onRetry={() => void workspace.refetch()}
              podeVerCompras={podeVerCompras}
            />
            <GaleriaPagamentoPixCard podeEditar={user?.papel === 'ADMIN'} />
          </div>
        </TabsContent>

        <TabsContent value="fotos">
          {activeTab === 'fotos' && (
            <AdminGaleriaPage
              tipoPorFoto={workspace.tipoPorFoto}
              favoritosPorFoto={workspace.resumo?.favoritosPorFoto}
              pacoteLimite={workspace.resumo?.pacoteQuantidadeFotos ?? 0}
            />
          )}
        </TabsContent>

        <TabsContent value="selecao">
          {activeTab === 'selecao' && <AdminSelecoesPage key={refreshKey} />}
        </TabsContent>

        {podeVerCompras && (
          <TabsContent value="compras">
            {activeTab === 'compras' && <GaleriaComprasPanel agendamentoId={id} />}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export function SelecaoRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={id ? `/agenda/${id}/fotos?tab=selecao` : ROUTES.AGENDA} replace />
}
