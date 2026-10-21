import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageTitleProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function PageTitle({ title, description, breadcrumbs, actions, className }: PageTitleProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
          <Link to="/" aria-label="Início" className="shrink-0 hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex min-w-0 max-w-full items-center gap-1">
              <ChevronRight className="h-4 w-4 shrink-0" />
              {item.href ? (
                <Link to={item.href} className="max-w-[12rem] truncate hover:text-foreground transition-colors sm:max-w-none">
                  {item.label}
                </Link>
              ) : (
                <span className="max-w-[12rem] truncate text-foreground font-medium sm:max-w-none">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 break-words text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
