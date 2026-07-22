import { Toaster } from 'sonner'
import { QueryProvider, ThemeProvider } from '@/providers'
import { AuthProvider } from '@/features/auth'
import { AppRoutes } from '@/routes'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster richColors closeButton position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
