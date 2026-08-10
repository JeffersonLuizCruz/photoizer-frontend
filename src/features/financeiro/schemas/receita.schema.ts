import { z } from 'zod'

export const receitaSchema = z
  .object({
    agendamentoId: z.string().nullable().optional(),
    clienteId: z.string().nullable().optional(),
    tipoServico: z.enum(['ENSAIO', 'CASAMENTO', 'EVENTO', 'PRODUTO', 'OUTRO']),
    descricao: z.string().optional(),
    valorBruto: z.number().positive('Informe um valor maior que zero'),
    status: z.enum(['PAGO_TOTAL', 'PAGO_PARCIAL', 'PENDENTE', 'CANCELADO']),
    valorRecebido: z.number().min(0, 'Valor recebido não pode ser negativo'),
    dataPrevisaoRecebimento: z.string().nullable().optional(),
    dataRecebimentoReal: z.string().nullable().optional(),
    formaPagamento: z.string().nullable().optional(),
    observacoes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'PAGO_PARCIAL' && data.valorRecebido <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valorRecebido'],
        message: 'Para pagamento parcial informe o valor já recebido',
      })
    }
  })

export type ReceitaFormValues = z.infer<typeof receitaSchema>
