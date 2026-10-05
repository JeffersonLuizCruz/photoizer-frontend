import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { ContactActions } from './contact-actions'

interface DetailHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  avatarUrl?: string | null
  initials?: string
  status?: ReactNode
  contato?: {
    telefone?: string | null
    email?: string | null
    whatsappMessage?: string
  }
  actions?: ReactNode
  backTo?: string
  className?: string
}

export function DetailHeader({
  title,
  subtitle,
  avatarUrl,
  initials,
  status,
  contato,
  actions,
  backTo,
  className,
}: DetailHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start gap-3">
        {backTo !== undefined && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label="Voltar"
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <Avatar className="h-12 w-12 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="bg-primary text-sm text-primary-foreground">
            {initials ?? '?'}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
            {status}
          </div>
          {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>

      {contato && (
        <ContactActions
          telefone={contato.telefone}
          email={contato.email}
          nome={typeof title === 'string' ? title : undefined}
          whatsappMessage={contato.whatsappMessage}
        />
      )}
    </div>
  )
}
