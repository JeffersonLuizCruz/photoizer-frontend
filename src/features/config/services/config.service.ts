import { apiClient } from '@/shared/api'

export interface ConfigValues {
  valorUnitarioFotoExtra: number
  valorUnitarioVideoExtra: number
  percentualComissao: number
  percentualEntrada: number
  taxaDeslocamentoPadrao: number
}

export const configService = {
  get: async (): Promise<ConfigValues> => {
    const { data } = await apiClient.get<ConfigValues>('/config')
    return data
  },

  update: async (valores: Record<string, string>): Promise<void> => {
    await apiClient.put('/config', valores)
  },

  getTemplate: async (): Promise<string> => {
    const { data } = await apiClient.get<{ template: string }>('/contrato/template')
    return data.template
  },

  updateTemplate: async (template: string): Promise<void> => {
    await apiClient.put('/contrato/template', { template })
  },

  restaurarTemplatePadrao: async (): Promise<string> => {
    const { data } = await apiClient.put<{ template: string }>('/contrato/template/padrao')
    return data.template
  },
}
