import { z } from 'zod'
import { duracaoValida } from '@/shared/lib/duracao'

export const agendamentoAvulsoSchema = z
  .object({
    pacoteId: z.string().min(1, 'Selecione o pacote'),
    fotografoId: z.string().min(1, 'Selecione o fotógrafo responsável'),
    data: z.date({ message: 'Selecione a data do ensaio' }),
    hora: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
    duracao: z
      .string()
      .min(1, 'Informe a duração do ensaio')
      .refine((value) => duracaoValida(value), 'Formato inválido. Use ex.: 2h, 2h30, 90min, 2 horas'),
    localEnsaio: z.string().min(3, 'Informe o local do ensaio'),
    modoEntrada: z.enum(['PERCENTUAL', 'RECEBIDO']).default('PERCENTUAL'),
    percentualEntrada: z
      .number({ message: 'Informe o percentual de entrada' })
      .min(0.01, 'O percentual deve ser maior que zero')
      .max(100, 'O percentual deve ser no máximo 100'),
    valorJaRecebido: z.number().min(0, 'Valor não pode ser negativo'),
    dataRecebimento: z.string().min(1, 'Informe a data do recebimento'),
    formaPagamento: z.enum(['PIX', 'CARTAO', 'DINHEIRO', 'TRANSFERENCIA', 'OUTRO']).default('PIX'),
    custoDeslocamento: z.number().min(0, 'Valor não pode ser negativo'),
    repassarDeslocamento: z.boolean(),
    observacoes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.modoEntrada === 'RECEBIDO' && values.valorJaRecebido <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['valorJaRecebido'],
        message: 'Informe o valor já recebido',
      })
    }
  })

export type AgendamentoAvulsoFormValues = z.infer<typeof agendamentoAvulsoSchema>
