import { useState } from 'react'
import { ChevronDown, ScrollText } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface ContractDocumentProps {
  html: string
}

const contractClasses = [
  'font-sans',
  '[&_h1]:mb-6 [&_h1]:text-center [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-cyan-950 sm:[&_h1]:text-3xl',
  '[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-l-4 [&_h2]:border-cyan-400 [&_h2]:pl-3 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-cyan-900',
  '[&_p]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-600',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6',
  '[&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-slate-600 [&_li]:marker:text-cyan-500',
].join(' ')

export function ContractDocument({ html }: ContractDocumentProps) {
  const [aberto, setAberto] = useState(false)

  if (!html) return null

  return (
    <section className="overflow-hidden rounded-3xl bg-white/95 shadow-sm ring-1 ring-cyan-100 backdrop-blur">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-cyan-50/60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
          <ScrollText className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className="block font-display text-lg font-semibold text-cyan-950">Contrato completo</span>
          <span className="block text-xs text-slate-500">
            {aberto ? 'Toque para recolher' : 'Toque para ler todos os termos do contrato'}
          </span>
        </span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-cyan-600 transition-transform', aberto && 'rotate-180')} />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn('border-t border-cyan-100 px-5 py-6 sm:px-8', contractClasses)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </section>
  )
}
