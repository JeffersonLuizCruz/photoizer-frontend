import { z } from 'zod'

export const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  telefone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone inválido. Use o formato: (11) 99999-9999'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido. Use o formato: 000.000.000-00').optional().or(z.literal('')),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Estado deve ter 2 letras').optional(),
  origem: z.enum(['INDICACAO', 'ANUNCIO', 'OUTROS'], { error: 'Origem é obrigatória' }),
  observacoes: z.string().optional(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>
