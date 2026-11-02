import { apiClient } from './client'

interface MensagemLinkGaleriaResponse {
  mensagem: string
}

const PLACEHOLDER_LINK = '{{link}}'

/**
 * Monta a mensagem pronta para envio do link da galeria ao cliente.
 *
 * O texto base vem do backend (com Instagram/Facebook configurados nas
 * properties); aqui apenas substituímos o placeholder pelo link público.
 */
export async function obterMensagemLinkGaleria(link: string): Promise<string> {
  const { data } = await apiClient.get<MensagemLinkGaleriaResponse>('/admin/galerias/mensagem-link')
  return data.mensagem.replace(PLACEHOLDER_LINK, () => link)
}
