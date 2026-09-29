import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Shield, Zap, ChevronRight, Waves, Palmtree, Check } from 'lucide-react'
import { ecommerceService } from '../services/ecommerce.service'
import { BeachBackdrop } from '@/shared/components/beach/BeachBackdrop'
import { BEACH_CARD, BEACH_CTA } from '@/shared/components/beach/beach'
import { cn } from '@/shared/lib/cn'
import type { PacoteResponse } from '@/features/pacotes/types/pacotes.types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function PackageCatalogPage() {
  const [pacotes, setPacotes] = useState<PacoteResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    ecommerceService.listarPacotesCompletos()
      .then((data) => setPacotes(data.filter((p) => p.ativo)))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <BeachBackdrop />
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
          <div className="mx-auto mb-3 h-8 w-64 rounded-xl bg-white/70 animate-pulse" />
          <div className="mx-auto h-4 w-80 max-w-full rounded-xl bg-white/60 animate-pulse" />
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn('p-6', BEACH_CARD)}>
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted animate-pulse" />
                <div className="mx-auto mb-2 h-5 w-32 rounded-xl bg-muted animate-pulse" />
                <div className="mx-auto h-3 w-44 rounded-xl bg-muted/70 animate-pulse" />
                <div className="mx-auto mb-8 mt-6 h-8 w-40 rounded-xl bg-muted animate-pulse" />
                <div className="space-y-2.5">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-3.5 w-full rounded-xl bg-muted/70 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <BeachBackdrop />

      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            <Palmtree className="h-4 w-4" />
            Photoizer
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-cyan-950 md:text-5xl">
            Escolha seu Pacote
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            Selecione o pacote ideal para o seu ensaio. Todos incluem fotos editadas em alta resolução.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {pacotes.map((pacote) => {
            const isSelected = selectedId === pacote.id
            const beneficios = pacote.beneficios ? pacote.beneficios.split('\n').filter(Boolean) : []

            return (
              <div
                key={pacote.id}
                onClick={() => setSelectedId(pacote.id)}
                className={cn(
                  'relative cursor-pointer p-6 transition-all duration-200',
                  BEACH_CARD,
                  isSelected
                    ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-200/60'
                    : 'hover:-translate-y-0.5 hover:shadow-lg hover:ring-cyan-200',
                )}
              >
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 px-4 py-1 text-xs font-semibold text-white shadow">
                    <Check className="h-3 w-3" />
                    Selecionado
                  </div>
                )}

                <div className="mb-4 flex flex-col items-center text-center">
                  {pacote.imagemCapa && (
                    <div className="mb-3 h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-cyan-100">
                      <img src={pacote.imagemCapa} alt={pacote.nome} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-display text-xl font-bold text-cyan-950">{pacote.nome}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{pacote.descricao}</p>
                </div>

                <div className="mb-6 text-center">
                  <span className="font-display text-3xl font-bold text-cyan-900">
                    {formatCurrency(pacote.valorBase)}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">
                    {pacote.quantidadeFotos} fotos inclusas · {formatCurrency(pacote.precoFotoExtra)}/foto extra
                  </p>
                </div>

                <div className="mb-6 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">Incluso</p>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Camera className="h-4 w-4 text-cyan-500" />
                    <span>{pacote.quantidadeFotos} fotos editadas</span>
                  </div>
                  {pacote.quantidadeVideos > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Zap className="h-4 w-4 text-cyan-500" />
                      <span>{pacote.quantidadeVideos} vídeos</span>
                    </div>
                  )}
                  {pacote.duracaoEstimada && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Waves className="h-4 w-4 text-cyan-500" />
                      <span>Duração: {pacote.duracaoEstimada}</span>
                    </div>
                  )}
                  {beneficios.map((beneficio, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <Shield className="h-4 w-4 text-cyan-500" />
                      <span>{beneficio}</span>
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/checkout/pacote/${pacote.id}`) }}
                    className={cn(
                      'flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold',
                      BEACH_CTA,
                    )}
                  >
                    Continuar <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
