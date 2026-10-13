import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'photoizer_pwa_install_dismissed'

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    const ua = window.navigator.userAgent
    // iPadOS em modo desktop se reporta como Macintosh; usamos maxTouchPoints para detectá-lo.
    const isIPadOS = /macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1
    const ios = (/iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua)) || isIPadOS
    if (ios) {
      setIsIOS(true)
      setShow(true)
    }

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setShow(true)
    }
    const onInstalled = () => setShow(false)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }

  return (
    <div
      role="region"
      aria-label="Instalar o Photoizer"
      className="fixed inset-x-0 bottom-[calc(var(--nav-h)+0.75rem+env(safe-area-inset-bottom))] z-40 mx-3 rounded-2xl border bg-card p-4 shadow-lg lg:bottom-6 lg:mx-auto lg:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {isIOS ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instalar o Photoizer</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isIOS
              ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início" para usar como app.'
              : 'Adicione o app à tela inicial para acesso rápido e em tela cheia.'}
          </p>
          {!isIOS && (
            <Button size="sm" className="mt-2 w-full" onClick={install}>
              <Download className="mr-1 h-4 w-4" />
              Instalar
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar aviso de instalação"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
