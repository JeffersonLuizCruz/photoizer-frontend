import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, MapPin, User, DollarSign, Camera, Pencil, FileText } from 'lucide-react'
import type { Agendamento } from '../types'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { PacoteColorChip } from '@/shared/components/ui/pacote-color-chip'
import { EditarClienteDialog } from './EditarClienteDialog'
import { useAuth } from '@/features/auth/AuthProvider'

interface AgendamentoResumoProps {
  agendamento: Agendamento
}

function InfoCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        {title}
      </div>
      <div className="space-y-3 text-sm sm:space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, emphasis }: { label: string; value: React.ReactNode; emphasis?: boolean }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <dl className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm sm:font-normal sm:normal-case sm:tracking-normal">
        {label}
        <span className="hidden sm:inline">:</span>
      </dt>
      <dd className={cn('min-w-0 break-words font-medium sm:text-right', emphasis && 'font-semibold tabular-nums')}>{value}</dd>
    </dl>
  )
}

export function AgendamentoResumo({ agendamento }: AgendamentoResumoProps) {
  const [editClienteOpen, setEditClienteOpen] = useState(false)
  const { isAgendador } = useAuth()
  const podeVerMetricasInternas = !isAgendador

  const dataEnsaio = agendamento.dataHoraEnsaio
    ? format(new Date(agendamento.dataHoraEnsaio), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
    : '-'
  const horaEnsaio = agendamento.dataHoraEnsaio
    ? format(new Date(agendamento.dataHoraEnsaio), "HH:mm", { locale: ptBR })
    : '-'

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-3">
      <InfoCard icon={User} title="Dados do Cliente">
        <InfoRow label="Nome" value={agendamento.clienteNome} />
        <InfoRow label="Telefone" value={agendamento.clienteTelefone} />
        <InfoRow label="Email" value={agendamento.clienteEmail} />
        <InfoRow label="CPF" value={agendamento.clienteCpf} />
        <InfoRow label="Cidade/Estado" value={agendamento.clienteCidade && agendamento.clienteEstado ? `${agendamento.clienteCidade}/${agendamento.clienteEstado}` : null} />
        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setEditClienteOpen(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar Cliente
          </Button>
        </div>
      </InfoCard>

      {agendamento.clienteId && (
        <EditarClienteDialog
          clienteId={agendamento.clienteId}
          open={editClienteOpen}
          onOpenChange={setEditClienteOpen}
        />
      )}

      <InfoCard icon={Camera} title="Dados do Ensaio">
        <div className="flex min-w-0 items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-words">{dataEnsaio}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1">
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-words">{horaEnsaio}</span>
          {agendamento.duracaoMinutos > 0 && <span className="text-muted-foreground">({agendamento.duracaoMinutos}min)</span>}
        </div>
        <div className="flex min-w-0 items-start gap-1">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-words">{agendamento.localEnsaio}</span>
        </div>
        <InfoRow
          label="Pacote"
          value={<PacoteColorChip nome={agendamento.pacoteNome} cor={agendamento.pacoteCor} className="sm:ml-auto" />}
        />
        <InfoRow label="Fotógrafo responsável" value={agendamento.fotografoNome} />
        <InfoRow label="Editor" value={agendamento.editorNome} />
        {agendamento.fotografos && agendamento.fotografos.length > 0 && (
          <div className="min-w-0">
            <span className="text-muted-foreground shrink-0">Equipe do ensaio:</span>
            <ul className="mt-1 space-y-1">
              {agendamento.fotografos.map((f) => (
                <li key={f.fotografoId} className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0 break-words font-medium sm:text-right">{f.fotografoNome}</span>
                  {f.papelParceiro && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{f.papelParceiro}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <InfoRow label="Uso de Imagem" value={agendamento.autorizaUsoImagem ? 'Autorizado' : 'Não autorizado'} />
        <InfoRow
          label="Proposta enviada"
          value={
            agendamento.dataEnvioProposta
              ? format(new Date(agendamento.dataEnvioProposta), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : null
          }
        />
        <InfoRow
          label="Contrato"
          value={
            agendamento.dataAssinatura
              ? `Confirmado em ${format(new Date(agendamento.dataAssinatura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
              : 'Não confirmado'
          }
        />
      </InfoCard>

      <InfoCard icon={DollarSign} title="Resumo Financeiro">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Receita</p>
        <InfoRow label="Valor do Pacote" value={`R$ ${agendamento.valorPacote.toFixed(2)}`} />
        {podeVerMetricasInternas && (
          <InfoRow
            label="Custo Deslocamento"
            value={
              <span className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                <span>R$ {(agendamento.custoDeslocamento ?? 0).toFixed(2)}</span>
                {agendamento.repassarDeslocamento ? (
                  <span className="text-[10px] font-normal text-muted-foreground">(repassado)</span>
                ) : (
                  <span className="text-[10px] font-normal text-destructive">(absorvido)</span>
                )}
              </span>
            }
          />
        )}
        <InfoRow label="Fotos Extras" value={agendamento.valorExtras > 0 ? `R$ ${agendamento.valorExtras.toFixed(2)}` : 'R$ 0,00'} />
        <div className="border-t pt-2 mt-2">
          <InfoRow label="Total Bruto" value={`R$ ${agendamento.valorTotal.toFixed(2)}`} emphasis />
        </div>

        {podeVerMetricasInternas && agendamento.valorComissao != null && agendamento.indicadorNome && (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mt-4 mb-1">Obrigações</p>
            <InfoRow
              label={`Comissão (${agendamento.indicadorNome})`}
              value={
                <span className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                  <span>R$ {agendamento.valorComissao.toFixed(2)}</span>
                  <Badge
                    variant={agendamento.statusComissao === 'PAGA' ? 'success' : 'warning'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {agendamento.statusComissao === 'PAGA' ? 'Pago' : agendamento.statusComissao === 'CANCELADA' ? 'Cancelado' : 'Pendente'}
                  </Badge>
                </span>
              }
            />
          </>
        )}

        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mt-4 mb-1">Resultado</p>
        <InfoRow
          label={`Entrada (${agendamento.percentualEntrada}%)`}
          value={
            <span className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              <span>R$ {agendamento.valorEntradaExigido.toFixed(2)}</span>
              {agendamento.valorEntradaPago > 0 && (
                <Badge variant="success" className="text-[10px] px-1.5 py-0">Pago</Badge>
              )}
            </span>
          }
        />
        <InfoRow label={`Restante (${100 - agendamento.percentualEntrada}%)`} value={`R$ ${agendamento.valorRestante.toFixed(2)}`} />
        <div className="border-t pt-2 mt-2">
          <InfoRow label="Total Final" value={`R$ ${agendamento.valorTotalFinal.toFixed(2)}`} emphasis />
          {podeVerMetricasInternas && (
            <InfoRow label="Líquido Estimado" value={`R$ ${(agendamento.valorTotalFinal - (agendamento.valorComissao ?? 0) - (agendamento.repassarDeslocamento ? 0 : (agendamento.custoDeslocamento ?? 0))).toFixed(2)}`} emphasis />
          )}
        </div>
      </InfoCard>

      {agendamento.observacoes && (
        <div className="min-w-0 rounded-lg border bg-card p-4 md:col-span-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0" />
            Observações
          </div>
          <p className="whitespace-pre-wrap break-words text-sm">{agendamento.observacoes}</p>
        </div>
      )}
    </div>
  )
}
