import { useNavigate, useParams } from 'react-router-dom'
import { useCliente, useCreateCliente, useUpdateCliente } from '../api/queries'
import { ClienteForm } from '../components/ClienteForm'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { ROUTES } from '@/shared/constants'
import type { ClienteFormData } from '../schemas/cliente.schema'

export function ClienteFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: cliente, isLoading: isLoadingCliente } = useCliente(id)
  const { mutate: createCliente, isPending: isCreating } = useCreateCliente()
  const { mutate: updateCliente, isPending: isUpdating } = useUpdateCliente(id ?? '')

  const isLoading = isCreating || isUpdating

  const handleSubmit = (data: ClienteFormData) => {
    if (isEdit && id) {
      updateCliente(data, {
        onSuccess: () => navigate(ROUTES.CLIENTES),
      })
    } else {
      createCliente(data, {
        onSuccess: () => navigate(ROUTES.CLIENTES),
      })
    }
  }

  if (isEdit && isLoadingCliente) {
    return <PageLoading />
  }

  return (
    <>
      <PageTitle
        title={isEdit ? 'Editar Cliente' : 'Novo Cliente'}
        description={isEdit ? `Editando "${cliente?.nome}"` : 'Cadastre um novo cliente'}
        breadcrumbs={[
          { label: 'Clientes', href: ROUTES.CLIENTES },
          { label: isEdit ? cliente?.nome ?? 'Editar' : 'Novo' },
        ]}
      />

      <div className="max-w-2xl rounded-lg border bg-card p-6">
        <ClienteForm
          onSubmit={handleSubmit}
          defaultValues={
            isEdit && cliente
              ? {
                  nome: cliente.nome,
                  telefone: cliente.telefone,
                  email: cliente.email ?? '',
                  cpf: cliente.cpf ?? '',
                  cidade: cliente.cidade ?? '',
                  estado: cliente.estado ?? '',
                  origem: cliente.origem,
                  observacoes: cliente.observacoes ?? '',
                }
              : undefined
          }
          isLoading={isLoading}
          mode={isEdit ? 'edit' : 'create'}
        />
      </div>
    </>
  )
}
