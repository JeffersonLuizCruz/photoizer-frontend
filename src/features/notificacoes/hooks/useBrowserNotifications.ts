import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationPreferences } from '@/stores/notification-preferences.store'
import { useNotificacoes } from '../api/queries'

const STORAGE_PREFIX = 'photoizer:entrega-pendente:ultima-notificacao'
const MAX_NOTIFICACOES_POR_CICLO = 3

function chaveStorage(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

/**
 * Ponte entre as notificações persistidas no backend e a API de notificações
 * nativas do navegador. Só considera lembretes de entrega pendente e evita
 * repetir notificações já exibidas (último createdAt visto por usuário).
 */
export function useBrowserNotifications(userId?: string) {
  const navigate = useNavigate()
  const { data } = useNotificacoes()
  const enabled = useNotificationPreferences((state) => state.browserNotificationsEnabled)
  const onlyWhenHidden = useNotificationPreferences((state) => state.notifyOnlyWhenHidden)
  const [isVisible, setIsVisible] = useState(() => document.visibilityState === 'visible')

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (!userId || !enabled) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (window.Notification.permission !== 'granted') return
    if (onlyWhenHidden && isVisible) return

    const pendentes = (data?.data ?? [])
      .filter((notificacao) => !notificacao.lida && notificacao.tipo === 'ENTREGA_PENDENTE')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (pendentes.length === 0) return

    const storageKey = chaveStorage(userId)
    const ultimaVista = localStorage.getItem(storageKey)
    const maisRecente = pendentes[0].createdAt

    // Primeira execução: registra o marco sem disparar notificações antigas.
    if (!ultimaVista) {
      localStorage.setItem(storageKey, maisRecente)
      return
    }

    const limite = new Date(ultimaVista).getTime()
    const novas = pendentes
      .filter((notificacao) => new Date(notificacao.createdAt).getTime() > limite)
      .slice(0, MAX_NOTIFICACOES_POR_CICLO)

    if (novas.length === 0) return

    for (const notificacao of novas) {
      try {
        const notification = new window.Notification(notificacao.titulo, {
          body: notificacao.mensagem,
          tag: `entrega-pendente-${notificacao.id}`,
          icon: '/pwa-192x192.png',
        })
        notification.onclick = () => {
          window.focus()
          if (notificacao.link) navigate(notificacao.link)
          notification.close()
        }
      } catch {
        // Navegadores móveis podem não permitir o construtor Notification.
      }
    }

    localStorage.setItem(storageKey, maisRecente)
  }, [data, enabled, isVisible, navigate, onlyWhenHidden, userId])
}
