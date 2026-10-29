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

  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-xl border border-border bg-card p-4 pl-5 text-card-foreground shadow-sm sm:p-5 sm:pl-6"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-amber-500" aria-hidden="true" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {quantidade === 1
                ? '1 entrega aguardando finalização'
                : `${quantidade} entregas aguardando finalização`}
            </p>
            <p className="mt-0.5 break-words text-sm leading-relaxed text-muted-foreground">
              {tempo ? (
                <>
                  {quantidade === 1 ? 'A entrega de ' : 'A mais antiga é de '}
                  <span className="font-medium text-foreground">{cliente}</span>
                  {` está em edição ${tempo}. Finalize a edição e marque o agendamento como finalizado.`}
                </>
              ) : (
                'Finalize a edição e marque o agendamento como finalizado para concluir a entrega.'
              )}
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
            className="text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
