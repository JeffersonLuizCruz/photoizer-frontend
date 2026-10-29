import { useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AGENDAMENTO_STATUS, ROUTES } from '@/shared/constants'
import { getVisibleEntries, isNavItem } from '@/shared/lib/navigation'
import { useEntregasPendentes } from '@/shared/hooks/useEntregasPendentes'
import { useAuth } from '@/features/auth/AuthProvider'

const TOAST_DURATION_MS = 8_000

/**
 * Mostra um lembrete único por sessão quando existem entregas em edição.
 * O sino e o banner do dashboard continuam sendo as fontes persistentes.
 */
export function EntregaPendenteToast() {
  const navigate = useNavigate()
  const { papel, user } = useAuth()
  const podeVerDashboard = getVisibleEntries(papel).some(
    (entry) => isNavItem(entry) && entry.to === ROUTES.DASHBOARD,
  )
  const { entregasPendentes, quantidade, isLoading } = useEntregasPendentes({
    enabled: podeVerDashboard && !!user,
    userId: user?.userId,
  })
  const exibidoRef = useRef(false)

  useEffect(() => {
    if (!podeVerDashboard || isLoading || quantidade === 0 || exibidoRef.current) return

    const storageKey = `photoizer:entrega-pendente:toast:${user?.userId ?? 'anon'}`
    try {
      if (sessionStorage.getItem(storageKey)) {
        exibidoRef.current = true
        return
      }
      sessionStorage.setItem(storageKey, '1')
    } catch {
      // sessionStorage indisponível: o ref evita repetição nesta montagem.
    }

    exibidoRef.current = true
    const maisAntiga = entregasPendentes[0]
    const cliente = maisAntiga.clienteNome ?? 'Cliente não informado'
    const desde = new Date(maisAntiga.dataRealizacao ?? maisAntiga.dataHoraEnsaio)
    const tempo = formatDistanceToNow(desde, { addSuffix: true, locale: ptBR })

    toast.warning(
      quantidade === 1 ? '1 entrega pendente' : `${quantidade} entregas pendentes`,
      {
        description: `A mais antiga é de ${cliente}, em edição ${tempo}. Finalize a edição e marque o agendamento como finalizado.`,
        duration: TOAST_DURATION_MS,
        action: {
          label: 'Ver entregas',
          onClick: () =>
            navigate(`${ROUTES.AGENDA}?status=${AGENDAMENTO_STATUS.EM_EDICAO}`),
        },
      },
    )
  }, [
    entregasPendentes,
    isLoading,
    navigate,
    podeVerDashboard,
    quantidade,
    user?.userId,
  ])

  return null
}
