import { z } from 'zod'

export const despesaSchema = z.object({
  descricao: z.string().min(1, 'Informe a descrição'),
  valor: z.number().positive('Informe um valor maior que zero'),
  categoriaId: z.string().min(1, 'Selecione a categoria'),
  data: z.string().min(1, 'Informe a data'),
  formaPagamento: z.string().nullable().optional(),
  status: z.enum(['PAGO', 'PENDENTE', 'RECORRENTE']),
  recorrencia: z.enum(['UNICA', 'MENSAL', 'ANUAL']),
  agendamentoId: z.string().nullable().optional(),
  fotografoId: z.string().nullable().optional(),
  observacao: z.string().optional(),
})

export type DespesaFormValues = z.infer<typeof despesaSchema>
