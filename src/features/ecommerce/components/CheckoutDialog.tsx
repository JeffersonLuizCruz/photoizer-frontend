import { useState, useEffect, useRef } from 'react'
import { Loader2, Copy, Check, Banknote, Send, CreditCard, Upload, X, QrCode, RefreshCw, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { CalculoCarrinhoResponse, CompraExtraResponse, MetodoPagamento, ConfiguracaoPagamentoResponse } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { extractErrorMessage } from '@/shared/api'

const GALLERY_CTA = 'bg-gallery-ink text-gallery-bg hover:opacity-90'

interface CheckoutDialogProps {
  token: string
  open: boolean
  onClose: () => void
  onCheckout: (metodoPagamento: MetodoPagamento) => Promise<CompraExtraResponse>
  onEnviarComprovante: (compra: CompraExtraResponse, file: File) => Promise<void>
}


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
  const [pagamento, setPagamento] = useState<ConfiguracaoPagamentoResponse | null>(null)
  const [pagamentoCarregado, setPagamentoCarregado] = useState(false)
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
    setPagamento(null)
    setPagamentoCarregado(false)
    ecommerceService.calcular(token)
      .then(setCalculo)
      .catch(() => toast.error('Erro ao calcular carrinho'))
    ecommerceService.obterPagamento()
      .then(setPagamento)
      .catch(() => {})
      .finally(() => setPagamentoCarregado(true))
  }, [open, token])

  useEffect(() => {
    if (!open || !compra || paymentMode !== 'CARTAO' || compra.linkPagamentoCartao) return
    let cancelado = false
    const buscarLink = () => {
      ecommerceService.detalheCompra(token, compra.id)
        .then((detalhe) => {
          if (!cancelado && detalhe.linkPagamentoCartao) {
            setCompra((prev) => prev ? { ...prev, linkPagamentoCartao: detalhe.linkPagamentoCartao } : prev)
          }
        })
        .catch(() => {})
    }
    buscarLink()
    const interval = setInterval(buscarLink, 15000)
    return () => {
      cancelado = true
      clearInterval(interval)
    }
  }, [open, token, compra?.id, compra?.linkPagamentoCartao, paymentMode])

  const copiarChavePix = () => {
    if (!pagamento?.pixChave) return
    navigator.clipboard.writeText(pagamento.pixChave)
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
      if (paymentMode !== 'CARTAO') {
        // O staff pode ajustar a chave PIX enquanto a compra é criada.
        void ecommerceService.obterPagamento().then(setPagamento).catch(() => {})
      }
      setSuccessMessage(paymentMode === 'CARTAO'
        ? 'Compra criada! Aguarde o link de pagamento do estúdio.'
        : 'Compra criada! Envie o comprovante para liberar as fotos.')
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

  const atualizarLinkCartao = async () => {
    if (!compra) return
    try {
      const detalhe = await ecommerceService.detalheCompra(token, compra.id)
      setCompra((prev) => prev ? { ...prev, linkPagamentoCartao: detalhe.linkPagamentoCartao } : prev)
      if (!detalhe.linkPagamentoCartao) {
        toast.info('O estúdio ainda não gerou o link de pagamento.')
      }
    } catch {
      toast.error('Erro ao atualizar o link de pagamento')
    }
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

  const pixIndisponivel = pagamentoCarregado && !pagamento?.pixChave?.trim()

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && !isProcessing && !isEnviando) onClose()
      }}
    >
      <SheetContent className="h-dvh max-h-none w-full max-w-lg gap-5 overflow-y-auto rounded-none bg-gallery-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:h-full sm:p-6">
        <SheetTitle className="font-display text-lg font-semibold text-gallery-ink">
          {successMessage && compra?.status === 'PAGA' ? 'Pagamento Confirmado' : 'Finalizar Compra'}
        </SheetTitle>

        {/* Cart summary (before success) */}
        {!successMessage && calculo && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gallery-accent">ITENS NO CARRINHO ({calculo.quantidade})</h3>
            <div className="max-h-32 space-y-1.5 overflow-y-auto">
              {calculo.itens.map((item) => (
                <div key={item.fotoId} className="flex items-center justify-between text-sm">
                  <span className="flex-1 truncate text-gallery-muted">{item.fileName}</span>
                  <span className="ml-2 font-medium text-gallery-ink">R$ {item.valorUnitario.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-gallery-line pt-2 text-sm font-medium text-gallery-ink">
              <span>Total</span>
              <span>R$ {calculo.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Payment method selection (before checkout) */}
        {!compra && !successMessage && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-gallery-accent">COMO DESEJA PAGAR?</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                onClick={() => !pixIndisponivel && setPaymentMode('PIX')}
                role="radio"
                aria-checked={paymentMode === 'PIX'}
                aria-disabled={pixIndisponivel}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                  paymentMode === 'PIX'
                    ? 'border-gallery-accent bg-gallery-bg shadow-sm'
                    : 'border-gallery-line hover:border-gallery-line hover:bg-gallery-bg',
                  pixIndisponivel && 'cursor-not-allowed opacity-50 hover:border-gallery-line hover:bg-transparent',
                )}>
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  paymentMode === 'PIX' ? 'bg-gradient-to-br from-gallery-accent to-gallery-accent text-white' : 'bg-gallery-bg text-gallery-accent',
                )}>
                  <QrCode className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-gallery-ink">PIX</span>
                <span className="text-[11px] leading-relaxed text-gallery-muted">
                  {pixIndisponivel
                    ? 'PIX ainda não configurado pelo estúdio.'
                    : 'Pague via PIX e envie o comprovante. O estúdio libera após confirmar.'}
                </span>
              </button>
              <button
                onClick={() => setPaymentMode('CARTAO')}
                role="radio"
                aria-checked={paymentMode === 'CARTAO'}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                  paymentMode === 'CARTAO'
                    ? 'border-gallery-accent bg-gallery-bg shadow-sm'
                    : 'border-gallery-line hover:border-gallery-line hover:bg-gallery-bg',
                )}>
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  paymentMode === 'CARTAO' ? 'bg-gradient-to-br from-gallery-accent to-gallery-accent text-white' : 'bg-gallery-bg text-gallery-accent',
                )}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-gallery-ink">Cartão</span>
                <span className="text-[11px] leading-relaxed text-gallery-muted">
                  O estúdio envia um link de pagamento após criar a compra.
                </span>
              </button>
              <button
                onClick={() => setPaymentMode('TRANSFERENCIA')}
                role="radio"
                aria-checked={paymentMode === 'TRANSFERENCIA'}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                  paymentMode === 'TRANSFERENCIA'
                    ? 'border-gallery-accent bg-gallery-bg shadow-sm'
                    : 'border-gallery-line hover:border-gallery-line hover:bg-gallery-bg',
                )}>
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  paymentMode === 'TRANSFERENCIA' ? 'bg-gradient-to-br from-gallery-accent to-gallery-accent text-white' : 'bg-gallery-bg text-gallery-accent',
                )}>
                  <Banknote className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-gallery-ink">Transferência</span>
                <span className="text-[11px] leading-relaxed text-gallery-muted">
                  Transfira e envie o comprovante. O estúdio libera após confirmar.
                </span>
              </button>
            </div>

            {/* Confirmation button */}
            {paymentMode && (
              <button onClick={handleConfirmar} disabled={isProcessing}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                  isProcessing ? 'cursor-not-allowed bg-gallery-line text-gallery-muted' : GALLERY_CTA,
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
              <div className="rounded-2xl border border-gallery-line bg-gallery-bg p-3 text-xs text-gallery-accent">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Post-checkout: instruções de pagamento */}
        {compra && paymentMode && !successMessage?.includes('já estão disponíveis') && (
          <>
            {paymentMode === 'CARTAO' ? (
              <div className="space-y-3 rounded-2xl bg-gallery-bg p-4 text-sm ring-1 ring-gallery-line">
                <p className="font-semibold text-gallery-ink">Pagamento com cartão de crédito</p>
                {compra.linkPagamentoCartao ? (
                  <>
                    <p className="text-xs text-gallery-muted">
                      Link de pagamento disponível. Após pagar, o estúdio confirmará e liberará as fotos.
                    </p>
                    <a href={compra.linkPagamentoCartao} target="_blank" rel="noopener noreferrer"
                      className={cn('flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold', GALLERY_CTA)}>
                      <ExternalLink className="h-4 w-4" />
                      Pagar com cartão de crédito
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gallery-muted">
                      Aguardando o estúdio gerar o link de pagamento. O link aparece aqui automaticamente quando estiver pronto.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gallery-accent">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Atualizando automaticamente...
                    </div>
                    <button onClick={atualizarLinkCartao}
                      className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-gallery-line px-4 py-2.5 text-sm font-medium text-gallery-accent transition-colors hover:bg-gallery-bg">
                      <RefreshCw className="h-4 w-4" />
                      Verificar agora
                    </button>
                  </>
                )}
                <p className="text-xs text-gallery-muted">
                  Valor: <span className="font-medium text-gallery-ink">R$ {compra.valorTotal.toFixed(2)}</span>
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 rounded-2xl bg-gallery-bg p-4 text-sm ring-1 ring-gallery-line">
                  <p className="font-semibold text-gallery-ink">Instruções de pagamento</p>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gallery-muted">
                      PIX{pagamento?.pixTipoChave ? ` (${pagamento.pixTipoChave})` : ''}
                    </p>
                    {pagamento?.pixChave ? (
                      <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-gallery-line bg-gallery-surface px-3 py-2">
                        <code className="truncate text-xs font-mono text-gallery-ink">{pagamento.pixChave}</code>
                        <button onClick={copiarChavePix}
                          className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-gallery-accent hover:opacity-80">
                          {pixCopiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {pixCopiado ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-gallery-line bg-gallery-bg px-3 py-2 text-xs text-gallery-accent">
                        PIX ainda não configurado pelo estúdio.
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-gallery-muted">
                    <p><span className="font-medium text-gallery-ink">Transferência Bancária:</span></p>
                    <p>Banco: Photoizer Bank (237)</p>
                    <p>Agência: 0001 | Conta: 12345-6</p>
                    <p className="font-medium text-gallery-ink">Valor: R$ {compra.valorTotal.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gallery-accent">ANEXAR COMPROVANTE</p>

                  <input ref={inputFileRef} type="file" accept="image/*,.pdf" capture="environment" className="hidden"
                    onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)} />

                  {!comprovante ? (
                    <div
                      onClick={() => inputFileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition-all',
                        dragOver ? 'border-gallery-accent bg-gallery-bg' : 'border-gallery-line hover:border-gallery-accent hover:bg-gallery-bg',
                      )}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gallery-line text-gallery-accent">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-gallery-ink">Clique para selecionar o comprovante</p>
                      <p className="text-xs text-gallery-muted">ou arraste o arquivo até aqui</p>
                      <p className="mt-1 text-[10px] text-gallery-muted">JPEG, PNG ou PDF</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-gallery-line bg-gallery-bg px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gallery-line">
                          <Upload className="h-4 w-4 text-gallery-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gallery-ink">{comprovante.name}</p>
                          <p className="text-[11px] text-gallery-muted">
                            {(comprovante.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button onClick={() => inputFileRef.current?.click()}
                        className="mr-2 shrink-0 text-xs font-medium text-gallery-accent hover:opacity-80">
                        Trocar
                      </button>
                      <button onClick={() => selecionarArquivo(null)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <button onClick={enviarComprovante} disabled={isEnviando || !comprovante}
                    className={cn('flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50', GALLERY_CTA)}>
                    {isEnviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isEnviando ? 'Enviando...' : 'Enviar comprovante e finalizar'}
                  </button>
                </div>
              </>
            )}

            <button onClick={onClose} disabled={isEnviando}
              className="w-full py-1 text-center text-xs text-gallery-muted transition-colors hover:text-gallery-ink disabled:opacity-50">
              Pagar depois
            </button>
          </>
        )}

      </SheetContent>
    </Sheet>
  )
}
