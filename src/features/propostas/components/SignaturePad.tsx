import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface SignaturePadProps {
  onChange: (blob: Blob | null) => void
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [temTraco, setTemTraco] = useState(false)

  const prepararCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }, [])

  useEffect(() => {
    prepararCanvas()
  }, [prepararCanvas])

  const posicao = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const iniciar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    drawing.current = true
    const { x, y } = posicao(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const desenhar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = posicao(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!temTraco) setTemTraco(true)
  }

  const finalizar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    e.preventDefault()
    drawing.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => onChange(blob), 'image/png')
  }

  const limpar = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTemTraco(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-md border border-input bg-white"
        onPointerDown={iniciar}
        onPointerMove={desenhar}
        onPointerUp={finalizar}
        onPointerLeave={finalizar}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Assine com o dedo ou o mouse</p>
        <Button type="button" variant="ghost" size="sm" onClick={limpar} disabled={!temTraco}>
          <Eraser className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      </div>
    </div>
  )
}
