import { useState, useEffect } from 'react'
import { Loader2, Upload, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { CalculoCarrinhoResponse, MetodoPagamento } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'

interface CheckoutDialogProps {
  token: string
  open: boolean
  onClose: () => void
  onConfirm: (metodoPagamento: MetodoPagamento | null) => Promise<void>
  isSubmitting: boolean
  comprovante: File | null
  onComprovanteChange: (file: File | null) => void
}

export function CheckoutDialog({
  token, open, onClose, onConfirm, isSubmitting, comprovante, onComprovanteChange,
}: CheckoutDialogProps) {
  const [calculo, setCalculo] = useState<CalculoCarrinhoResponse | null>(null)
  const [isCalculando, setIsCalculando] = useState(false)
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>('PIX')
  const [pixCopiado, setPixCopiado] = useState(false)

  const CHAVE_PIX = 'photoizer@email.com'

  useEffect(() => {
    if (!open || !token) return
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !isSubmitting && onClose()}>
      <div className="bg-background rounded-xl border shadow-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold">Finalizar Compra</h2>

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
                <p>Após o pagamento, anexe o comprovante abaixo.</p>
              </div>
            )}

            {metodoSelecionado === 'TRANSFERENCIA' && (
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Transferência Bancária</p>
                <p>Banco: Photoizer Bank (237)</p>
                <p>Agência: 0001 | Conta: 12345-6</p>
                <p>Após a transferência, anexe o comprovante abaixo.</p>
              </div>
            )}

            {metodoSelecionado === 'DINHEIRO' && (
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Pagamento em Dinheiro</p>
                <p>Pague o valor total ao fotógrafo no dia do ensaio.</p>
                <p>O pagamento será confirmado pelo administrador.</p>
              </div>
            )}

            {/* Comprovante */}
            <div>
              <label className="text-xs font-medium mb-1 block">Comprovante de Pagamento</label>
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*,.pdf" className="text-xs flex-1"
                  onChange={(e) => onComprovanteChange(e.target.files?.[0] ?? null)} />
              </div>
              {comprovante && (
                <p className="text-[10px] text-muted-foreground mt-1">{comprovante.name}</p>
              )}
            </div>
          </>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={() => { onClose(); onComprovanteChange(null) }}
            disabled={isSubmitting}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={() => onConfirm(metodoSelecionado)} disabled={isSubmitting || isCalculando}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isSubmitting ? 'Enviando...' : `Finalizar${calculo ? ` (R$ ${calculo.total.toFixed(2)})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
