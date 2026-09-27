import { z } from 'zod'

const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/

export const fotografoRepasseSchema = z
  .object({
    fotografoId: z.string().min(1, 'Selecione um parceiro'),
    tipoValor: z.enum(['FIXO', 'PERCENTUAL']).default('FIXO'),
    valorRepassar: z.number().min(0, 'Valor não pode ser negativo').optional(),
    percentual: z.number().min(0, 'Percentual não pode ser negativo').max(100, 'Percentual máximo é 100').optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.fotografoId) return
    if (val.tipoValor === 'PERCENTUAL') {
      if (val.percentual === undefined || val.percentual <= 0) {
        ctx.addIssue({ code: 'custom', path: ['percentual'], message: 'Informe um percentual entre 1 e 100' })
      }
    }
    if (val.tipoValor === 'FIXO') {
      if (val.valorRepassar === undefined || val.valorRepassar <= 0) {
        ctx.addIssue({ code: 'custom', path: ['valorRepassar'], message: 'Informe um valor maior que zero' })
      }
    }
  })

export const editarAgendamentoSchema = z.object({
  pacoteId: z.string().min(1, 'Selecione um pacote'),
  dataHoraEnsaio: z.string().min(1, 'Selecione data e horário'),
  localEnsaio: z.string().min(3, 'Informe o local do ensaio'),
  enderecoCompleto: z.string().optional().or(z.literal('')),
  editorId: z.string().optional().or(z.literal('')),
  fotografoId: z.string().optional(),
  fotografos: z.array(fotografoRepasseSchema).optional().default([]),
  custoDeslocamento: z.number().min(0, 'Valor não pode ser negativo'),
  repassarDeslocamento: z.boolean(),
  autorizaUsoImagem: z.boolean(),
  observacoes: z.string().optional().or(z.literal('')),
})

export type EditarAgendamentoFormData = z.infer<typeof editarAgendamentoSchema>

export { telefoneRegex }
