import { useState, useEffect } from 'react'
import { Loader2, Copy, Check, ArrowLeft, CreditCard, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { CalculoCarrinhoResponse, CompraExtraResponse, MetodoPagamento } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'

interface CheckoutDialogProps {
  token: string
  open: boolean
  onClose: () => void
  onCheckout: (metodoPagamento: MetodoPagamento) => Promise<CompraExtraResponse>
  onPagarSimulado: (compra: CompraExtraResponse) => Promise<void>
  onEnviarComprovante: (compra: CompraExtraResponse, file: File) => Promise<void>
}

export function CheckoutDialog({
  token, open, onClose, onCheckout, onPagarSimulado, onEnviarComprovante,
}: CheckoutDialogProps) {
  const [calculo, setCalculo] = useState<CalculoCarrinhoResponse | null>(null)
  const [isCalculando, setIsCalculando] = useState(false)
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>('PIX')
  const [pixCopiado, setPixCopiado] = useState(false)
  const [compra, setCompra] = useState<CompraExtraResponse | null>(null)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [isCriandoCompra, setIsCriandoCompra] = useState(false)
  const [isPagando, setIsPagando] = useState(false)
  const [isEnviando, setIsEnviando] = useState(false)

  const CHAVE_PIX = 'photoizer@email.com'

  useEffect(() => {
    if (!open || !token) return
    setCompra(null)
    setComprovante(null)
    setIsCalculando(true)
    ecommerceService.calcular(token)
      .then(setCalculo)
      .catch(() => toast.error('Erro ao calcular carrinho'))
      .finally(() => setIsCalculando(false))
  }, [open, token])

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CHAVE_PIX)
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 2000)
    toast.success('Chave PIX copiada!')
  }

  const finalizar = async () => {
    setIsCriandoCompra(true)
    try {
      const compraCriada = await onCheckout(metodoSelecionado)
      setCompra(compraCriada)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao criar compra')
    } finally {
      setIsCriandoCompra(false)
    }
  }

  const pagarSimulado = async () => {
    if (!compra) return
    setIsPagando(true)
    try {
      await onPagarSimulado(compra)
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao processar pagamento')
    } finally {
      setIsPagando(false)
    }
  }

  const enviarComprovante = async () => {
    if (!compra || !comprovante) return
    setIsEnviando(true)
    try {
      await onEnviarComprovante(compra, comprovante)
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao enviar comprovante')
    } finally {
      setIsEnviando(false)
    }
  }

  if (!open) return null

  const methodLabel = (metodo: string | null | undefined) =>
    metodo === 'PIX' ? 'PIX' : metodo === 'TRANSFERENCIA' ? 'Transferência' : metodo === 'DINHEIRO' ? 'Dinheiro' : '-'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !isCriandoCompra && !isPagando && !isEnviando && onClose()}>
      <div className="bg-background rounded-xl border shadow-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold">
          {compra ? 'Pagamento' : 'Finalizar Compra'}
        </h2>

        {!compra ? (
          <>
            {isCalculando ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : calculo ? (
              <>
                {/* Preview dos itens */}
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
                </div>

                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({calculo.quantidade} × R$ {calculo.valorUnitario.toFixed(2)})</span>
                    <span>R$ {calculo.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span>Total</span>
                    <span>R$ {calculo.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Método de pagamento */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">FORMA DE PAGAMENTO</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PIX', 'TRANSFERENCIA', 'DINHEIRO'] as MetodoPagamento[]).map((metodo) => (
                      <button key={metodo} onClick={() => setMetodoSelecionado(metodo)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-center ${
                          metodoSelecionado === metodo
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:bg-accent'
                        }`}>
                        {metodo === 'PIX' ? 'PIX' : metodo === 'TRANSFERENCIA' ? 'Transferência' : 'Dinheiro'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instruções de pagamento */}
                {metodoSelecionado === 'PIX' && (
                  <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">Pagamento via PIX</p>
                    <div className="flex items-center justify-between gap-2 bg-background rounded px-2 py-1.5 border">
                      <code className="text-xs font-mono">{CHAVE_PIX}</code>
                      <button onClick={copiarChavePix}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium whitespace-nowrap">
                        {pixCopiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {pixCopiado ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <p>Após o pagamento, você poderá simular o pagamento para liberar as fotos.</p>
                  </div>
                )}

                {metodoSelecionado === 'TRANSFERENCIA' && (
                  <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Transferência Bancária</p>
                    <p>Banco: Photoizer Bank (237)</p>
                    <p>Agência: 0001 | Conta: 12345-6</p>
                    <p>Após a transferência, confirme o pagamento para liberar as fotos.</p>
                  </div>
                )}

                {metodoSelecionado === 'DINHEIRO' && (
                  <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Pagamento em Dinheiro</p>
                    <p>Pague o valor total ao fotógrafo no dia do ensaio.</p>
                    <p>Depois confirme o pagamento para liberar as fotos.</p>
                  </div>
                )}
              </>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={onClose}
                disabled={isCriandoCompra}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={finalizar} disabled={isCriandoCompra || isCalculando}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {isCriandoCompra ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {isCriandoCompra ? 'Criando...' : `Finalizar${calculo ? ` (R$ ${calculo.total.toFixed(2)})` : ''}`}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Fase 2: pagamento */}
            <div className="rounded-lg border bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">R$ {compra.valorTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forma de pagamento</span>
                <span className="font-medium">{methodLabel(compra.metodoPagamento)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t">
                Simulação de gateway de pagamento. Confirme o pagamento para liberar as fotos na hora.
              </p>
            </div>

            <button onClick={pagarSimulado} disabled={isPagando || isEnviando}
              className="w-full rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
              {isPagando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {isPagando ? 'Processando...' : 'Pagar agora (simulado)'}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium mb-1 block">Enviar comprovante para confirmação manual</label>
              <input type="file" accept="image/*,.pdf" className="text-xs flex-1"
                onChange={(e) => setComprovante(e.target.files?.[0] ?? null)} />
              <button onClick={enviarComprovante} disabled={isEnviando || isPagando || !comprovante}
                className="w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {isEnviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isEnviando ? 'Enviando...' : 'Enviar comprovante'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => { setCompra(null); setComprovante(null) }}
                disabled={isPagando || isEnviando}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
              <button onClick={onClose} disabled={isPagando || isEnviando}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                Fechar (pagar depois)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
