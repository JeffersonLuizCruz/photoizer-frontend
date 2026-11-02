import { env } from '@/shared/config/env'

/**
 * Monta a URL absoluta de um recurso público da API a partir da origem atual.
 *
 * Em produção o nginx do frontend faz proxy de `/api` para o backend (único
 * domínio público); em dev o proxy do Vite faz o mesmo. Quando `VITE_API_URL`
 * for absoluta, ela é usada como está.
 */
function apiOrigin(): string {
  const base = env.VITE_API_URL.replace(/\/+$/, '')
  return base.startsWith('http') ? base : `${window.location.origin}${base}`
}

/** Link público do termo assinado da proposta, compartilhável com o cliente. */
export function termoPublicoUrl(token: string): string {
  return `${apiOrigin()}/propostas/publico/${encodeURIComponent(token)}/termo`
}

/** Indica que o link aponta para um host local e não abre em outro celular. */
export function linkLocal(): boolean {
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}
