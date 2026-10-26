import { Heart, Check, ShoppingBag } from 'lucide-react'
import type { FaseGaleria, ModoGaleria } from '../../types/ecommerce.types'
import { humanizarNome } from '@/shared/lib/foto'

interface GaleriaIntroProps {
  modo: ModoGaleria
  fase: FaseGaleria
  pacoteNome: string
  pacoteLimit: number
  selectedCount: number
  favoritosCount: number
  carrinhoCount: number
}

function conteudo(modo: ModoGaleria, fase: FaseGaleria, pacoteLimit: number) {
  if (modo === 'DIRETO') {
    return {
      titulo: 'Sua galeria está pronta',
      descricao: 'Escolha suas fotos favoritas para o pacote ou adquira extras para levar ainda mais lembranças.',
    }
  }
  switch (fase) {
    case 'SELECAO':
      return {
        titulo: 'Escolha suas favoritas',
        descricao: `Selecione ${pacoteLimit || 'suas'} fotos para o seu pacote. Use o coração para guardar as que ama e o check para escolher.`,
      }
    case 'SELECAO_ENVIADA':
      return {
        titulo: 'Seleção recebida',
        descricao: 'Recebemos suas escolhas. Agora o estúdio vai cuidar de cada detalhe da edição.',
      }
    case 'EM_EDICAO':
      return {
        titulo: 'Suas fotos estão sendo preparadas',
        descricao: 'Estamos editando suas favoritas com todo o cuidado. Em breve elas estarão prontas aqui.',
      }
    case 'COMERCIALIZACAO':
      return {
        titulo: 'Prontas para você',
        descricao: 'Suas fotos editadas estão aqui. Baixe o pacote e escolha os extras que quiser guardar.',
      }
    default:
      return {
        titulo: 'Sua galeria está pronta',
        descricao: 'Escolha suas fotos favoritas para o pacote ou adquira extras.',
      }
  }
}

export function GaleriaIntro({
  modo,
  fase,
  pacoteNome,
  pacoteLimit,
  selectedCount,
  favoritosCount,
  carrinhoCount,
}: GaleriaIntroProps) {
  const { titulo, descricao } = conteudo(modo, fase, pacoteLimit)
  const percentual = pacoteLimit > 0 ? Math.min(100, Math.round((selectedCount / pacoteLimit) * 100)) : 0
  const mostrarProgresso = modo === 'COM_EDICAO' && fase === 'SELECAO'

  return (
    <section id="galeria-conteudo" className="scroll-mt-20 px-4 pt-10 text-center sm:pt-14">
      <p className="text-[10px] uppercase tracking-[0.42em] text-gallery-muted">
        {humanizarNome(pacoteNome) || 'Sua galeria'}
      </p>
      <h2 className="mt-3 text-balance font-display text-2xl text-gallery-ink sm:text-4xl">
        {titulo}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gallery-muted">
        {descricao}
      </p>

      {mostrarProgresso && (
        <div className="mx-auto mt-7 max-w-xs">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-gallery-muted">
            <span>{selectedCount} de {pacoteLimit} escolhidas</span>
            <span>{percentual}%</span>
          </div>
          <div className="mt-2 h-px w-full overflow-hidden bg-gallery-line">
            <div
              className="h-px bg-gallery-accent transition-all duration-500"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-gallery-muted">
        <span className="inline-flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-gallery-accent" fill={favoritosCount > 0 ? 'currentColor' : 'none'} />
          {favoritosCount} favorita(s)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-gallery-accent" />
          {selectedCount} no pacote
        </span>
        {carrinhoCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-gallery-accent" />
            {carrinhoCount} extra(s)
          </span>
        )}
      </div>

      <p className="mx-auto mt-4 max-w-md text-[10px] leading-relaxed text-gallery-muted/80">
        Prévia protegida com marca d'água. A foto final em alta resolução é liberada após a compra ou entrega do pacote.
      </p>
    </section>
  )
}
