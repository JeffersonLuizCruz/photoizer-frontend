import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type Papel } from './AuthProvider'
import { Loader2 } from 'lucide-react'
import { ROUTES } from '@/shared/constants'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Papel[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, papel } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (allowedRoles && papel && !allowedRoles.includes(papel)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <>{children}</>
}
