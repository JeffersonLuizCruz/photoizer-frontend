import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, MapPin, User, DollarSign, Camera, Award, Pencil, FileText } from 'lucide-react'
import type { Agendamento } from '../types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { EditarClienteDialog } from './EditarClienteDialog'

interface AgendamentoResumoProps {
  agendamento: Agendamento
}

function InfoCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

export function AgendamentoResumo({ agendamento }: AgendamentoResumoProps) {
  const [editClienteOpen, setEditClienteOpen] = useState(false)

  const dataEnsaio = agendamento.dataHoraEnsaio
    ? format(new Date(agendamento.dataHoraEnsaio), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
    : '-'
  const horaEnsaio = agendamento.dataHoraEnsaio
    ? format(new Date(agendamento.dataHoraEnsaio), "HH:mm", { locale: ptBR })
    : '-'

  return (
    <div className="grid gap-4 md:grid-cols-3">
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
        <div className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{dataEnsaio}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{horaEnsaio}</span>
          {agendamento.duracaoMinutos > 0 && <span className="text-muted-foreground">({agendamento.duracaoMinutos}min)</span>}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{agendamento.localEnsaio}</span>
        </div>
        {agendamento.enderecoCompleto && (
          <p className="text-xs text-muted-foreground ml-5">{agendamento.enderecoCompleto}</p>
        )}
        <InfoRow label="Pacote" value={agendamento.pacoteNome} />
        <InfoRow label="Editor" value={agendamento.editorNome} />
        {agendamento.ensaioDestaque && (
          <div className="flex items-center gap-1 text-amber-600">
            <Award className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Ensaio em Destaque</span>
          </div>
        )}
        <InfoRow label="Uso de Imagem" value={agendamento.autorizaUsoImagem ? 'Autorizado' : 'Não autorizado'} />
      </InfoCard>

      <InfoCard icon={DollarSign} title="Resumo Financeiro">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Receita</p>
        <InfoRow label="Valor do Pacote" value={`R$ ${agendamento.valorPacote.toFixed(2)}`} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Custo Deslocamento:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-right font-medium">R$ {agendamento.custoDeslocamento.toFixed(2)}</span>
            {agendamento.repassarDeslocamento ? (
              <span className="text-[10px] text-muted-foreground">(repassado)</span>
            ) : (
              <span className="text-[10px] text-destructive">(absorvido)</span>
            )}
          </div>
        </div>
        <InfoRow label="Fotos Extras" value={agendamento.valorExtras > 0 ? `R$ ${agendamento.valorExtras.toFixed(2)}` : 'R$ 0,00'} />
        <div className="border-t pt-2 mt-2">
          <InfoRow label="Total Bruto" value={`R$ ${agendamento.valorTotalFinal.toFixed(2)}`} />
        </div>

        {agendamento.valorComissao != null && agendamento.indicadorNome && (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mt-4 mb-1">Obrigações</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Comissão ({agendamento.indicadorNome}):</span>
              <div className="flex items-center gap-1.5">
                <span className="text-right font-medium">R$ {agendamento.valorComissao.toFixed(2)}</span>
                <Badge
                  variant={agendamento.statusComissao === 'PAGA' ? 'success' : 'warning'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {agendamento.statusComissao === 'PAGA' ? 'Pago' : agendamento.statusComissao === 'CANCELADA' ? 'Cancelado' : 'Pendente'}
                </Badge>
              </div>
            </div>
          </>
        )}

        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mt-4 mb-1">Resultado</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Entrada ({agendamento.percentualEntrada}%):</span>
          <div className="flex items-center gap-1.5">
            <span className="text-right font-medium">R$ {agendamento.valorEntradaExigido.toFixed(2)}</span>
            {agendamento.valorEntradaPago > 0 && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">Pago</Badge>
            )}
          </div>
        </div>
        <InfoRow label={`Restante (${100 - agendamento.percentualEntrada}%)`} value={`R$ ${agendamento.valorRestante.toFixed(2)}`} />
        <div className="border-t pt-2 mt-2">
          <InfoRow label="Total Final" value={`R$ ${agendamento.valorTotalFinal.toFixed(2)}`} />
          {agendamento.valorComissao != null && (
            <InfoRow label="Líquido Estimado" value={`R$ ${(agendamento.valorTotalFinal - agendamento.valorComissao).toFixed(2)}`} />
          )}
        </div>
      </InfoCard>

      {agendamento.observacoes && (
        <div className="rounded-lg border bg-card p-4 md:col-span-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <FileText className="h-4 w-4" />
            Observações
          </div>
          <p className="text-sm whitespace-pre-wrap">{agendamento.observacoes}</p>
        </div>
      )}
    </div>
  )
}
