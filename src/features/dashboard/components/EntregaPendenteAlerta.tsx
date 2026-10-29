import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, BellRing, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { AGENDAMENTO_STATUS, ROUTES } from '@/shared/constants'
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  type BrowserNotificationPermission,
} from '@/shared/lib/browser-notifications'
import { useNotificationPreferences } from '@/stores/notification-preferences.store'
import type { Agendamento } from '@/features/agenda/types'

const DISMISS_KEY = 'photoizer:entrega-pendente:alerta-dispensado'
const DISMISS_HOURS = 8

interface DismissState {
  until: number
  quantidade: number
}

interface EntregaPendenteAlertaProps {
  quantidade: number
  entregaMaisAntiga?: Agendamento | null
  userId?: string
}

function chaveDispensa(userId?: string): string {
  return `${DISMISS_KEY}:${userId ?? 'anon'}`
}

function lerDispensa(storageKey: string): DismissState | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DismissState>
    if (typeof parsed.until !== 'number' || typeof parsed.quantidade !== 'number') return null
    return { until: parsed.until, quantidade: parsed.quantidade }
  } catch {
    return null
  }
}

export function EntregaPendenteAlerta({
  quantidade,
  entregaMaisAntiga,
  userId,
}: EntregaPendenteAlertaProps) {
  const navigate = useNavigate()
  const storageKey = chaveDispensa(userId)
  const [permission, setPermission] = useState<BrowserNotificationPermission>(getBrowserNotificationPermission)
  const [dispensa, setDispensa] = useState<DismissState | null>(() => lerDispensa(storageKey))
  const [agora, setAgora] = useState(() => Date.now())
  const browserNotificationsEnabled = useNotificationPreferences((state) => state.browserNotificationsEnabled)
  const setBrowserNotificationsEnabled = useNotificationPreferences((state) => state.setBrowserNotificationsEnabled)

  useEffect(() => {
    if (!dispensa || dispensa.until <= agora) return
    const timeout = window.setTimeout(
      () => setAgora(Date.now()),
      Math.max(dispensa.until - agora + 1000, 1000),
    )
    return () => window.clearTimeout(timeout)
  }, [agora, dispensa])

  const estaDispensado = dispensa !== null && dispensa.until > agora && quantidade <= dispensa.quantidade

  if (quantidade === 0 || estaDispensado) return null

  const podeAtivarLembretes =
    permission !== 'unsupported' && permission !== 'denied' && !browserNotificationsEnabled

  const handleAtivarLembretes = async () => {
    const resultado = await requestBrowserNotificationPermission()
    setPermission(resultado)

    if (resultado === 'granted') {
      setBrowserNotificationsEnabled(true)
      toast.success('Lembretes no navegador ativados')
    } else if (resultado === 'denied') {
      setBrowserNotificationsEnabled(false)
      toast.error('Permissão de notificações bloqueada pelo navegador')
    }
  }

  const handleDispensar = () => {
    const next = {
      until: Date.now() + DISMISS_HOURS * 60 * 60 * 1000,
      quantidade,
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // localStorage indisponível: a dispensa vale apenas nesta montagem.
    }
    setDispensa(next)
    setAgora(Date.now())
  }

  const maisAntigaDesde = entregaMaisAntiga
    ? new Date(entregaMaisAntiga.dataRealizacao ?? entregaMaisAntiga.dataHoraEnsaio)
    : null
  const tempo = maisAntigaDesde && !Number.isNaN(maisAntigaDesde.getTime())
    ? formatDistanceToNow(maisAntigaDesde, { addSuffix: true, locale: ptBR })
    : null
  const cliente = entregaMaisAntiga?.clienteNome ?? 'Cliente não informado'

  const descricao = tempo
    ? quantidade === 1
      ? `A entrega de ${cliente} está em edição ${tempo}. Finalize a edição e marque o agendamento como finalizado.`
      : `A mais antiga é de ${cliente}, em edição ${tempo}. Finalize a edição e marque o agendamento como finalizado.`
    : 'Finalize a edição e marque o agendamento como finalizado para concluir a entrega.'

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">
            {quantidade === 1
              ? '1 entrega aguardando finalização'
              : `${quantidade} entregas aguardando finalização`}
          </p>
          <p className="text-xs">
            {descricao}
            {permission === 'denied' && ' As notificações do navegador estão bloqueadas.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {podeAtivarLembretes && (
          <Button size="sm" variant="outline" onClick={handleAtivarLembretes}>
            <BellRing className="mr-1 h-4 w-4" aria-hidden="true" />
            Ativar lembretes
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => navigate(`${ROUTES.AGENDA}?status=${AGENDAMENTO_STATUS.EM_EDICAO}`)}
        >
          Ver entregas
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDispensar}
          aria-label={`Dispensar lembrete por ${DISMISS_HOURS} horas`}
          title={`Dispensar por ${DISMISS_HOURS} horas`}
          className="text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
