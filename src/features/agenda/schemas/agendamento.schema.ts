import { z } from 'zod'

const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

export const stepClienteSchema = z.object({
  clienteId: z.string().optional(),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  telefone: z.string().regex(telefoneRegex, 'Telefone inválido. Use: (11) 99999-9999'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpf: z.string().regex(cpfRegex, 'CPF inválido. Use: 000.000.000-00').optional().or(z.literal('')),
  cidade: z.string().optional().or(z.literal('')),
  estado: z.string().optional().or(z.literal('')),
  origem: z.enum(['INDICACAO', 'ANUNCIO', 'OUTROS']).optional(),
  observacoes: z.string().optional().or(z.literal('')),
})

export const fotografoRepasseSchema = z
  .object({
    fotografoId: z.string().min(1, 'Selecione um parceiro'),
    tipoValor: z.enum(['FIXO', 'PERCENTUAL']).default('FIXO'),
    valorRepassar: z.number().min(0, 'Valor não pode ser negativo').optional(),
    percentual: z.number().min(0, 'Percentual não pode ser negativo').max(100, 'Percentual máximo é 100').optional(),
  })
  .superRefine((val, ctx) => {
    if (val.tipoValor === 'PERCENTUAL') {
      if (val.percentual === undefined || val.percentual <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['percentual'],
          message: 'Informe um percentual entre 1 e 100',
        })
      }
    }
  })

export const stepEnsaioSchema = z.object({
  pacoteId: z.string().min(1, 'Selecione um pacote'),
  data: z.date({ message: 'Selecione uma data' }),
  hora: z.string().min(1, 'Selecione um horário'),
  localEnsaio: z.string().min(3, 'Informe o local do ensaio'),
  enderecoCompleto: z.string().optional().or(z.literal('')),
  editorId: z.string().optional().or(z.literal('')),
  fotografos: z.array(fotografoRepasseSchema).optional().default([]),
  custoDeslocamento: z.number().min(0, 'Valor não pode ser negativo').default(0),
  repassarDeslocamento: z.boolean().default(true),
  autorizaUsoImagem: z.boolean().default(false),
})

export const stepIndicacaoSchema = z.object({
  indicadorId: z.string().optional().or(z.literal('')),
  indicadorNome: z.string().optional().or(z.literal('')),
  indicadorTelefone: z.string().optional().or(z.literal('')),
})

export const stepFinanceiroSchema = z.object({
  comprovanteEntrada: z
    .instanceof(File, { message: 'Anexe o comprovante de entrada' })
    .refine((f) => f.size > 0, 'Comprovante é obrigatório'),
  observacoes: z.string().optional().or(z.literal('')),
})

export const stepConfirmacaoSchema = z.object({
  confirmado: z.literal(true, {
    message: 'Você precisa confirmar que as informações estão corretas',
  }),
})

export const wizardFormSchema = z.object({
  ...stepClienteSchema.shape,
  ...stepEnsaioSchema.shape,
  ...stepIndicacaoSchema.shape,
  observacoes: z.string().optional().or(z.literal('')),
})

export const agendamentoWizardSchema = z.object({
  ...stepClienteSchema.shape,
  ...stepEnsaioSchema.shape,
  ...stepFinanceiroSchema.shape,
  ...stepConfirmacaoSchema.shape,
})

export type StepClienteData = z.infer<typeof stepClienteSchema>
export type StepEnsaioData = z.infer<typeof stepEnsaioSchema>
export type StepFinanceiroData = z.infer<typeof stepFinanceiroSchema>
export type StepConfirmacaoData = z.infer<typeof stepConfirmacaoSchema>
export type WizardFormValues = z.infer<typeof wizardFormSchema>
export type AgendamentoWizardData = z.infer<typeof agendamentoWizardSchema>

export const agendamentoSchema = z.object({
  clienteNome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  clienteTelefone: z
    .string()
    .regex(telefoneRegex, 'Telefone inválido. Use o formato: (11) 99999-9999'),
  clienteEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  pacoteId: z.string().min(1, 'Selecione um pacote'),
  data: z.date({ message: 'Selecione uma data' }),
  hora: z.string().min(1, 'Selecione um horário'),
  observacoes: z.string().optional(),
})

export type AgendamentoFormData = z.infer<typeof agendamentoSchema>

export const editarAgendamentoSchema = z.object({
  pacoteId: z.string().min(1, 'Selecione um pacote'),
  dataHoraEnsaio: z.string().min(1, 'Selecione data e horário'),
  localEnsaio: z.string().min(3, 'Informe o local do ensaio'),
  enderecoCompleto: z.string().optional().or(z.literal('')),
  editorId: z.string().optional().or(z.literal('')),
  fotografos: z.array(fotografoRepasseSchema).optional().default([]),
  custoDeslocamento: z.number().min(0, 'Valor não pode ser negativo'),
  repassarDeslocamento: z.boolean(),
  autorizaUsoImagem: z.boolean(),
  observacoes: z.string().optional().or(z.literal('')),
})

export type EditarAgendamentoFormData = z.infer<typeof editarAgendamentoSchema>

export const STEP_1_FIELDS: (keyof AgendamentoFormData)[] = [
  'clienteNome',
  'clienteTelefone',
  'clienteEmail',
]

export const STEP_2_FIELDS: (keyof AgendamentoFormData)[] = [
  'pacoteId',
  'data',
  'hora',
  'observacoes',
]
