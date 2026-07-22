import { apiClient } from '@/shared/api'

export interface ConfigValues {
  valorUnitarioFotoExtra: number
  valorUnitarioVideoExtra: number
  percentualComissao: number
}

export const configService = {
  get: async (): Promise<ConfigValues> => {
    const { data } = await apiClient.get<ConfigValues>('/config')
    return data
  },

  update: async (valores: Record<string, string>): Promise<void> => {
    await apiClient.put('/config', valores)
  },
}
