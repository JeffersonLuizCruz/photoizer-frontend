import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, BellOff, BellRing, CheckCheck, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  type BrowserNotificationPermission,
} from '@/shared/lib/browser-notifications'
import { useNotificationPreferences } from '@/stores/notification-preferences.store'
import { useNotificacoes, useNotificacoesNaoLidas, useMarcarComoLida, useMarcarTodasComoLidas } from '../api/queries'
import { useBrowserNotifications } from '../hooks/useBrowserNotifications'

const tipoIcon: Record<string, string> = {
  NOVO_ENSAIO: '📷',
  ENSAIO_REALIZADO: '✅',
  PAGAMENTO_FINAL: '💰',
  ENSAIO_REATRIBUIDO: '🔁',
  SELECAO_ENVIADA: '🖼️',
  ENTREGA_PENDENTE: '📦',
}

interface NotificationBellProps {
  userId?: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const navigate = useNavigate()
  const [permission, setPermission] = useState<BrowserNotificationPermission>(getBrowserNotificationPermission)
  const browserNotificationsEnabled = useNotificationPreferences((state) => state.browserNotificationsEnabled)
  const setBrowserNotificationsEnabled = useNotificationPreferences((state) => state.setBrowserNotificationsEnabled)
  const notifyOnlyWhenHidden = useNotificationPreferences((state) => state.notifyOnlyWhenHidden)
  const setNotifyOnlyWhenHidden = useNotificationPreferences((state) => state.setNotifyOnlyWhenHidden)

  const { data: notificacoesData } = useNotificacoes()
  const notificacoes = notificacoesData?.data ?? []
  const { data: naoLidas = 0 } = useNotificacoesNaoLidas()
  const marcarLida = useMarcarComoLida()
  const marcarTodas = useMarcarTodasComoLidas()

  useBrowserNotifications(userId)

  const recentes = notificacoes.slice(0, 10)

  const handleClick = (n: (typeof notificacoes)[0]) => {
    if (!n.lida) marcarLida.mutate(n.id)
    if (n.link) navigate(n.link)
  }

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

  const handleDesativarLembretes = () => {
    setBrowserNotificationsEnabled(false)
    toast.success('Lembretes no navegador desativados')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
              {naoLidas > 99 ? '99+' : naoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] max-h-[75dvh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-10 sm:h-9"
              onClick={() => marcarTodas.mutate()}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentes.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            Nenhuma notificação
          </div>
        ) : (
          recentes.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-0.5 py-3 cursor-pointer ${!n.lida ? 'bg-primary/5' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-base">{tipoIcon[n.tipo] ?? '🔔'}</span>
                <span className={`text-sm flex-1 ${!n.lida ? 'font-semibold' : ''}`}>{n.titulo}</span>
                {!n.lida && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground ml-7 line-clamp-2">{n.mensagem}</p>
              <span className="text-[10px] text-muted-foreground ml-7 mt-0.5">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />

        {permission === 'unsupported' && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            <BellOff className="mr-2 h-4 w-4" />
            Navegador sem suporte a notificações
          </DropdownMenuItem>
        )}

        {permission === 'denied' && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            <BellOff className="mr-2 h-4 w-4" />
            Notificações bloqueadas no navegador
          </DropdownMenuItem>
        )}

        {permission !== 'unsupported' && permission !== 'denied' && browserNotificationsEnabled && (
          <DropdownMenuItem className="text-xs cursor-pointer" onClick={handleDesativarLembretes}>
            <BellOff className="mr-2 h-4 w-4" />
            Desativar lembretes no navegador
          </DropdownMenuItem>
        )}

        {permission !== 'unsupported' && permission !== 'denied' && browserNotificationsEnabled && (
          <DropdownMenuCheckboxItem
            className="text-xs"
            checked={notifyOnlyWhenHidden}
            onCheckedChange={(checked) => setNotifyOnlyWhenHidden(checked === true)}
          >
            Notificar só em segundo plano
          </DropdownMenuCheckboxItem>
        )}

        {permission !== 'unsupported' && permission !== 'denied' && !browserNotificationsEnabled && (
          <DropdownMenuItem className="text-xs cursor-pointer" onClick={handleAtivarLembretes}>
            <BellRing className="mr-2 h-4 w-4" />
            Ativar lembretes no navegador
          </DropdownMenuItem>
        )}

        {notificacoes.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs text-muted-foreground cursor-pointer"
              onClick={() => marcarTodas.mutate()}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Ver todas as {notificacoes.length} notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
