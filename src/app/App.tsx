import { Toaster } from 'sonner'
import { QueryProvider, ThemeProvider } from '@/providers'
import { AppRoutes } from '@/routes'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <AppRoutes />
          <Toaster richColors closeButton position="top-right" />
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
