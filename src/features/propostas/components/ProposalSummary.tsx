import type { ReactNode, ComponentType } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarDays,
  MapPin,
  Package,
  Users,
  Wallet,
  QrCode,
  Palmtree,
  Clock,
} from 'lucide-react'
import { formatCurrency } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import type { PropostaPublica } from '../types'

interface ProposalSummaryProps {
  proposta: PropostaPublica
}

interface InfoCardProps {
  icon: ComponentType<{ className?: string }>
  label: string
  children: ReactNode
  className?: string
}

function InfoCard({ icon: Icon, label, children, className }: InfoCardProps) {
  return (
    <div className={cn('rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-cyan-100 backdrop-blur', className)}>
      <div className="flex items-center gap-2 text-cyan-600">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-sm font-medium text-slate-700">{children}</div>
    </div>
  )
}

export function ProposalSummary({ proposta }: ProposalSummaryProps) {
  const data = new Date(proposta.dataHoraEnsaio)
  const dataLabel = format(data, "EEEE, dd 'de' MMMM", { locale: ptBR })
  const horaLabel = format(data, 'HH:mm')
  const profissionais = (proposta.fotografos ?? []).map((f) => f.nome).filter(Boolean).join(', ')

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-500 to-teal-400 p-6 text-white shadow-lg shadow-cyan-200/60 sm:p-9">
        <div className="absolute -top-10 -right-6 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            <Palmtree className="h-4 w-4" />
            Proposta de Ensaio Fotográfico
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
            {proposta.contratadaNome || 'Estúdio de Fotografia'}
          </h1>
          <p className="mt-1 text-sm text-white/85">Termo de Prestação de Serviços Fotográficos</p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
              {dataLabel} às {horaLabel}
            </span>
            {proposta.localEnsaio && (
              <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">{proposta.localEnsaio}</span>
            )}
            {proposta.pacoteNome && (
              <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">{proposta.pacoteNome}</span>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard icon={CalendarDays} label="Data do ensaio">
          {dataLabel}
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" /> {horaLabel} · {proposta.duracaoMinutos} min
          </div>
        </InfoCard>

        <InfoCard icon={MapPin} label="Local">
          {proposta.localEnsaio || '—'}
          {proposta.enderecoCompleto && (
            <div className="mt-0.5 text-xs text-slate-500">{proposta.enderecoCompleto}</div>
          )}
        </InfoCard>

        <InfoCard icon={Package} label="Pacote">
          {proposta.pacoteNome || '—'}
          <div className="mt-0.5 text-xs text-slate-500">
            Foto extra: {formatCurrency(proposta.precoFotoExtra)}
          </div>
        </InfoCard>

        <InfoCard icon={Users} label="Profissionais">
          {profissionais || 'A definir'}
        </InfoCard>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white/95 shadow-sm ring-1 ring-cyan-100 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-cyan-100 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold text-cyan-950">Valores</h2>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Valor total do serviço</span>
            <span className="font-semibold text-slate-800">{formatCurrency(proposta.valorTotal)}</span>
          </div>

          {proposta.taxaDeslocamento > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Deslocamento</span>
              <span className="font-medium text-slate-700">{formatCurrency(proposta.taxaDeslocamento)}</span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-100 to-rose-100 px-4 py-3">
            <span className="text-sm font-semibold text-orange-900">
              Reserva ({proposta.percentualEntrada}%)
            </span>
            <span className="text-lg font-bold text-orange-900">
              {formatCurrency(proposta.valorEntradaExigido)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Restante a pagar no final do ensaio</span>
            <span className="font-semibold text-slate-800">{formatCurrency(proposta.valorRestante)}</span>
          </div>
        </div>

        <div className="flex items-start gap-3 border-t border-cyan-100 bg-cyan-50/60 px-5 py-4">
          <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
          <div className="text-sm">
            <p className="font-medium text-cyan-950">Pagamento via PIX</p>
            <p className="text-slate-600">
              {proposta.pixTipoChave || 'Chave'}: <span className="font-semibold">{proposta.pixChave || '(não informada)'}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
