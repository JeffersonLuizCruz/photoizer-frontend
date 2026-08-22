import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNotificacoes, useNotificacoesNaoLidas, useMarcarComoLida, useMarcarTodasComoLidas } from '../api/queries'

const tipoIcon: Record<string, string> = {
  NOVO_ENSAIO: '📷',
  ENSAIO_REALIZADO: '✅',
  PAGAMENTO_FINAL: '💰',
  LEMBRETE_ENSAIO: '⏰',
  REPASSE_FOTOGRAFO: '💵',
  SISTEMA: '🔔',
}

export function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.userId

  const { data: notificacoes = [] } = useNotificacoes(userId)
  const { data: naoLidas = 0 } = useNotificacoesNaoLidas(userId)
  const marcarLida = useMarcarComoLida()
  const marcarTodas = useMarcarTodasComoLidas()

  const recentes = notificacoes.slice(0, 10)

  const handleClick = (n: (typeof notificacoes)[0]) => {
    if (!n.lida) marcarLida.mutate(n.id)
    if (n.link) navigate(n.link)
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
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] max-h-[75vh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-10 sm:h-9"
              onClick={() => userId && marcarTodas.mutate(userId)}
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
                {formatDistanceToNow(new Date(n.auditInfo.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </DropdownMenuItem>
          ))
        )}

        {notificacoes.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs text-muted-foreground cursor-pointer"
              onClick={() => userId && marcarTodas.mutate(userId)}
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