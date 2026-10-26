import { apiClient } from '@/shared/api'

export interface ConfigValues {
  valorUnitarioFotoExtra: number
  valorUnitarioVideoExtra: number
  percentualComissao: number
  percentualEntrada: number
  taxaDeslocamentoPadrao: number
  nomeFotografo?: string
  nomeContratada?: string
  cnpjContratada?: string
  enderecoContratada?: string
  pixChave?: string
  pixTipoChave?: string
  logoContratada?: string
}

export const configService = {
  get: async (): Promise<ConfigValues> => {
    const { data } = await apiClient.get<ConfigValues>('/config')
    return data
  },

  update: async (valores: Record<string, string>): Promise<void> => {
    await apiClient.put('/config', valores)
  },

  uploadLogo: async (arquivo: File): Promise<string> => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const { data } = await apiClient.post<{ logoContratada: string }>('/config/logo', formData)
    return data.logoContratada
  },

  removerLogo: async (): Promise<void> => {
    await apiClient.delete('/config/logo')
  },

  getTemplate: async (): Promise<string> => {
    const { data } = await apiClient.get<{ template: string }>('/proposta/template')
    return data.template
  },

  updateTemplate: async (template: string): Promise<void> => {
    await apiClient.put('/proposta/template', { template })
  },

  restaurarTemplatePadrao: async (): Promise<string> => {
    const { data } = await apiClient.put<{ template: string }>('/proposta/template/padrao')
    return data.template
  },
}
