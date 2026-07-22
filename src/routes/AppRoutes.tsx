import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { BlankLayout } from '@/shared/components/layout/BlankLayout'
import { ROUTES } from '@/shared/constants'
import { GaleriaClientePage } from '@/features/ecommerce/pages/GaleriaClientePage'
import { AdminEcommercePage } from '@/features/ecommerce/pages/AdminEcommercePage'
import { ClientesListPage, ClienteFormPage, ClienteDetalhesPage } from '@/features/clientes'
import { NovoAgendamentoPage, AgendamentoDetalhesPage, EditarAgendamentoPage, AgendaPage, MinhasTarefasPage } from '@/features/agenda'
import { AdminGaleriaPage } from '@/features/fotos'
import { PacotesListPage, PacoteFormPage } from '@/features/pacotes'
import { DashboardPage, DashboardDetalhesPage } from '@/features/dashboard'
import { ConfigPage } from '@/features/config'
import { ComissoesConsultaPage } from '@/features/comissoes'
import { FinanceiroDashboardPage, RelatoriosPage } from '@/features/financeiro'
import { LoginPage, ProtectedRoute } from '@/features/auth'

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
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

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
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
