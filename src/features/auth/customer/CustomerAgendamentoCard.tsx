import { Calendar, Camera, MapPin, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AgendamentoCliente } from './types'

interface Props {
  agendamento: AgendamentoCliente
}

function statusColor(status: string): string {
  switch (status) {
    case 'FINALIZADO': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'ENTREGUE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'EM_EDICAO': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'REALIZADO': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
    case 'SELECAO_ENVIADA': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
    case 'CANCELADO': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export function CustomerAgendamentoCard({ agendamento }: Props) {
  const navigate = useNavigate()
  const progress = agendamento.pacoteQuantidadeFotos > 0
    ? Math.round((agendamento.fotosSelecionadasPacote / agendamento.pacoteQuantidadeFotos) * 100)
    : 0

  const hasPhotos = agendamento.totalFotosPublicadas > 0
  const remaining = agendamento.pacoteQuantidadeFotos - agendamento.fotosSelecionadasPacote

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">{agendamento.pacoteNome}</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(agendamento.dataHoraEnsaio)}
              </span>
              {agendamento.localEnsaio && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {agendamento.localEnsaio}
                </span>
              )}
            </div>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor(agendamento.status)}`}>
            {agendamento.statusDescricao}
          </span>
        </div>

        {hasPhotos && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {agendamento.fotosSelecionadasPacote} de {agendamento.pacoteQuantidadeFotos} fotos selecionadas
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{agendamento.totalFotosPublicadas} fotos publicadas</span>
              {remaining > 0 && <span>{remaining} disponíveis no pacote</span>}
              {agendamento.fotosPagas > 0 && <span>{agendamento.fotosPagas} extras pagas</span>}
            </div>
          </div>
        )}

        {!hasPhotos && (
          <p className="text-xs text-muted-foreground py-1">
            {agendamento.status === 'EM_EDICAO'
              ? 'Fotos estão sendo editadas'
              : 'Aguardando publicação das fotos'}
          </p>
        )}

        <button
          onClick={() => navigate(`/g/${agendamento.tokenGaleria}`)}
          disabled={!hasPhotos}
          className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">
          <span>{hasPhotos ? 'Acessar Galeria' : 'Indisponível'}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
