import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Loader2, QrCode, Send, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CalculoCarrinhoResponse, ConfiguracaoPagamentoResponse } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { extractErrorMessage } from '@/shared/api'

const GALLERY_CTA = 'bg-gallery-ink text-gallery-bg hover:opacity-90'

interface CheckoutDialogProps {
  token: string
  open: boolean
  onClose: () => void
  /** Cria a compra e envia o comprovante na mesma requisição. */
  onConfirmar: (comprovante: File) => Promise<void>
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function CheckoutDialog({ token, open, onClose, onConfirmar }: CheckoutDialogProps) {
  const [calculo, setCalculo] = useState<CalculoCarrinhoResponse | null>(null)
  const [pagamento, setPagamento] = useState<ConfiguracaoPagamentoResponse | null>(null)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pixCopiado, setPixCopiado] = useState(false)
  const [pagamentoCarregado, setPagamentoCarregado] = useState(false)
  const [isCalculando, setIsCalculando] = useState(false)
  const [erroCalculo, setErroCalculo] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)

  const carregarDados = useCallback(async () => {
    if (!token) return
    setIsCalculando(true)
    setErroCalculo(null)
    try {
      setCalculo(await ecommerceService.calcular(token))
    } catch {
      setErroCalculo('Não foi possível calcular o carrinho. Tente novamente.')
    } finally {
      setIsCalculando(false)
    }
    try {
      setPagamento(await ecommerceService.obterPagamento())
    } catch {
      setPagamento(null)
    } finally {
      setPagamentoCarregado(true)
    }
  }, [token])

  useEffect(() => {
    if (!open) return
    setCalculo(null)
    setPagamento(null)
    setComprovante(null)
    setPixCopiado(false)
    setPagamentoCarregado(false)
    setErroCalculo(null)
    setErrorMessage(null)
    setSuccessMessage(null)
    setDragOver(false)
    void carregarDados()
  }, [open, carregarDados])

  const copiarChavePix = () => {
    if (!pagamento?.pixChave) return
    navigator.clipboard.writeText(pagamento.pixChave)
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 2000)
    toast.success('Chave PIX copiada!')
  }

  const selecionarArquivo = (file: File | null) => {
    setComprovante(file)
    setErrorMessage(null)
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
  const carrinhoVazio = calculo != null && calculo.quantidade === 0
  const podeEnviar = !!comprovante
    && !!calculo
    && calculo.quantidade > 0
    && pagamentoCarregado
    && !pixIndisponivel
    && !isProcessing
    && !successMessage

  const handleSubmit = async () => {
    if (!comprovante) {
      setErrorMessage('Anexe o comprovante do PIX para finalizar a compra.')
      return
    }
    if (!calculo) {
      setErrorMessage(erroCalculo ?? 'Aguarde o cálculo do carrinho e tente novamente.')
      return
    }
    if (calculo.quantidade === 0) {
      setErrorMessage('Seu carrinho está vazio. Adicione as fotos extras novamente.')
      return
    }
    if (!pagamentoCarregado) {
      setErrorMessage('Aguarde o carregamento da chave PIX.')
      return
    }
    if (pixIndisponivel) {
      setErrorMessage('O estúdio ainda não configurou a chave PIX. Fale com o estúdio.')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    try {
      await onConfirmar(comprovante)
      setComprovante(null)
      setSuccessMessage('Comprovante enviado! O estúdio vai confirmar o pagamento.')
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Erro ao enviar o comprovante')
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && !isProcessing) onClose()
      }}
    >
      <SheetContent className="h-dvh max-h-none w-full max-w-lg gap-5 overflow-y-auto rounded-none bg-gallery-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:h-full sm:p-6">
        <SheetTitle className="font-display text-lg font-semibold text-gallery-ink">
          {successMessage ? 'Comprovante enviado' : 'Pagar extras via PIX'}
        </SheetTitle>

        {successMessage ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-emerald-900">{successMessage}</p>
              <p className="text-xs leading-relaxed text-emerald-800">
                A compra já aparece em “Minhas compras” com o status “Aguardando confirmação”.
              </p>
            </div>
            <button
              onClick={onClose}
              className={cn('flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold', GALLERY_CTA)}
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            {calculo && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gallery-accent">
                  ITENS NO CARRINHO ({calculo.quantidade})
                </h3>
                <div className="max-h-32 space-y-1.5 overflow-y-auto">
                  {calculo.itens.map((item) => (
                    <div key={item.fotoId} className="flex items-center justify-between text-sm">
                      <span className="flex-1 truncate text-gallery-muted">{item.fileName}</span>
                      <span className="ml-2 font-medium text-gallery-ink">
                        {formatBRL(item.valorUnitario)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-gallery-line pt-2 text-sm font-medium text-gallery-ink">
                  <span>Total</span>
                  <span>{formatBRL(calculo.total)}</span>
                </div>
              </div>
            )}

            {isCalculando && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-gallery-line bg-gallery-bg p-4 text-sm text-gallery-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculando o valor das extras...
              </div>
            )}

            {erroCalculo && (
              <div className="space-y-2 rounded-2xl border border-gallery-line bg-gallery-bg p-3 text-xs text-gallery-accent">
                <p>{erroCalculo}</p>
                <button
                  onClick={() => void carregarDados()}
                  className="font-semibold underline underline-offset-2"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {carrinhoVazio && (
              <div className="rounded-2xl border border-gallery-line bg-gallery-bg p-3 text-xs text-gallery-accent">
                Seu carrinho está vazio. Volte à galeria e adicione as fotos extras novamente.
              </div>
            )}

            <div className="space-y-2 rounded-2xl border border-gallery-line bg-gallery-bg p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gallery-ink">
                <QrCode className="h-4 w-4 text-gallery-accent" />
                Pague via PIX
              </div>
              {pagamento?.pixChave ? (
                <>
                  <p className="break-all text-[11px] text-gallery-muted">
                    {pagamento.pixTipoChave ? `${pagamento.pixTipoChave}: ` : ''}
                    <span className="font-mono text-gallery-ink">{pagamento.pixChave}</span>
                  </p>
                  <button
                    onClick={copiarChavePix}
                    className="flex items-center gap-1 text-xs font-medium text-gallery-accent hover:opacity-80"
                  >
                    {pixCopiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {pixCopiado ? 'Copiado' : 'Copiar chave'}
                  </button>
                </>
              ) : (
                <p className="text-[11px] text-gallery-accent">
                  {pagamentoCarregado
                    ? 'PIX ainda não configurado pelo estúdio. Fale com o estúdio antes de pagar.'
                    : 'Carregando chave PIX...'}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
              Pague o valor acima e anexe o comprovante. A compra só é registrada depois que você
              clicar em <strong>Enviar comprovante e finalizar</strong>. Se fechar esta janela antes,
              seu carrinho continuará salvo.
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gallery-accent">ANEXAR COMPROVANTE</p>

              <input
                ref={inputFileRef}
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                className="hidden"
                onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)}
              />

              {!comprovante ? (
                <div
                  onClick={() => inputFileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all',
                    dragOver
                      ? 'border-gallery-accent bg-gallery-bg'
                      : 'border-gallery-line hover:border-gallery-accent hover:bg-gallery-bg',
                  )}
                >
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
                  <button
                    onClick={() => inputFileRef.current?.click()}
                    className="mr-2 shrink-0 text-xs font-medium text-gallery-accent hover:opacity-80"
                  >
                    Trocar
                  </button>
                  <button
                    onClick={() => selecionarArquivo(null)}
                    aria-label="Remover comprovante"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-gallery-line bg-gallery-bg p-3 text-xs text-gallery-accent">
                {errorMessage}
              </div>
            )}

            <button
              onClick={() => void handleSubmit()}
              disabled={!podeEnviar}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
                GALLERY_CTA,
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isProcessing ? 'Enviando...' : 'Enviar comprovante e finalizar'}
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
