import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:8080/api/v1'),
  VITE_API_TIMEOUT: z.coerce.number().positive().default(30000),
})

const envParsed = envSchema.safeParse(import.meta.env)

if (!envParsed.success) {
  console.warn('[env] Invalid environment variables, using defaults', envParsed.error.flatten().fieldErrors)
}

export const env = envParsed.success ? envParsed.data : envSchema.parse({})
