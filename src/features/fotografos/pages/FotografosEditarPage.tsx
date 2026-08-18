import { useParams, useNavigate } from 'react-router-dom'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ROUTES } from '@/shared/constants'
import { useFotografo, useAtualizarFotografo } from '../api/queries'
import { FotografosForm } from '../components/FotografosForm'

export function FotografosEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: fotografo, isLoading } = useFotografo(id)
  const atualizar = useAtualizarFotografo(id!)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse h-8 w-48 bg-muted rounded" />
        <div className="animate-pulse h-32 w-full max-w-lg bg-muted rounded" />
      </div>
    )
  }

  if (!fotografo) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Fotógrafo não encontrado</p>
      </div>
    )
  }

  const onSubmit = async (data: { nome: string; email: string; telefone?: string }) => {
    await atualizar.mutateAsync(data)
    navigate(`/fotografos/${id}`)
  }

  return (
    <div className="p-6">
      <PageTitle
        title="Editar Fotógrafo"
        description={`Editando dados de ${fotografo.nome}`}
        breadcrumbs={[
          { label: 'Fotógrafos', href: ROUTES.FOTOGRAFOS },
          { label: fotografo.nome, href: `/fotografos/${id}` },
          { label: 'Editar' },
        ]}
      />
      <div className="mt-6">
        <FotografosForm
          onSubmit={onSubmit}
          defaultValues={{
            nome: fotografo.nome,
            email: fotografo.email,
            telefone: fotografo.telefone ?? '',
          }}
          isPending={atualizar.isPending}
          mode="edit"
        />
      </div>
    </div>
  )
}