import { toast } from 'sonner'
import { apiClient } from './client'
import { authService } from '@/features/auth/services/auth.service'
import { useCustomerAuth } from '@/features/auth/customer'

const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'

function readCookie(name: string): string | null {
  const alvo = `${name}=`
  const encontrado = document.cookie
    .split('; ')
    .find((linha) => linha.startsWith(alvo))
  return encontrado ? decodeURIComponent(encontrado.slice(alvo.length)) : null
}

apiClient.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  }

  // A3: autenticação via cookie HttpOnly. Enviamos apenas o token CSRF
  // (double-submit) para métodos que mudam estado, pois o navegador não o
  // adiciona automaticamente em cross-origin.
  const metodo = (config.method || 'get').toLowerCase()
  if (!['get', 'head', 'options'].includes(metodo)) {
    const csrf = readCookie(CSRF_COOKIE)
    if (csrf) {
      config.headers[CSRF_HEADER] = csrf
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      if (requestUrl.includes('/ecommerce/galeria/') || requestUrl.includes('/auth/login')) {
        return Promise.reject(error)
      }
      const customerUser = useCustomerAuth.getState().user
      if (customerUser) {
        useCustomerAuth.getState().logout()
        window.dispatchEvent(new CustomEvent('auth:redirect', { detail: '/acesso-cliente' }))
      } else {
        authService.logout()
        window.dispatchEvent(new CustomEvent('auth:redirect', { detail: '/login' }))
      }
      return Promise.reject(error)
    }

    if (!error.response) {
      if (error.code === 'ERR_CANCELED') {
        return Promise.reject(error)
      }
      toast.error('Não foi possível conectar ao servidor. Verifique sua conexão.')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)
