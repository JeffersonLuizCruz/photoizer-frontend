import { toast } from 'sonner'
import { apiClient } from './client'
import { authService } from '@/features/auth/services/auth.service'
import { useCustomerAuth } from '@/features/auth/customer'

apiClient.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  }

  const adminToken = authService.getToken()
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
    return config
  }

  const customerUser = useCustomerAuth.getState().user
  if (customerUser?.token) {
    config.headers.Authorization = `Bearer ${customerUser.token}`
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
