import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { BlankLayout } from '@/shared/components/layout/BlankLayout'
import { ROUTES } from '@/shared/constants'
import { LoginPage, ProtectedRoute } from '@/features/auth'

// RNF001: code splitting por rota — cada página é carregada sob demanda
const GaleriaClientePage = lazy(() => import('@/features/ecommerce/pages/GaleriaClientePage').then(m => ({ default: m.GaleriaClientePage })))
const AdminEcommercePage = lazy(() => import('@/features/ecommerce/pages/AdminEcommercePage').then(m => ({ default: m.AdminEcommercePage })))
const AdminCuponsPage = lazy(() => import('@/features/ecommerce/pages/AdminCuponsPage').then(m => ({ default: m.AdminCuponsPage })))
const AdminPedidosPage = lazy(() => import('@/features/ecommerce/pages/AdminPedidosPage').then(m => ({ default: m.AdminPedidosPage })))
const AdminAnalyticsPage = lazy(() => import('@/features/ecommerce/pages/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage })))
const PackageCatalogPage = lazy(() => import('@/features/ecommerce/pages/PackageCatalogPage').then(m => ({ default: m.PackageCatalogPage })))
const CheckoutPage = lazy(() => import('@/features/ecommerce/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })))
const CustomerLoginPage = lazy(() => import('@/features/auth/customer').then(m => ({ default: m.CustomerLoginPage })))
const CustomerDashboardPage = lazy(() => import('@/features/auth/customer').then(m => ({ default: m.CustomerDashboardPage })))
const CustomerProfilePage = lazy(() => import('@/features/auth/customer/CustomerProfilePage').then(m => ({ default: m.CustomerProfilePage })))
const CustomerOrderDetailPage = lazy(() => import('@/features/auth/customer/CustomerOrderDetailPage').then(m => ({ default: m.CustomerOrderDetailPage })))
const ClientesListPage = lazy(() => import('@/features/clientes').then(m => ({ default: m.ClientesListPage })))
const ClienteFormPage = lazy(() => import('@/features/clientes').then(m => ({ default: m.ClienteFormPage })))
const ClienteDetalhesPage = lazy(() => import('@/features/clientes').then(m => ({ default: m.ClienteDetalhesPage })))
const NovoAgendamentoPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.NovoAgendamentoPage })))
const AgendamentoDetalhesPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.AgendamentoDetalhesPage })))
const EditarAgendamentoPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.EditarAgendamentoPage })))
const AgendaPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.AgendaPage })))
const MinhasTarefasPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.MinhasTarefasPage })))
const AdminGaleriaPage = lazy(() => import('@/features/fotos').then(m => ({ default: m.AdminGaleriaPage })))
const PacotesListPage = lazy(() => import('@/features/pacotes').then(m => ({ default: m.PacotesListPage })))
const PacoteFormPage = lazy(() => import('@/features/pacotes').then(m => ({ default: m.PacoteFormPage })))
const DashboardPage = lazy(() => import('@/features/dashboard').then(m => ({ default: m.DashboardPage })))
const DashboardDetalhesPage = lazy(() => import('@/features/dashboard').then(m => ({ default: m.DashboardDetalhesPage })))
const ConfigPage = lazy(() => import('@/features/config').then(m => ({ default: m.ConfigPage })))
const ComissoesConsultaPage = lazy(() => import('@/features/comissoes').then(m => ({ default: m.ComissoesConsultaPage })))
const FinanceiroDashboardPage = lazy(() => import('@/features/financeiro').then(m => ({ default: m.FinanceiroDashboardPage })))
const RelatoriosPage = lazy(() => import('@/features/financeiro').then(m => ({ default: m.RelatoriosPage })))

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center" role="status" aria-label="Carregando página">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Página não encontrada</p>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.ACESSO_CLIENTE} element={<CustomerLoginPage />} />
          <Route path={ROUTES.MINHA_CONTA} element={<CustomerDashboardPage />} />
          <Route path="/minha-conta/editar" element={<CustomerProfilePage />} />
          <Route path="/minha-conta/pedidos/:id" element={<CustomerOrderDetailPage />} />
          <Route path={ROUTES.PACOTES_DISPONIVEIS} element={<PackageCatalogPage />} />
          <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />

          <Route path="/g/:token" element={<BlankLayout />}>
            <Route index element={<GaleriaClientePage />} />
          </Route>

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.DASHBOARD_DETALHES} element={<DashboardDetalhesPage />} />
            <Route path={ROUTES.CLIENTES} element={<ClientesListPage />} />
            <Route path={ROUTES.CLIENTES_NOVO} element={<ClienteFormPage />} />
            <Route path={ROUTES.CLIENTES_EDITAR} element={<ClienteFormPage />} />
            <Route path={ROUTES.CLIENTES_DETALHES} element={<ClienteDetalhesPage />} />
            <Route path={ROUTES.AGENDA} element={<AgendaPage />} />
            <Route path={ROUTES.AGENDA_NOVO} element={<NovoAgendamentoPage />} />
            <Route path={ROUTES.AGENDA_DETALHES} element={<AgendamentoDetalhesPage />} />
            <Route path={ROUTES.AGENDA_EDITAR} element={<EditarAgendamentoPage />} />
            <Route path={ROUTES.TAREFAS} element={<MinhasTarefasPage />} />
            <Route path={ROUTES.PACOTES} element={<PacotesListPage />} />
            <Route path={ROUTES.PACOTES_NOVO} element={<PacoteFormPage />} />
            <Route path={ROUTES.PACOTES_EDITAR} element={<PacoteFormPage />} />
            <Route path={ROUTES.FINANCEIRO} element={<FinanceiroDashboardPage />} />
            <Route path={ROUTES.FINANCEIRO_RELATORIOS} element={<RelatoriosPage />} />
            <Route path={ROUTES.CONFIG} element={<ConfigPage />} />
            <Route path={ROUTES.COMISSOES} element={<ComissoesConsultaPage />} />
            <Route path={ROUTES.AGENDA_GALERIA} element={<AdminGaleriaPage />} />
            <Route path={ROUTES.ADMIN_ECOMMERCE} element={<AdminEcommercePage />} />
            <Route path={ROUTES.ADMIN_CUPONS} element={<AdminCuponsPage />} />
            <Route path={ROUTES.ADMIN_PEDIDOS} element={<AdminPedidosPage />} />
            <Route path={ROUTES.ADMIN_ANALYTICS} element={<AdminAnalyticsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
