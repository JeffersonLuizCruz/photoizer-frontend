import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Camera, Image, Shield, Zap, ChevronRight, Loader2 } from 'lucide-react'
import { ecommerceService } from '../services/ecommerce.service'
import type { PacoteResponse } from '@/features/pacotes/types/pacotes.types'

const benefitIcons: Record<string, React.ReactNode> = {
  'Camera': <Camera className="h-4 w-4" />,
  'Image': <Image className="h-4 w-4" />,
  'Shield': <Shield className="h-4 w-4" />,
  'Zap': <Zap className="h-4 w-4" />,
}

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

  const selectedPacote = pacotes.find((p) => p.id === selectedId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Escolha seu Pacote</h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Selecione o pacote ideal para o seu ensaio. Todos incluem fotos editadas em alta resolução.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pacotes.map((pacote) => {
            const isSelected = selectedId === pacote.id
            const beneficios = pacote.beneficios ? pacote.beneficios.split('\n').filter(Boolean) : []

            return (
              <div
                key={pacote.id}
                onClick={() => setSelectedId(pacote.id)}
                className={`relative rounded-2xl border-2 bg-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border hover:border-primary/50'
                }`}>
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                    Selecionado
                  </div>
                )}

                <div className="flex flex-col items-center text-center mb-4">
                  {pacote.imagemCapa && (
                    <div className="w-20 h-20 rounded-full bg-muted overflow-hidden mb-3 border-2 border-border">
                      <img src={pacote.imagemCapa} alt={pacote.nome} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold">{pacote.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pacote.descricao}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-3xl font-bold">{formatCurrency(pacote.valorBase)}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pacote.quantidadeFotos} fotos inclusas · R$ {pacote.precoFotoExtra.toFixed(2)}/foto extra
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Incluso</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Camera className="h-4 w-4 text-primary" />
                    <span>{pacote.quantidadeFotos} fotos editadas</span>
                  </div>
                  {pacote.quantidadeVideos > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>{pacote.quantidadeVideos} vídeos</span>
                    </div>
                  )}
                  {pacote.duracaoEstimada && (
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>Duração: {pacote.duracaoEstimada}</span>
                    </div>
                  )}
                  {beneficios.map((beneficio, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>{beneficio}</span>
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/checkout/pacote/${pacote.id}`) }}
                    className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1">
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
