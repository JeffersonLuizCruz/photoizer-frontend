import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { ROUTES } from '@/shared/constants'
import { ClientesListPage, ClienteFormPage } from '@/features/clientes'
import { NovoAgendamentoPage, AgendamentoDetalhesPage, EditarAgendamentoPage, AgendaPage, MinhasTarefasPage } from '@/features/agenda'
import { PacotesListPage, PacoteFormPage } from '@/features/pacotes'
import { DashboardPage, DashboardDetalhesPage } from '@/features/dashboard'
import { FinanceiroDashboardPage, RelatoriosPage } from '@/features/financeiro'

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
        <Route element={<AppLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.DASHBOARD_DETALHES} element={<DashboardDetalhesPage />} />
          <Route path={ROUTES.CLIENTES} element={<ClientesListPage />} />
          <Route path={ROUTES.CLIENTES_NOVO} element={<ClienteFormPage />} />
          <Route path={ROUTES.CLIENTES_EDITAR} element={<ClienteFormPage />} />
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
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
