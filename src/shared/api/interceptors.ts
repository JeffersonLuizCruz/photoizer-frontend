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
      const customerUser = useCustomerAuth.getState().user
      if (customerUser) {
        useCustomerAuth.getState().logout()
        window.location.href = '/acesso-cliente'
      } else {
        authService.logout()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (!error.response) {
      toast.error('Erro de conexão com o servidor')
      return Promise.reject(error)
    }

    const { status, data } = error.response

    switch (status) {
      case 400: {
        toast.error(data?.message || 'Requisição inválida')
        break
      }
      case 422: {
        toast.error(data?.message || 'Erro de validação')
        break
      }
      case 409: {
        toast.error(data?.message || 'Conflito de agenda')
        break
      }
      case 500: {
        toast.error(data?.message || 'Erro interno do servidor')
        break
      }
    }

    return Promise.reject(error)
  },
)
