import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CalendarDays, Clock, MapPin, Phone, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import type { Tarefa, Agendamento } from '@/features/agenda/types'

const tarefaTipoLabels: Record<string, string> = {
  EDITAR_FOTOS: 'Editar Fotos',
  ENVIAR_PARA_SELECAO: 'Enviar para Seleção',
  ENTREGA_FINAL: 'Entrega Final',
}

interface Props {
  tarefasAtrasadas: Tarefa[]
  agendamentos: Agendamento[]
  isLoading?: boolean
}

export function DashboardDetalhesAlertas({ tarefasAtrasadas, agendamentos, isLoading }: Props) {
  const navigate = useNavigate()

  const hoje = new Date()
  const inicioAmanha = new Date(hoje)
  inicioAmanha.setDate(inicioAmanha.getDate() + 1)
  inicioAmanha.setHours(0, 0, 0, 0)
  const fimAmanha = new Date(inicioAmanha)
  fimAmanha.setHours(23, 59, 59, 999)

  const ensaiosAmanha = agendamentos.filter((a) => {
    const d = new Date(a.dataHoraEnsaio)
    return d >= inicioAmanha && d <= fimAmanha
  }).sort((a, b) => new Date(a.dataHoraEnsaio).getTime() - new Date(b.dataHoraEnsaio).getTime())

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-5 w-56 bg-muted rounded" />
            <div className="mt-2 h-4 w-40 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (tarefasAtrasadas.length === 0 && ensaiosAmanha.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
        <AlertTriangle className="mb-3 h-8 w-8" />
        <p className="text-sm font-medium">Nenhum alerta</p>
        <p className="text-xs mt-1">Todas as tarefas estão em dia</p>
      </div>
    )
  }

  const agendamentoMap = new Map(agendamentos.map((a) => [a.id, a]))

  return (
    <div className="space-y-6">
      {tarefasAtrasadas.length > 0 && (
        <div className="rounded-lg border border-destructive/50">
          <div className="flex items-center gap-2 border-b border-destructive/50 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">
              {tarefasAtrasadas.length} tarefa(s) atrasada(s)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3 text-left">Tarefa</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Data Limite</th>
                  <th className="px-4 py-3 text-left">Atraso</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {tarefasAtrasadas.map((tarefa) => {
                  const ag = agendamentoMap.get(tarefa.agendamentoId)
                  const dataLimite = tarefa.dataLimite ? parseISO(tarefa.dataLimite) : null
                  const diasAtraso = dataLimite ? differenceInDays(new Date(), dataLimite) : null
                  return (
                    <tr key={tarefa.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{tarefaTipoLabels[tarefa.tipo] ?? tarefa.tipo}</p>
                        <p className="text-xs text-muted-foreground capitalize">{tarefa.status.toLowerCase()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{ag?.clienteNome ?? '-'}</p>
                        {ag?.clienteTelefone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {ag.clienteTelefone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {dataLimite ? format(dataLimite, "dd/MM/yyyy", { locale: ptBR }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm font-medium text-destructive">
                          <Clock className="h-3 w-3" />
                          {diasAtraso !== null ? `${diasAtraso}d` : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', tarefa.agendamentoId))}
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Ver Agendamento
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ensaiosAmanha.length > 0 && (
        <div className="rounded-lg border border-blue-500/50">
          <div className="flex items-center gap-2 border-b border-blue-500/50 bg-blue-500/5 px-4 py-3">
            <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {ensaiosAmanha.length} ensaio(s) amanhã
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Horário</th>
                  <th className="px-4 py-3 text-left">Local</th>
                  <th className="px-4 py-3 text-left">Pacote</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {ensaiosAmanha.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{a.clienteNome}</p>
                      {a.clienteTelefone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {a.clienteTelefone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(parseISO(a.dataHoraEnsaio), "HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {a.localEnsaio}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{a.pacoteNome}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', a.id))}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
