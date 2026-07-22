import { useState } from 'react'
import { Copy, Check, FileText, ExternalLink, FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { env } from '@/shared/config/env'
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
    CONFIRMADO: '📌 Confirmado',
    REALIZADO: '✅ Realizado',
    AGUARDANDO_PAGAMENTO_FINAL: '💰 Aguardando Pagamento Final',
    EM_EDICAO: '🎨 Em Edição',
    FOTOS_ENVIADAS_PARA_SELECAO: '📤 Fotos Enviadas para Seleção',
    FOTOS_ENTREGUES: '📸 Fotos Entregues',
    FINALIZADO: '✨ Finalizado',
    CANCELADO: '❌ Cancelado',
    NO_SHOW: '🚫 Não Compareceu',
  }

  return [
    '📸 *RESUMO DO AGENDAMENTO*',
    '',
    `Cliente: ${agendamento.clienteNome}`,
    `Data: ${data}`,
    `Local: ${agendamento.localEnsaio}`,
    `Pacote: ${agendamento.pacoteNome} - ${formatCurrency(agendamento.valorPacote)}`,
    '',
    '💰 *Financeiro*',
    `Entrada (30%): ${formatCurrency(agendamento.valorEntradaExigido)} ${agendamento.valorEntradaPago > 0 ? '✅ Pago' : '⏳ Pendente'}`,
    `Restante (70%): ${formatCurrency(agendamento.valorRestante)}`,
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

  const handleCopy = async () => {
    const texto = montarResumoWhatsApp(agendamento)
    await navigator.clipboard.writeText(texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClausulasChange = (value: string) => {
    setClausulas(value)
    onUpdateClausulas?.(value)
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
              <>
                <Check className="mr-1 h-4 w-4 text-emerald-500" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-1 h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
        </div>

        <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed">
          {montarResumoWhatsApp(agendamento)}
        </pre>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Contrato</h3>
          {agendamento.contratoGerado && (
            <Badge variant="success">Gerado</Badge>
          )}
        </div>

        {agendamento.autorizaUsoImagem && (
          <div className="mb-4 rounded-md bg-muted p-3">
            <p className="text-sm">
              <span className="font-medium">Autorização de Uso de Imagem:</span>{' '}
              O cliente autoriza o uso de imagens para fins comerciais e divulgação.
            </p>
          </div>
        )}

        <div className="mb-4">
          <a
            href={`${env.VITE_API_URL}/documentos/contratos/${agendamento.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" type="button">
              <FileDown className="mr-1 h-4 w-4" />
              Abrir PDF
            </Button>
          </a>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Cláusulas Personalizadas
          </label>
          <Textarea
            placeholder="Adicione cláusulas personalizadas ao contrato..."
            value={clausulas}
            onChange={(e) => handleClausulasChange(e.target.value)}
            rows={4}
          />
        </div>

        {(agendamento.urlComprovanteEntrada || agendamento.urlComprovanteFinal) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {agendamento.urlComprovanteEntrada && (
              <a
                href={agendamento.urlComprovanteEntrada}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" type="button">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Comprovante de Entrada
                </Button>
              </a>
            )}
            {agendamento.urlComprovanteFinal && (
              <a
                href={agendamento.urlComprovanteFinal}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" type="button">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Comprovante Final
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
