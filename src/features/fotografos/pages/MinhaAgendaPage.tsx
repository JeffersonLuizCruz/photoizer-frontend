import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, User, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useAuth } from '@/features/auth/AuthProvider'
import { useFotografoEnsaios } from '../api/queries'
import { formatCurrency } from '@/shared/lib/format'

const statusLabel: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  REALIZADO: 'Realizado',
  EM_EDICAO: 'Em Edição',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  NO_SHOW: 'No Show',
}

const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive' | 'outline'> = {
  CONFIRMADO: 'warning',
  REALIZADO: 'secondary',
  EM_EDICAO: 'secondary',
  FINALIZADO: 'success',
  CANCELADO: 'destructive',
  NO_SHOW: 'destructive',
}

export function MinhaAgendaPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fotografoId = user?.userId
  const { data: ensaios = [], isLoading, isError, error } = useFotografoEnsaios(fotografoId)

  const hoje = new Date()
  const [mesAtual, setMesAtual] = useState(hoje.getMonth())
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(format(hoje, 'yyyy-MM-dd'))

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate()
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay()

  const nomeMes = format(new Date(anoAtual, mesAtual), 'MMMM', { locale: ptBR })
  const mesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)

  const ensaiosPorData = new Map<string, typeof ensaios>()
  for (const e of ensaios) {
    const dataKey = format(new Date(e.dataHoraEnsaio), 'yyyy-MM-dd')
    if (!ensaiosPorData.has(dataKey)) ensaiosPorData.set(dataKey, [])
    ensaiosPorData.get(dataKey)!.push(e)
  }

  const ensaiosSelecionados = selectedDate ? ensaiosPorData.get(selectedDate) ?? [] : []

  const mesAnterior = () => {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(anoAtual - 1) }
    else setMesAtual(mesAtual - 1)
  }

  const proximoMes = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(anoAtual + 1) }
    else setMesAtual(mesAtual + 1)
  }

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 bg-muted rounded" />
        <div className="animate-pulse h-96 w-full bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Visualize seus ensaios organizados por data.
        </p>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Erro ao carregar ensaios</p>
          <p className="text-sm text-destructive/80 mt-1">
            {error instanceof Error ? error.message : 'Não foi possível carregar sua agenda. Tente novamente.'}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <Button variant="ghost" size="icon" onClick={mesAnterior} aria-label="Mês anterior">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-base font-semibold">{mesCapitalizado} {anoAtual}</h2>
            <Button variant="ghost" size="icon" onClick={proximoMes} aria-label="Próximo mês">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {diasSemana.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: primeiroDia }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1
                const dataStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                const temEnsaio = ensaiosPorData.has(dataStr)
                const isSelected = selectedDate === dataStr
                const isHoje = dataStr === format(hoje, 'yyyy-MM-dd')

                return (
                  <button
                    key={dia}
                    onClick={() => setSelectedDate(dataStr)}
                    className={`
                      relative aspect-square rounded-lg text-sm font-medium transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                      ${isHoje && !isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                      ${temEnsaio && !isSelected ? 'bg-primary/10 font-bold' : ''}
                    `}
                  >
                    {dia}
                    {temEnsaio && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold">
              {selectedDate
                ? format(new Date(selectedDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : 'Selecione uma data'}
            </h3>
          </div>

          {ensaiosSelecionados.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              Nenhum ensaio nesta data.
            </div>
          ) : (
            <div className="divide-y">
              {ensaiosSelecionados
                .sort((a, b) => new Date(a.dataHoraEnsaio).getTime() - new Date(b.dataHoraEnsaio).getTime())
                .map((e) => {
                  const data = new Date(e.dataHoraEnsaio)
                  return (
                    <button
                      key={e.agendamentoId}
                      type="button"
                      className="block w-full p-4 text-left hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/agenda/${e.agendamentoId}`)}
                      aria-label={`Abrir detalhes do ensaio de ${e.clienteNome} às ${format(data, 'HH:mm', { locale: ptBR })}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">
                              {format(data, 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm">{e.clienteNome}</span>
                          </div>
                          {e.pacoteNome && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">{e.pacoteNome}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(e.valorTotal)} · Partilha: {formatCurrency(e.partilhaFotografo)}
                          </p>
                        </div>
                        <Badge variant={statusVariant[e.status] ?? 'outline'}>
                          {statusLabel[e.status] ?? e.status}
                        </Badge>
                      </div>
                  </button>
                )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}