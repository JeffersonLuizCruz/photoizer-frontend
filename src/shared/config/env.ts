import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().min(1).default('/api/v1'),
  VITE_API_TIMEOUT: z.coerce.number().positive().default(30000),
  // Uploads são enviados em lotes e podem levar minutos em links lentos.
  // Timeout próprio para não usar os 30s das demais chamadas.
  VITE_UPLOAD_TIMEOUT: z.coerce.number().positive().default(600000),
})

const envParsed = envSchema.safeParse(import.meta.env)

if (!envParsed.success) {
  console.warn('[env] Invalid environment variables, using defaults', envParsed.error.flatten().fieldErrors)
}

export const env = envParsed.success ? envParsed.data : envSchema.parse({})
