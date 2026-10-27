import { Archive } from 'lucide-react'

/**
 * Tela exibida quando o link público aponta para uma galeria arquivada
 * (arquivos expurgados). Evita a galeria vazia/quebrada.
 */
export function GaleriaArquivada() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gallery-bg px-4">
      <div className="max-w-sm text-center">
        <Archive className="mx-auto h-10 w-10 text-gallery-accent" />
        <h1 className="mt-4 text-balance font-display text-2xl text-gallery-ink">
          Esta galeria foi arquivada
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gallery-muted">
          As fotos foram entregues e os arquivos removidos do servidor para liberar espaço. Se
          precisar de uma nova cópia, entre em contato com o estúdio.
        </p>
      </div>
    </div>
  )
}
