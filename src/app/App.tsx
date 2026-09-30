import { Toaster } from 'sonner'
import { QueryProvider, ThemeProvider } from '@/providers'
import { AuthProvider } from '@/features/auth'
import { AppRoutes } from '@/routes'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { OfflineBanner } from '@/shared/components/OfflineBanner'
import { TooltipProvider } from '@/shared/components/ui/tooltip'

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider>
              <AppRoutes />
            </TooltipProvider>
            <OfflineBanner />
            <Toaster richColors closeButton position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
