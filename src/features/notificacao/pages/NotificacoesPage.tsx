import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { CheckCheck, Loader2 } from 'lucide-react'
import { notificacaoService } from '../services/notificacao.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

export function NotificacoesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => notificacaoService.listar(),
  })

  const { mutate: marcarTodas, isPending } = useMutation({
    mutationFn: () => notificacaoService.marcarTodasComoLidas(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })

  const { mutate: marcarLida } = useMutation({
    mutationFn: (id: string) => notificacaoService.marcarComoLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  return (
    <>
      <PageTitle
        title="Notificações"
        description={naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Todas lidas'}
        breadcrumbs={[{ label: 'Notificações' }]}
        actions={
          naoLidas > 0 ? (
            <Button variant="outline" onClick={() => marcarTodas()} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
              Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <CheckCheck className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">Nenhuma notificação</p>
          <p className="text-sm">Você está em dia!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificacoes.map((n) => (
            <div
              key={n.id}
              className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent ${
                !n.lida ? 'border-primary/20 bg-primary/5' : ''
              }`}
              onClick={() => {
                if (!n.lida) marcarLida(n.id)
                if (n.link) navigate(n.link)
              }}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${!n.lida ? 'font-semibold' : ''}`}>{n.titulo}</span>
                  {!n.lida && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{n.mensagem}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(n.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
