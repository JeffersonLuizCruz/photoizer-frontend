import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/shared/hooks/use-online-status'

export function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-destructive px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-sm font-medium text-destructive-foreground shadow"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Você está offline. Alguns dados podem não carregar.</span>
    </div>
  )
}
