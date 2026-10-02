import { useState, useEffect, useRef } from 'react'
import { Loader2, Copy, Check, Banknote, Send, CreditCard, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CalculoCarrinhoResponse, CompraExtraResponse, MetodoPagamento } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { BEACH_CTA } from '@/shared/components/beach/beach'
import { extractErrorMessage } from '@/shared/api'

interface CheckoutDialogProps {
  token: string
  open: boolean
  onClose: () => void
  onCheckout: (metodoPagamento: MetodoPagamento) => Promise<CompraExtraResponse>
  onEnviarComprovante: (compra: CompraExtraResponse, file: File) => Promise<void>
}

const CHAVE_PIX = 'photoizer@email.com'

export function CheckoutDialog({
  token, open, onClose, onCheckout, onEnviarComprovante,
}: CheckoutDialogProps) {
  const [calculo, setCalculo] = useState<CalculoCarrinhoResponse | null>(null)
  const [paymentMode, setPaymentMode] = useState<MetodoPagamento | null>(null)
  const [compra, setCompra] = useState<CompraExtraResponse | null>(null)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEnviando, setIsEnviando] = useState(false)
  const [pixCopiado, setPixCopiado] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !token) return
    setCompra(null)
    setComprovante(null)
    setPaymentMode(null)
    setSuccessMessage(null)
    setErrorMessage(null)
    ecommerceService.calcular(token)
      .then(setCalculo)
      .catch(() => toast.error('Erro ao calcular carrinho'))
  }, [open, token])

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CHAVE_PIX)
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 2000)
    toast.success('Chave PIX copiada!')
  }

  const handleConfirmar = async () => {
    if (!paymentMode || !calculo) return
    setIsProcessing(true)
    setErrorMessage(null)
    try {
      const compraCriada = await onCheckout(paymentMode)
      setCompra(compraCriada)
      setSuccessMessage('Compra criada! Envie o comprovante para liberar as fotos.')
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Erro ao processar pagamento')
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const enviarComprovante = async () => {
    if (!compra || !comprovante) return
    setIsEnviando(true)
    try {
      await onEnviarComprovante(compra, comprovante)
      toast.success('Comprovante enviado! O estúdio irá liberar as fotos em breve.')
      onClose()
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao enviar comprovante'))
    } finally {
      setIsEnviando(false)
    }
  }

  const selecionarArquivo = (file: File | null) => {
    setComprovante(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      selecionarArquivo(file)
    } else {
      toast.error('Formato não aceito. Use JPEG, PNG ou PDF.')
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && !isProcessing && !isEnviando) onClose()
      }}
    >
      <SheetContent className="h-dvh max-h-none w-full max-w-lg gap-5 overflow-y-auto rounded-none bg-white p-6 sm:h-full">
        <SheetTitle className="font-display text-lg font-semibold text-cyan-950">
          {successMessage && compra?.status === 'PAGA' ? 'Pagamento Confirmado' : 'Finalizar Compra'}
        </SheetTitle>

        {/* Cart summary (before success) */}
        {!successMessage && calculo && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-cyan-600">ITENS NO CARRINHO ({calculo.quantidade})</h3>
            <div className="max-h-32 space-y-1.5 overflow-y-auto">
              {calculo.itens.map((item) => (
                <div key={item.fotoId} className="flex items-center justify-between text-sm">
                  <span className="flex-1 truncate text-slate-500">{item.fileName}</span>
                  <span className="ml-2 font-medium text-slate-800">R$ {item.valorUnitario.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-cyan-100 pt-2 text-sm font-medium text-cyan-950">
              <span>Total</span>
              <span>R$ {calculo.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Payment method selection (before checkout) — PIX/Transferência manual */}
        {!compra && !successMessage && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-cyan-600">COMO DESEJA PAGAR?</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => setPaymentMode('PIX')}
                role="radio"
                aria-checked={paymentMode === 'PIX'}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                  paymentMode === 'PIX'
                    ? 'border-cyan-400 bg-cyan-50 shadow-sm'
                    : 'border-cyan-100 hover:border-cyan-200 hover:bg-cyan-50/50',
                )}>
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  paymentMode === 'PIX' ? 'bg-gradient-to-br from-cyan-500 to-teal-400 text-white' : 'bg-cyan-50 text-cyan-500',
                )}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-800">PIX</span>
                <span className="text-[11px] leading-relaxed text-slate-500">
                  Pague via PIX e envie o comprovante. O estúdio libera após confirmar.
                </span>
              </button>
              <button
                onClick={() => setPaymentMode('TRANSFERENCIA')}
                role="radio"
                aria-checked={paymentMode === 'TRANSFERENCIA'}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                  paymentMode === 'TRANSFERENCIA'
                    ? 'border-cyan-400 bg-cyan-50 shadow-sm'
                    : 'border-cyan-100 hover:border-cyan-200 hover:bg-cyan-50/50',
                )}>
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  paymentMode === 'TRANSFERENCIA' ? 'bg-gradient-to-br from-cyan-500 to-teal-400 text-white' : 'bg-cyan-50 text-cyan-500',
                )}>
                  <Banknote className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-800">Transferência</span>
                <span className="text-[11px] leading-relaxed text-slate-500">
                  Transfira e envie o comprovante. O estúdio libera após confirmar.
                </span>
              </button>
            </div>

            {/* Confirmation button */}
            {paymentMode && (
              <button onClick={handleConfirmar} disabled={isProcessing}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                  isProcessing ? 'cursor-not-allowed bg-muted text-muted-foreground' : BEACH_CTA,
                )}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isProcessing
                  ? 'Processando...'
                  : `Finalizar${calculo ? ` (R$ ${calculo.total.toFixed(2)})` : ''}`}
              </button>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Post-checkout: manual payment instructions + comprovante */}
        {compra && paymentMode && !successMessage?.includes('já estão disponíveis') && (
          <>
            <div className="space-y-3 rounded-2xl bg-cyan-50/60 p-4 text-sm ring-1 ring-cyan-100">
              <p className="font-semibold text-cyan-950">Instruções de pagamento</p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">PIX (Chave aleatória)</p>
                <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-cyan-100 bg-white px-3 py-2">
                  <code className="truncate text-xs font-mono text-slate-700">{CHAVE_PIX}</code>
                  <button onClick={copiarChavePix}
                    className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-cyan-700 hover:text-cyan-800">
                    {pixCopiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {pixCopiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">Transferência Bancária:</span></p>
                <p>Banco: Photoizer Bank (237)</p>
                <p>Agência: 0001 | Conta: 12345-6</p>
                <p className="font-medium text-slate-700">Valor: R$ {compra.valorTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-cyan-600">ANEXAR COMPROVANTE</p>

              <input ref={inputFileRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)} />

              {!comprovante ? (
                <div
                  onClick={() => inputFileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition-all',
                    dragOver ? 'border-cyan-400 bg-cyan-50' : 'border-cyan-200 hover:border-cyan-300 hover:bg-cyan-50/50',
                  )}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Clique para selecionar o comprovante</p>
                  <p className="text-xs text-slate-500">ou arraste o arquivo até aqui</p>
                  <p className="mt-1 text-[10px] text-slate-400">JPEG, PNG ou PDF</p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-cyan-50/50 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100">
                      <Upload className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">{comprovante.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {(comprovante.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button onClick={() => inputFileRef.current?.click()}
                    className="mr-2 shrink-0 text-xs font-medium text-cyan-700 hover:text-cyan-800">
                    Trocar
                  </button>
                  <button onClick={() => selecionarArquivo(null)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <button onClick={enviarComprovante} disabled={isEnviando || !comprovante}
                className={cn('flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50', BEACH_CTA)}>
                {isEnviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isEnviando ? 'Enviando...' : 'Enviar comprovante e finalizar'}
              </button>
              <button onClick={onClose} disabled={isEnviando}
                className="w-full py-1 text-center text-xs text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50">
                Pagar depois
              </button>
            </div>
          </>
        )}

      </SheetContent>
    </Sheet>
  )
}
