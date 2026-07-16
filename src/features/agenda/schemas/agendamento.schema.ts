import { z } from 'zod'

const telefoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/
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
})

export const stepEnsaioSchema = z.object({
  pacoteId: z.string().min(1, 'Selecione um pacote'),
  data: z.date({ message: 'Selecione uma data' }),
  hora: z.string().min(1, 'Selecione um horário'),
  localEnsaio: z.string().min(3, 'Informe o local do ensaio'),
  enderecoCompleto: z.string().optional().or(z.literal('')),
  editorId: z.string().optional().or(z.literal('')),
  taxaDeslocamento: z.number().min(0, 'Taxa não pode ser negativa').default(0),
  autorizaUsoImagem: z.boolean().default(false),
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
