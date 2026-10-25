/**
 * Copia texto para a área de transferência.
 *
 * A Clipboard API só existe em contextos seguros (HTTPS ou localhost). Em
 * acesso por IP/HTTP ou com permissão negada, usamos o fallback legado com
 * textarea + execCommand para não falhar silenciosamente.
 */
function copiarComFallback(texto: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = texto
  textarea.setAttribute('readonly', '')
  textarea.setAttribute('aria-hidden', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'

  document.body.appendChild(textarea)

  try {
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export async function copyToClipboard(texto: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto)
      return
    } catch {
      // Cai no fallback abaixo.
    }
  }

  if (!copiarComFallback(texto)) {
    throw new Error('Não foi possível copiar para a área de transferência')
  }
}
