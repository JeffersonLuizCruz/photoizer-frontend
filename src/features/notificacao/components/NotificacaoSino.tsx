import { Bell } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Badge } from '@/shared/components/ui/badge'
import { notificacaoService } from '../services/notificacao.service'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificacaoSino() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => notificacaoService.listar(),
    refetchInterval: 1000 * 60 * 5,
  })

  const { data: countData } = useQuery({
    queryKey: ['notificacoes', 'nao-lidas'],
    queryFn: () => notificacaoService.countNaoLidas(),
    refetchInterval: 1000 * 60 * 5,
  })

  const { mutate: marcarLida } = useMutation({
    mutationFn: (id: string) => notificacaoService.marcarComoLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })

  const naoLidas = countData ?? 0
  const ultimas = notificacoes.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {naoLidas > 99 ? '99+' : naoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {naoLidas} nova{naoLidas > 1 ? 's' : ''}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ultimas.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          ultimas.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-1 py-3 ${!n.lida ? 'bg-primary/5' : ''}`}
              onClick={() => {
                if (!n.lida) marcarLida(n.id)
                if (n.link) navigate(n.link)
              }}
            >
              <div className="flex w-full items-center justify-between">
                <span className={`text-sm ${!n.lida ? 'font-semibold' : ''}`}>{n.titulo}</span>
                {!n.lida && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <span className="line-clamp-2 text-xs text-muted-foreground">{n.mensagem}</span>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(n.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            </DropdownMenuItem>
          ))
        )}
        {notificacoes.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm font-medium text-primary"
              onClick={() => navigate(ROUTES.NOTIFICACOES)}
            >
              Ver todas
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
