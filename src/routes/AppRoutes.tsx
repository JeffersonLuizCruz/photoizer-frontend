import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { ROUTES } from '@/shared/constants'
import { LoginPage, ProtectedRoute } from '@/features/auth'

// RNF001: code splitting por rota — cada página é carregada sob demanda
const GaleriaClientePage = lazy(() => import('@/features/ecommerce/pages/GaleriaClientePage').then(m => ({ default: m.GaleriaClientePage })))
const AdminEcommercePage = lazy(() => import('@/features/ecommerce/pages/AdminEcommercePage').then(m => ({ default: m.AdminEcommercePage })))
const AdminAnalyticsPage = lazy(() => import('@/features/ecommerce/pages/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage })))
const PackageCatalogPage = lazy(() => import('@/features/ecommerce/pages/PackageCatalogPage').then(m => ({ default: m.PackageCatalogPage })))
const CheckoutPage = lazy(() => import('@/features/ecommerce/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })))
const CustomerLoginPage = lazy(() => import('@/features/auth/customer').then(m => ({ default: m.CustomerLoginPage })))
const CustomerDashboardPage = lazy(() => import('@/features/auth/customer').then(m => ({ default: m.CustomerDashboardPage })))
const CustomerProfilePage = lazy(() => import('@/features/auth/customer/CustomerProfilePage').then(m => ({ default: m.CustomerProfilePage })))
const NovoAgendamentoPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.NovoAgendamentoPage })))
const AgendamentoDetalhesPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.AgendamentoDetalhesPage })))
const EditarAgendamentoPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.EditarAgendamentoPage })))
const AgendaPage = lazy(() => import('@/features/agenda').then(m => ({ default: m.AgendaPage })))
const AdminGaleriaPage = lazy(() => import('@/features/fotos').then(m => ({ default: m.AdminGaleriaPage })))
const PacotesListPage = lazy(() => import('@/features/pacotes').then(m => ({ default: m.PacotesListPage })))
const PacoteFormPage = lazy(() => import('@/features/pacotes').then(m => ({ default: m.PacoteFormPage })))
const DashboardPage = lazy(() => import('@/features/dashboard').then(m => ({ default: m.DashboardPage })))
const ConfigPage = lazy(() => import('@/features/config').then(m => ({ default: m.ConfigPage })))
const ComissoesConsultaPage = lazy(() => import('@/features/comissoes').then(m => ({ default: m.ComissoesConsultaPage })))
const EdicaoListPage = lazy(() => import('@/features/edicao').then(m => ({ default: m.EdicaoListPage })))
const EdicaoGaleriaPage = lazy(() => import('@/features/edicao').then(m => ({ default: m.EdicaoGaleriaPage })))
const UploadRawPage = lazy(() => import('@/features/edicao').then(m => ({ default: m.UploadRawPage })))
const EdicaoRevisaoPage = lazy(() => import('@/features/edicao').then(m => ({ default: m.EdicaoRevisaoPage })))
const FinanceiroDashboardPage = lazy(() => import('@/features/financeiro').then(m => ({ default: m.FinanceiroDashboardPage })))
const RelatoriosPage = lazy(() => import('@/features/financeiro').then(m => ({ default: m.RelatoriosPage })))
const ReceitasPage = lazy(() => import('@/features/financeiro').then(m => ({ default: m.ReceitasPage })))
const FluxoCaixaPage = lazy(() => import('@/features/financeiro').then(m => ({ default: m.FluxoCaixaPage })))
const DespesasPage = lazy(() => import('@/features/despesas').then(m => ({ default: m.DespesasPage })))
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
          <Route path="/g/:token" element={<GaleriaClientePage />} />

          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.ACESSO_CLIENTE} element={<CustomerLoginPage />} />
          <Route path={ROUTES.MINHA_CONTA} element={<CustomerDashboardPage />} />
          <Route path="/minha-conta/editar" element={<CustomerProfilePage />} />
          <Route path={ROUTES.PACOTES_DISPONIVEIS} element={<PackageCatalogPage />} />
          <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to={ROUTES.AGENDA} replace />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.AGENDA} element={<AgendaPage />} />
            <Route path={ROUTES.AGENDA_NOVO} element={<NovoAgendamentoPage />} />
            <Route path={ROUTES.AGENDA_DETALHES} element={<AgendamentoDetalhesPage />} />
            <Route path={ROUTES.AGENDA_EDITAR} element={<EditarAgendamentoPage />} />
            <Route path={ROUTES.PACOTES} element={<PacotesListPage />} />
            <Route path={ROUTES.PACOTES_NOVO} element={<PacoteFormPage />} />
            <Route path={ROUTES.PACOTES_EDITAR} element={<PacoteFormPage />} />
            <Route path={ROUTES.FINANCEIRO} element={<FinanceiroDashboardPage />} />
            <Route path={ROUTES.FINANCEIRO_RECEITAS} element={<ReceitasPage />} />
            <Route path={ROUTES.FINANCEIRO_DESPESAS} element={<DespesasPage />} />
            <Route path={ROUTES.FINANCEIRO_FLUXO_CAIXA} element={<FluxoCaixaPage />} />
            <Route path={ROUTES.FINANCEIRO_RELATORIOS} element={<RelatoriosPage />} />
            <Route path={ROUTES.CONFIG} element={<ConfigPage />} />
            <Route path={ROUTES.COMISSOES} element={<ComissoesConsultaPage />} />
            <Route path={ROUTES.AGENDA_GALERIA} element={<AdminGaleriaPage />} />
            <Route path={ROUTES.EDICAO} element={<EdicaoListPage />} />
            <Route path={ROUTES.EDICAO_AGENDAMENTO} element={<EdicaoGaleriaPage />} />
            <Route path={ROUTES.EDICAO_UPLOAD_RAW} element={<UploadRawPage />} />
            <Route path={ROUTES.EDICAO_REVISAO} element={<EdicaoRevisaoPage />} />
            <Route path={ROUTES.ADMIN_ECOMMERCE} element={<AdminEcommercePage />} />
            <Route path={ROUTES.ADMIN_ANALYTICS} element={<AdminAnalyticsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
