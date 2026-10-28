import { useParams, useNavigate } from 'react-router-dom'
import { useAgendamento, useUpdateAgendamento, useUpdateAgendamentoAvulso } from '../api/queries'
import { EditarAgendamentoForm } from '../components/EditarAgendamentoForm'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { ROUTES } from '@/shared/constants'
import type { EditarAgendamentoFormData } from '../schemas/agendamento.schema'
import type { Agendamento } from '../types'

export function EditarAgendamentoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: agendamento, isLoading, error } = useAgendamento(id ?? '')

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

  return <EditarAgendamentoContent agendamento={agendamento} />
}

function EditarAgendamentoContent({ agendamento }: { agendamento: Agendamento }) {
  const navigate = useNavigate()
  const atualizarNormal = useUpdateAgendamento(agendamento.id)
  const atualizarAvulso = useUpdateAgendamentoAvulso(agendamento.id)
  const { mutate: updateAgendamento, isPending } =
    agendamento.origem === 'AVULSO' ? atualizarAvulso : atualizarNormal

  const handleSubmit = (data: EditarAgendamentoFormData) => {
    updateAgendamento(data, {
      onSuccess: () => navigate(`/agenda/${agendamento.id}`),
    })
  }

  return (
    <div>
      <PageTitle
        title="Editar Agendamento"
        description={agendamento.clienteNome ?? 'Pré-reserva'}
        breadcrumbs={[
          { label: 'Agenda', href: ROUTES.AGENDA },
          { label: agendamento.clienteNome ?? 'Pré-reserva', href: `/agenda/${agendamento.id}` },
          { label: 'Editar' },
        ]}
      />

      <div className="max-w-2xl rounded-lg border bg-card p-4 sm:p-6">
        <EditarAgendamentoForm
          agendamento={agendamento}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  )
}
