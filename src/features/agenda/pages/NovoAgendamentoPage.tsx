import { useSearchParams } from 'react-router-dom'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { NovoAgendamentoWizard } from '../components/NovoAgendamentoWizard'
import { ROUTES } from '@/shared/constants'

export function NovoAgendamentoPage() {
  const [searchParams] = useSearchParams()
  const dataParam = searchParams.get('data')
  const dataInicial = dataParam ? new Date(dataParam + 'T12:00:00') : undefined

  return (
    <>
      <PageTitle
        title="Novo Agendamento"
        description="Preencha as informações para criar um novo agendamento"
        breadcrumbs={[
          { label: 'Agenda', href: ROUTES.AGENDA },
          { label: 'Novo' },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        <NovoAgendamentoWizard dataInicial={dataInicial} />
      </div>
    </>
  )
}
