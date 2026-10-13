import { Toaster } from 'sonner'
import { QueryProvider, ThemeProvider } from '@/providers'
import { AuthProvider } from '@/features/auth'
import { AppRoutes } from '@/routes'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { OfflineBanner } from '@/shared/components/OfflineBanner'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { useThemeStore } from '@/stores'

export function App() {
  const theme = useThemeStore((state) => state.theme)

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider>
              <AppRoutes />
            </TooltipProvider>
            <OfflineBanner />
            <Toaster
              richColors
              closeButton
              position="top-right"
              theme={theme}
              offset="calc(env(safe-area-inset-top) + 1rem)"
              mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)', right: '0.75rem' }}
            />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
