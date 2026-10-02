import axios from 'axios'
import { env } from '@/shared/config/env'

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: env.VITE_API_TIMEOUT,
  // A3: envia/recebe cookies HttpOnly de autenticação.
  withCredentials: true,
})
