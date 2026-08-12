import { apiClient } from '@/shared/api'
import type { AssinarContratoFormValues } from '../schemas/contrato.schema'
import type { ContratoPublico, ContratoStatusPublico } from '../types'

export const contratoPublicoService = {
  carregar: async (token: string): Promise<ContratoPublico> => {
    const { data } = await apiClient.get<ContratoPublico>(`/contratos/publico/${token}`)
    return data
  },

  status: async (token: string): Promise<ContratoStatusPublico> => {
    const { data } = await apiClient.get<ContratoStatusPublico>(`/contratos/publico/${token}/status`)
    return data
  },

  async assinar(token: string, valores: AssinarContratoFormValues, comprovante?: File): Promise<ContratoStatusPublico> {
    const formData = new FormData()
    formData.append('nome', valores.nome)
    formData.append('telefone', valores.telefone)
    if (valores.email) formData.append('email', valores.email)
    formData.append('cpf', valores.cpf)
    if (valores.cidade) formData.append('cidade', valores.cidade)
    if (valores.estado) formData.append('estado', valores.estado)
    formData.append('autorizaUsoImagem', valores.autorizaUsoImagem)
    formData.append('assinatura', valores.assinatura)
    if (!comprovante) throw new Error('Comprovante de pagamento da reserva é obrigatório')
    formData.append('comprovante', comprovante)

    const { data } = await apiClient.post<ContratoStatusPublico>(`/contratos/publico/${token}/assinar`, formData)
    return data
  },
}