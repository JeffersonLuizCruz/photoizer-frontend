import { Calendar, Camera, MapPin, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AgendamentoCliente } from './types'
import type { EtapaGaleria, GaleriaStatusResponse } from '@/features/ecommerce/types/ecommerce.types'

interface Props {
  agendamento: AgendamentoCliente
  status?: GaleriaStatusResponse | null
}

function statusColor(status: string): string {
  switch (status) {
    case 'FINALIZADO': return 'bg-emerald-100 text-emerald-700'
    case 'EM_EDICAO': return 'bg-amber-100 text-amber-700'
    case 'REALIZADO': return 'bg-violet-100 text-violet-700'
    case 'CANCELADO': return 'bg-rose-100 text-rose-600'
    default: return 'bg-muted text-muted-foreground'
  }
}

function etapaColor(etapa: EtapaGaleria | undefined, fallbackStatus: string): string {
  if (!etapa) return statusColor(fallbackStatus)
  switch (etapa) {
    case 'AGUARDANDO_UPLOAD':
    case 'FOTOS_NAO_PUBLICADAS':
      return 'bg-amber-100 text-amber-700'
    case 'SELECAO_EM_EDICAO':
    case 'SELECAO_AGUARDANDO_APROVACAO':
      return 'bg-sky-100 text-sky-700'
    case 'AGUARDANDO_SELECAO':
      return 'bg-violet-100 text-violet-700'
    case 'AGUARDANDO_DOWNLOAD':
    case 'CONCLUIDA':
      return 'bg-emerald-100 text-emerald-700'
    case 'ARQUIVADA':
      return 'bg-muted text-muted-foreground'
    default:
      return statusColor(fallbackStatus)
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function formatarDataCurta(valor: string | null | undefined): string | null {
  if (!valor) return null
  const data = valor.length === 10 ? new Date(`${valor}T00:00:00`) : new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(data)
}

export function CustomerAgendamentoCard({ agendamento, status }: Props) {
  const navigate = useNavigate()
  const progress = agendamento.pacoteQuantidadeFotos > 0
    ? Math.round((agendamento.fotosSelecionadasPacote / agendamento.pacoteQuantidadeFotos) * 100)
    : 0

  const hasPhotos = agendamento.totalFotosPublicadas > 0
  const remaining = agendamento.pacoteQuantidadeFotos - agendamento.fotosSelecionadasPacote
  const etapaLabel = status?.etapaLabel ?? agendamento.statusDescricao
  const previsao = status && status.etapa !== 'CONCLUIDA' && status.etapa !== 'ARQUIVADA'
    ? formatarDataCurta(status.previsaoEntrega)
    : null
  const selecaoEnviada = formatarDataCurta(status?.selecaoEnviadaEm)
  const podeAcompanhar = hasPhotos || !!status
  const mensagem = status?.mensagem
    ?? (agendamento.status === 'EM_EDICAO'
      ? 'As fotos estão sendo editadas pelo estúdio.'
      : 'Aguardando a publicação das fotos pelo estúdio.')

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-sm truncate">{agendamento.pacoteNome}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${etapaColor(status?.etapa, agendamento.status)}`}>
            {etapaLabel}
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
            {(previsao || selecaoEnviada) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {previsao && <span>Previsão de entrega: {previsao}</span>}
                {selecaoEnviada && <span>Seleção enviada em {selecaoEnviada}</span>}
              </div>
            )}
          </div>
        )}

        {!hasPhotos && (
          <div className="space-y-1 py-1">
            <p className="text-xs text-muted-foreground">{mensagem}</p>
            {(previsao || selecaoEnviada) && (
              <p className="text-[11px] text-muted-foreground">
                {previsao ? `Previsão de entrega: ${previsao}` : `Seleção enviada em ${selecaoEnviada}`}
              </p>
            )}
          </div>
        )}

        <button
          onClick={() => navigate(`/g/${agendamento.tokenGaleria}`)}
          disabled={!podeAcompanhar}
          className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">
          <span>{hasPhotos ? 'Acessar Galeria' : podeAcompanhar ? 'Acompanhar ensaio' : 'Indisponível'}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
