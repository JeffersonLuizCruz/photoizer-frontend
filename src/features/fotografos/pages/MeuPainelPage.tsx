import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, FileDown, ArrowRight, User, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useAuth } from '@/features/auth/AuthProvider'
import { useFotografoDashboard, useFotografoEnsaios, useExportarCsvFotografo } from '../api/queries'
import { FotografoCard } from '../components/FotografoCard'
import { TabelaEnsaiosFotografo } from '../components/TabelaEnsaiosFotografo'
import { ROUTES } from '@/shared/constants'

const statusLabel: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  REALIZADO: 'Realizado',
  EM_EDICAO: 'Em Edição',
  FOTOS_ENVIADAS_PARA_SELECAO: 'Seleção',
  FOTOS_ENTREGUES: 'Entregue',
  FINALIZADO: 'Finalizado',
}

export function MeuPainelPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fotografoId = user?.userId
  const { data: dashboard, isLoading } = useFotografoDashboard(fotografoId)
  const { data: ensaios = [] } = useFotografoEnsaios(fotografoId)
  const exportCsv = useExportarCsvFotografo()

  const nome = dashboard?.fotografoNome ?? user?.nome ?? 'Fotógrafo'

  const proximosEnsaios = useMemo(() =>
    ensaios
      .filter((e) => e.status === 'CONFIRMADO' || e.status === 'REALIZADO')
      .sort((a, b) => new Date(a.dataHoraEnsaio).getTime() - new Date(b.dataHoraEnsaio).getTime())
      .slice(0, 5),
    [ensaios],
  )

  const ultimosEnsaios = useMemo(() =>
    [...ensaios]
      .sort((a, b) => new Date(b.dataHoraEnsaio).getTime() - new Date(a.dataHoraEnsaio).getTime())
      .slice(0, 5),
    [ensaios],
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 bg-muted rounded" />
        <div className="animate-pulse h-24 w-full bg-muted rounded" />
        <div className="animate-pulse h-64 w-full bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Painel</h1>
          <p className="text-sm text-muted-foreground">
            Olá, {nome}! Confira seus próximos ensaios e resumo financeiro.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fotografoId && exportCsv.mutate(fotografoId)}
          disabled={exportCsv.isPending}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {dashboard && (
        <FotografoCard
          totalEnsaios={dashboard.totalEnsaios}
          totalPartilha={dashboard.totalPartilha}
          totalRepasse={dashboard.totalRepasse}
        />
      )}

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Próximos Ensaios</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.MINHA_AGENDA)}>
            Ver agenda completa
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {proximosEnsaios.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum ensaio futuro agendado.
          </div>
        ) : (
          <div className="divide-y">
            {proximosEnsaios.map((e) => {
              const data = new Date(e.dataHoraEnsaio)
              const hoje = new Date()
              const ehHoje = data.toDateString() === hoje.toDateString()
              const amanha = new Date(hoje)
              amanha.setDate(amanha.getDate() + 1)
              const ehAmanha = data.toDateString() === amanha.toDateString()

              let diaLabel = format(data, "dd 'de' MMM", { locale: ptBR })
              if (ehHoje) diaLabel = 'Hoje'
              else if (ehAmanha) diaLabel = 'Amanhã'

              return (
                <button
                  key={e.agendamentoId}
                  type="button"
                  className="flex w-full items-center gap-4 p-4 text-left hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/agenda/${e.agendamentoId}`)}
                  aria-label={`Abrir detalhes do ensaio de ${e.clienteNome}`}
                >
                  <div className="min-w-[60px] text-center">
                    <p className={`text-sm font-bold ${ehHoje ? 'text-primary' : ''}`}>{diaLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(data, 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{e.clienteNome}</span>
                    </div>
                    {e.pacoteNome && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">{e.pacoteNome}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={ehHoje ? 'default' : 'outline'}>
                    {statusLabel[e.status] ?? e.status}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Últimos Ensaios</h2>
        <TabelaEnsaiosFotografo ensaios={ultimosEnsaios} />
        {ensaios.length > 5 && (
          <div className="text-center">
            <Button variant="link" onClick={() => navigate(ROUTES.MINHAS_FINANCAS)}>
              Ver todos os {ensaios.length} ensaios
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}