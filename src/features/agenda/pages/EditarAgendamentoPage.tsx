import { useParams, useNavigate } from 'react-router-dom'
import { useAgendamento, useUpdateAgendamento } from '../api/queries'
import { EditarAgendamentoForm } from '../components/EditarAgendamentoForm'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { ROUTES } from '@/shared/constants'
import type { EditarAgendamentoFormData } from '../schemas/agendamento.schema'

export function EditarAgendamentoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: agendamento, isLoading, error } = useAgendamento(id ?? '')
  const { mutate: updateAgendamento, isPending } = useUpdateAgendamento(id ?? '')

  if (isLoading) return <PageLoading />
  if (error || !agendamento) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium text-muted-foreground">Agendamento não encontrado</p>
        <button
          className="mt-4 text-sm text-primary underline"
          onClick={() => navigate(ROUTES.AGENDA)}
        >
          Voltar para Agenda
        </button>
      </div>
    )
  }

  const handleSubmit = (data: EditarAgendamentoFormData) => {
    updateAgendamento(data, {
      onSuccess: () => navigate(`/agenda/${id}`),
    })
  }

  return (
    <div>
      <PageTitle
        title="Editar Agendamento"
        description={agendamento.clienteNome}
        breadcrumbs={[
          { label: 'Agenda', href: ROUTES.AGENDA },
          { label: agendamento.clienteNome, href: `/agenda/${id}` },
          { label: 'Editar' },
        ]}
      />

      <div className="max-w-2xl rounded-lg border bg-card p-6">
        <EditarAgendamentoForm
          agendamento={agendamento}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  )
}
