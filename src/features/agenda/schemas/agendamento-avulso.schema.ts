import { z } from 'zod'
import { duracaoValida } from '@/shared/lib/duracao'

const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/

export const agendamentoAvulsoSchema = z
  .object({
    clienteNome: z.string().min(3, 'Informe o nome completo'),
    clienteTelefone: z.string().regex(telefoneRegex, 'Telefone inválido'),
    clienteEmail: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
    clienteCpf: z
      .string()
      .optional()
      .refine((value) => !value || value.replace(/\D/g, '').length === 11, 'CPF inválido'),
    clienteCidade: z.string().optional(),
    clienteEstado: z.string().max(2, 'UF inválida').optional(),
    pacoteId: z.string().min(1, 'Selecione o pacote'),
    fotografoId: z.string().min(1, 'Selecione o fotógrafo responsável'),
    data: z.date({ message: 'Selecione a data do ensaio' }),
    hora: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
    duracao: z
      .string()
      .min(1, 'Informe a duração do ensaio')
      .refine((value) => duracaoValida(value), 'Formato inválido. Use ex.: 2h, 2h30, 90min, 2 horas'),
    localEnsaio: z.string().min(3, 'Informe o local do ensaio'),
    valorTotal: z.number().min(0.01, 'Informe o valor total'),
    valorEntradaExigido: z.number().min(0.01, 'Informe a entrada exigida'),
    valorPago: z.number().min(0, 'Valor não pode ser negativo'),
    dataPagamento: z.string().min(1, 'Informe a data do recebimento'),
    formaPagamento: z.enum(['PIX', 'CARTAO', 'DINHEIRO', 'TRANSFERENCIA', 'OUTRO']).default('PIX'),
    tipoPagamento: z.enum(['ENTRADA', 'FINAL']).default('ENTRADA'),
    custoDeslocamento: z.number().min(0, 'Valor não pode ser negativo'),
    repassarDeslocamento: z.boolean(),
    autorizaUsoImagem: z.boolean(),
    observacoes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.valorEntradaExigido > values.valorTotal) {
      ctx.addIssue({
        code: 'custom',
        path: ['valorEntradaExigido'],
        message: 'A entrada não pode ser maior que o valor total',
      })
    }
    if (values.valorPago > values.valorTotal) {
      ctx.addIssue({
        code: 'custom',
        path: ['valorPago'],
        message: 'O valor pago não pode ser maior que o valor total',
      })
    }
  })

export type AgendamentoAvulsoFormValues = z.infer<typeof agendamentoAvulsoSchema>
