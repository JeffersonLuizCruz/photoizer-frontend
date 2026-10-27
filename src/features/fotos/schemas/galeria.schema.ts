import { z } from 'zod'

export const heroTituloSchema = z.object({
  tituloHero: z
    .string()
    .max(120, 'O texto do hero deve ter no máximo 120 caracteres'),
})

export type HeroTituloFormValues = z.infer<typeof heroTituloSchema>
