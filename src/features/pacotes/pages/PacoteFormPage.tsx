import { useNavigate, useParams } from 'react-router-dom'
import { usePacote, useCreatePacote, useUpdatePacote } from '../api/queries'
import { PacoteForm } from '../components/PacoteForm'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { ROUTES } from '@/shared/constants'
import type { PacoteFormData } from '../schemas/pacote.schema'

export function PacoteFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: pacote, isLoading: isLoadingPacote } = usePacote(id)
  const { mutate: createPacote, isPending: isCreating } = useCreatePacote()
  const { mutate: updatePacote, isPending: isUpdating } = useUpdatePacote(id ?? '')

  const isLoading = isCreating || isUpdating

  const handleSubmit = (data: PacoteFormData) => {
    if (isEdit && id) {
      updatePacote(data, {
        onSuccess: () => navigate(ROUTES.PACOTES),
      })
    } else {
      createPacote(data, {
        onSuccess: () => navigate(ROUTES.PACOTES),
      })
    }
  }

  if (isEdit && isLoadingPacote) {
    return <PageLoading />
  }

  return (
    <>
      <PageTitle
        title={isEdit ? 'Editar Pacote' : 'Novo Pacote'}
        description={isEdit ? `Editando "${pacote?.nome}"` : 'Crie um novo pacote de ensaio'}
        breadcrumbs={[
          { label: 'Pacotes', href: ROUTES.PACOTES },
          { label: isEdit ? pacote?.nome ?? 'Editar' : 'Novo' },
        ]}
      />

      <div className="max-w-2xl rounded-lg border bg-card p-6">
        <PacoteForm
          onSubmit={handleSubmit}
          defaultValues={
            isEdit && pacote
              ? {
                  nome: pacote.nome,
                  descricao: pacote.descricao,
                  quantidadeFotos: pacote.quantidadeFotos,
                  quantidadeVideos: pacote.quantidadeVideos,
                  valorBase: pacote.valorBase,
                  bloqueiaDiaInteiro: pacote.bloqueiaDiaInteiro,
                  duracaoEstimada: pacote.duracaoEstimada,
                  ativo: pacote.ativo,
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
