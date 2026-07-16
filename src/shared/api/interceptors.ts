import { toast } from 'sonner'
import { apiClient } from './client'

apiClient.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
