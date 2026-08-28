import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Agendamento } from '../types'

export function montarReciboPagamento(agendamento: Agendamento): string {
  const data = agendamento.dataHoraEnsaio
    ? format(new Date(agendamento.dataHoraEnsaio), "dd/MM/yyyy", { locale: ptBR })
    : '---'

  const dataPagamento = agendamento.dataFinalizacao ?? agendamento.updatedAt
    ? format(new Date(agendamento.dataFinalizacao ?? agendamento.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : '---'

  return [
    '🧾 *RECIBO DE PAGAMENTO*',
    '',
    `Cliente: ${agendamento.clienteNome}`,
    `Data do Ensaio: ${data}`,
    '',
    '💰 *Detalhes do Pagamento*',
    `Entrada (${agendamento.percentualEntrada}%): R$ ${agendamento.valorEntradaExigido.toFixed(2)}`,
    `Valor Restante (${100 - agendamento.percentualEntrada}%): R$ ${agendamento.valorRestante.toFixed(2)}`,
    agendamento.repassarDeslocamento
      ? `Taxa de Deslocamento: R$ ${agendamento.custoDeslocamento.toFixed(2)} (repassada)`
      : `Custo de Deslocamento: R$ ${agendamento.custoDeslocamento.toFixed(2)} (absorvido)`,
    agendamento.valorExtras > 0 ? `Fotos Extras: R$ ${agendamento.valorExtras.toFixed(2)}` : '',
    '',
    `*Total Pago: R$ ${agendamento.valorTotalFinal.toFixed(2)}*`,
    `Data do Pagamento: ${dataPagamento}`,
    '',
    '✅ Pagamento confirmado.',
    '',
    'Obrigado pela preferência! 📸',
  ]
    .filter(Boolean)
    .join('\n')
}
