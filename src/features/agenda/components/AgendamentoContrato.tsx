import { useState } from 'react'
import { Copy, Check, FileText, ExternalLink, FileDown, Link2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { openProtected } from '@/shared/api/protectedResource'
import { ROUTES } from '@/shared/constants'
import type { Agendamento } from '../types'

interface AgendamentoContratoProps {
  agendamento: Agendamento
  onUpdateClausulas?: (clausulas: string) => void
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2)}`
}

function montarResumoWhatsApp(agendamento: Agendamento): string {
  const data = agendamento.dataHoraEnsaio
    ? format(new Date(agendamento.dataHoraEnsaio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Não definida'

  const statusLabels: Record<string, string> = {
    PRE_RESERVA: '📝 Pré-reserva',
    AGUARDANDO_APROVACAO: '✍️ Aguardando aprovação',
    PAGAMENTO_CONFIRMADO: '💰 Pagamento confirmado',
    CONFIRMADO: '📌 Confirmado',
    REALIZADO: '✅ Realizado',
    AGUARDANDO_PAGAMENTO_FINAL: '💰 Aguardando Pagamento Final',
    EM_EDICAO: '🎨 Em Edição',
    FINALIZADO: '✨ Finalizado',
    CANCELADO: '❌ Cancelado',
    NO_SHOW: '🚫 Não Compareceu',
  }

  return [
    '📸 *RESUMO DO AGENDAMENTO*',
    '',
    `Cliente: ${agendamento.clienteNome ?? 'Pré-reserva'}`,
    `Data: ${data}`,
    `Local: ${agendamento.localEnsaio}`,
    `Pacote: ${agendamento.pacoteNome} - ${formatCurrency(agendamento.valorPacote)}`,
    '',
    '💰 *Financeiro*',
    `Entrada (${agendamento.percentualEntrada}%): ${formatCurrency(agendamento.valorEntradaExigido)} ${agendamento.valorEntradaPago > 0 ? '✅ Pago' : '⏳ Pendente'}`,
    `Restante (${100 - agendamento.percentualEntrada}%): ${formatCurrency(agendamento.valorRestante)}`,
    `Taxa de Deslocamento: ${formatCurrency(agendamento.taxaDeslocamento)}`,
    agendamento.valorExtras > 0 ? `Fotos Extras: ${formatCurrency(agendamento.valorExtras)}` : '',
    `*Total: ${formatCurrency(agendamento.valorTotalFinal)}*`,
    '',
    `📋 *Status:* ${statusLabels[agendamento.status] ?? agendamento.status}`,
    '',
    agendamento.autorizaUsoImagem ? '✅ Autorização de uso de imagem: ✓' : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function AgendamentoContrato({ agendamento, onUpdateClausulas }: AgendamentoContratoProps) {
  const [copied, setCopied] = useState(false)
  const [clausulas, setClausulas] = useState(agendamento.clausulasPersonalizadas ?? '')

  const linkProposta = agendamento.tokenProposta
    ? `${window.location.origin}${ROUTES.PROPOSTA_PUBLICA.replace(':token', agendamento.tokenProposta)}`
    : null

  const handleCopy = async () => {
    const texto = montarResumoWhatsApp(agendamento)
    await navigator.clipboard.writeText(texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopiarLink = () => {
    if (!linkProposta) return
    navigator.clipboard.writeText(linkProposta)
    toast.success('Link da proposta copiado')
  }

  const handleClausulasChange = (value: string) => {
    setClausulas(value)
    onUpdateClausulas?.(value)
  }

  const handleAbrirTermo = async () => {
    try {
      await openProtected(`/agendamentos/${agendamento.id}/termo`)
    } catch {
      toast.error('Erro ao abrir o termo assinado')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Resumo para WhatsApp</h3>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <><Check className="mr-1 h-4 w-4 text-emerald-500" />Copiado!</>
            ) : (
              <><Copy className="mr-1 h-4 w-4" />Copiar</>
            )}
          </Button>
        </div>

        <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed">
          {montarResumoWhatsApp(agendamento)}
        </pre>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Link da Proposta</h3>
        </div>

        {linkProposta ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input value={linkProposta} readOnly className="min-w-0 flex-1 basis-full text-xs sm:basis-auto" />
            <Button variant="outline" size="sm" onClick={handleCopiarLink}>
              <Copy className="mr-1 h-4 w-4" />
              Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(linkProposta, '_blank', 'noopener')}>
              <ExternalLink className="mr-1 h-4 w-4" />
              Abrir
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum link de proposta ativo. Crie uma proposta para gerar o link de assinatura.
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Termo assinado</h3>
          {agendamento.dataAssinatura && <Badge variant="success">Assinado</Badge>}
        </div>

        {agendamento.dataAssinatura ? (
          <div className="space-y-3">
            <p className="text-sm">
              Contrato assinado em{' '}
              <strong>{format(new Date(agendamento.dataAssinatura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</strong>.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleAbrirTermo}>
                <FileDown className="mr-1 h-4 w-4" />
                Abrir PDF do termo
              </Button>
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            O cliente ainda não assinou esta proposta.
          </p>
        )}

        {agendamento.autorizaUsoImagem && (
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-sm">
              <span className="font-medium">Autorização de Uso de Imagem:</span>{' '}
              O cliente autoriza o uso de imagens para fins comerciais e divulgação.
            </p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Cláusulas Personalizadas</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Adicione cláusulas personalizadas à proposta..."
            value={clausulas}
            onChange={(e) => handleClausulasChange(e.target.value)}
            rows={4}
          />
        </div>

        {(agendamento.temComprovanteEntrada || agendamento.temComprovanteFinal) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {agendamento.temComprovanteEntrada && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => openProtected(`/documentos/comprovantes/${agendamento.id}/entrada`).catch(() => toast.error('Erro ao abrir comprovante'))}
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                Comprovante de Entrada
              </Button>
            )}
            {agendamento.temComprovanteFinal && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => openProtected(`/documentos/comprovantes/${agendamento.id}/final`).catch(() => toast.error('Erro ao abrir comprovante'))}
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                Comprovante Final
              </Button>
            )}
          </div>
        )}

        {agendamento.motivoRecusa && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm">
              <span className="font-medium text-destructive">Proposta recusada:</span>{' '}
              {agendamento.motivoRecusa}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {agendamento.recusadoPor ? `Por ${agendamento.recusadoPor}` : null}
              {agendamento.dataRecusa
                ? `${agendamento.recusadoPor ? ' em ' : 'Em '}${format(new Date(agendamento.dataRecusa), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
