import { apiClient } from './client'

function toApiPath(src: string): string {
  return src.startsWith('/api/v1') ? src.slice(7) : src
}

async function fetchProtectedBlob(src: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(toApiPath(src), { responseType: 'blob' })
  return data
}

/**
 * Baixa um recurso protegido (imagem/PDF) usando o token do usuário via axios,
 * disparando o download pelo navegador.
 */
export async function downloadProtected(src: string, filename?: string): Promise<void> {
  const blob = await fetchProtectedBlob(src)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'arquivo'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Abre um recurso protegido (ex.: comprovante) em nova aba, preservando o gesto
 * do usuário para não ser bloqueado como popup.
 */
export async function openProtected(src: string): Promise<void> {
  const win = window.open('', '_blank')
  if (!win) {
    throw new Error('Popup bloqueado pelo navegador')
  }
  try {
    const blob = await fetchProtectedBlob(src)
    const url = URL.createObjectURL(blob)
    win.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch {
    win.close()
  }
}
