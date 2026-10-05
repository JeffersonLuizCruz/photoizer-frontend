import { Mail, MessageCircle, Phone } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { mailtoUrl, telUrl, whatsappUrl } from '@/shared/lib/contact'

interface ContactActionsProps {
  telefone?: string | null
  email?: string | null
  nome?: string
  whatsappMessage?: string
  className?: string
}

export function ContactActions({ telefone, email, nome, whatsappMessage, className }: ContactActionsProps) {
  const tel = telUrl(telefone)
  const mail = mailtoUrl(email, nome ? `Contato - ${nome}` : undefined)
  const zap = whatsappUrl(telefone, whatsappMessage)

  if (!tel && !mail && !zap) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {tel && (
        <a
          href={tel}
          aria-label={`Ligar para ${nome ?? 'contato'}`}
          className="flex h-11 w-11 items-center justify-center rounded-full border bg-background text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
        </a>
      )}
      {mail && (
        <a
          href={mail}
          aria-label={`Enviar e-mail para ${nome ?? 'contato'}`}
          className="flex h-11 w-11 items-center justify-center rounded-full border bg-background text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Mail className="h-5 w-5" aria-hidden="true" />
        </a>
      )}
      {zap && (
        <a
          href={zap}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir WhatsApp de ${nome ?? 'contato'}`}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}
