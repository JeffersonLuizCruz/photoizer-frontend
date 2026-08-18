import { z } from 'zod'

export const criarContratoSchema = z.object({
  pacoteId: z.string().min(1, 'Selecione o pacote'),
  data: z.string().min(1, 'Informe a data do ensaio'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (HH:mm)'),
  localEnsaio: z.string().min(3, 'Informe o local do ensaio'),
  enderecoCompleto: z.string().optional(),
  editorId: z.string().optional(),
  fotografoId: z.string().optional(),
  valorRepassarFotografo: z.number().min(0).optional(),
  fotografos: z.array(
    z.object({
      fotografoId: z.string().min(1, 'Selecione o parceiro'),
      tipoValor: z.enum(['FIXO', 'PERCENTUAL']).default('FIXO'),
      valorRepassar: z.number().min(0).optional(),
      percentual: z.number().min(0).max(100).optional(),
    }),
  ),
  custoDeslocamento: z.number().min(0).optional(),
  repassarDeslocamento: z.boolean().optional(),
  clienteId: z.string().optional(),
  observacoes: z.string().optional(),
  indicadorId: z.string().optional(),
  indicadorNome: z.string().optional(),
  indicadorTelefone: z.string().optional(),
})

export type CriarContratoFormValues = z.input<typeof criarContratoSchema>

export const assinarContratoSchema = z.object({
  nome: z.string().min(3, 'Informe o nome completo'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
  cpf: z.string().min(11, 'CPF inválido'),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  autorizaUsoImagem: z.enum(['true', 'false']),
  assinatura: z.string().min(3, 'Digite seu nome para assinar'),
})

export type AssinarContratoFormValues = z.input<typeof assinarContratoSchema>

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2')
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
}