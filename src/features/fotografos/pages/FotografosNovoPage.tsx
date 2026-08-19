import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ROUTES } from '@/shared/constants'
import { useCriarFotografo } from '../api/queries'
import { FotografosForm } from '../components/FotografosForm'
import type { CriarFotografoFormData } from '../components/FotografosForm'

export function FotografosNovoPage() {
  const navigate = useNavigate()
  const criar = useCriarFotografo()

  const onSubmit = async (data: CriarFotografoFormData) => {
    const fotografo = await criar.mutateAsync(data)
    navigate(`/fotografos/${fotografo.id}`)
  }

  return (
    <div>
      <PageTitle
        title="Novo Fotógrafo"
        description="Cadastre um novo fotógrafo no sistema"
        breadcrumbs={[
          { label: 'Fotógrafos', href: ROUTES.FOTOGRAFOS },
          { label: 'Novo' },
        ]}
      />
      <div className="mt-6">
        <FotografosForm onSubmit={onSubmit} isPending={criar.isPending} mode="create" />
      </div>
    </div>
  )
}