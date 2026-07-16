import { z } from 'zod'

export const pacoteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  quantidadeFotos: z.coerce.number().int().min(0, 'Quantidade não pode ser negativa'),
  quantidadeVideos: z.coerce.number().int().min(0, 'Quantidade não pode ser negativa'),
  valorBase: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  bloqueiaDiaInteiro: z.boolean().default(false),
  duracaoEstimada: z.string().min(1, 'Informe a duração estimada'),
  ativo: z.boolean().default(true),
})

export type PacoteFormData = z.infer<typeof pacoteSchema>
