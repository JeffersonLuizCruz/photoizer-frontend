import { useState, useEffect, useRef } from 'react'
import { Loader2, Copy, Check, Zap, Banknote, Send, CreditCard, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CalculoCarrinhoResponse, CompraExtraResponse, MetodoPagamento } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'

type PaymentMode = 'online' | 'manual'

interface CheckoutDialogProps {
  token: string
  open: boolean
  onClose: () => void
  onCheckout: (metodoPagamento: MetodoPagamento) => Promise<CompraExtraResponse>
  onPagarSimulado: (compra: CompraExtraResponse) => Promise<void>
  onEnviarComprovante: (compra: CompraExtraResponse, file: File) => Promise<void>
}

const CHAVE_PIX = 'photoizer@email.com'

export function CheckoutDialog({
  token, open, onClose, onCheckout, onPagarSimulado, onEnviarComprovante,
}: CheckoutDialogProps) {
  const [calculo, setCalculo] = useState<CalculoCarrinhoResponse | null>(null)
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null)
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
    const metodoPagamento: MetodoPagamento = paymentMode === 'online' ? 'PIX' : 'TRANSFERENCIA'
    setIsProcessing(true)
    setErrorMessage(null)
    try {
      const compraCriada = await onCheckout(metodoPagamento)
      setCompra(compraCriada)

      if (paymentMode === 'online') {
        await onPagarSimulado(compraCriada)
        setSuccessMessage('Pagamento confirmado! Suas fotos já estão disponíveis para download.')
      } else {
        setSuccessMessage('Compra criada! Envie o comprovante para liberar as fotos.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao processar pagamento'
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao enviar comprovante')
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !isProcessing && !isEnviando && onClose()}>
      <div className="bg-background rounded-xl border shadow-lg max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold">
          {successMessage && compra?.status === 'PAGA' ? 'Pagamento Confirmado' : 'Finalizar Compra'}
        </h2>

        {/* Cart summary (before success) */}
        {!successMessage && calculo && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">ITENS NO CARRINHO ({calculo.quantidade})</h3>
            <div className="max-h-32 overflow-y-auto space-y-1.5">
              {calculo.itens.map((item) => (
                <div key={item.fotoId} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 text-muted-foreground">{item.fileName}</span>
                  <span className="font-medium ml-2">R$ {item.valorUnitario.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-medium">
              <span>Total</span>
              <span>R$ {calculo.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Payment mode selection (before checkout) */}
        {!compra && !successMessage && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">COMO DESEJA PAGAR?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMode('online')}
                role="radio"
                aria-checked={paymentMode === 'online'}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all',
                  paymentMode === 'online'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                    : 'border-border hover:border-blue-300 hover:bg-accent/50'
                )}>
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                  paymentMode === 'online' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold">Pagamento Online</span>
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  Pagamento processado automaticamente. Suas fotos são liberadas na hora.
                </span>
              </button>
              <button
                onClick={() => setPaymentMode('manual')}
                role="radio"
                aria-checked={paymentMode === 'manual'}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all',
                  paymentMode === 'manual'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                    : 'border-border hover:border-blue-300 hover:bg-accent/50'
                )}>
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                  paymentMode === 'manual' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  <Banknote className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold">PIX ou Transferência</span>
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  Você faz o pagamento e envia o comprovante. O estúdio libera após confirmar.
                </span>
              </button>
            </div>

            {/* Confirmation button */}
            {paymentMode && (
              <button onClick={handleConfirmar} disabled={isProcessing}
                className={cn(
                  'w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2',
                  isProcessing
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                )}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : paymentMode === 'online' ? (
                  <Zap className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isProcessing
                  ? 'Processando...'
                  : paymentMode === 'online'
                    ? `Confirmar e Pagar${calculo ? ` (R$ ${calculo.total.toFixed(2)})` : ''}`
                    : `Finalizar${calculo ? ` (R$ ${calculo.total.toFixed(2)})` : ''}`}
              </button>
            )}

            {errorMessage && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-600 dark:text-rose-300">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Post-checkout: manual payment instructions + comprovante */}
        {compra && paymentMode === 'manual' && !successMessage?.includes('já estão disponíveis') && (
          <>
            <div className="rounded-xl bg-muted p-4 space-y-3 text-sm">
              <p className="font-semibold text-foreground">Instruções de pagamento</p>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">PIX (Chave aleatória)</p>
                <div className="flex items-center justify-between gap-2 bg-background rounded-lg px-3 py-2 border min-w-0">
                  <code className="text-xs font-mono truncate">{CHAVE_PIX}</code>
                  <button onClick={copiarChavePix}
                    className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium whitespace-nowrap text-xs">
                    {pixCopiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {pixCopiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-medium text-foreground">Transferência Bancária:</span></p>
                <p>Banco: Photoizer Bank (237)</p>
                <p>Agência: 0001 | Conta: 12345-6</p>
                <p className="font-medium text-foreground">Valor: R$ {compra.valorTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">ANEXAR COMPROVANTE</p>

              <input ref={inputFileRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)} />

              {!comprovante ? (
                <div
                  onClick={() => inputFileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all',
                    dragOver
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-muted-foreground/30 hover:border-blue-400 hover:bg-accent/50'
                  )}>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Clique para selecionar o comprovante</p>
                  <p className="text-xs text-muted-foreground">ou arraste o arquivo até aqui</p>
                  <p className="text-[10px] text-muted-foreground mt-1">JPEG, PNG ou PDF</p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{comprovante.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(comprovante.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button onClick={() => inputFileRef.current?.click()}
                    className="text-xs text-primary hover:text-primary/80 font-medium shrink-0 mr-2">
                    Trocar
                  </button>
                  <button onClick={() => selecionarArquivo(null)}
                    className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <button onClick={enviarComprovante} disabled={isEnviando || !comprovante}
                className="w-full rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {isEnviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isEnviando ? 'Enviando...' : 'Enviar comprovante e finalizar'}
              </button>
              <button onClick={onClose} disabled={isEnviando}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 py-1">
                Pagar depois
              </button>
            </div>
          </>
        )}

        {/* Success state (apenas pagamento online) */}
        {successMessage && compra?.status === 'PAGA' && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium">{successMessage}</p>
            <button onClick={onClose}
              className="rounded-xl bg-blue-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
              Voltar para galeria
            </button>
          </div>
        )}
      </div>
    </div>
  )
}