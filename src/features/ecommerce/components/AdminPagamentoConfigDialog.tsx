import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import { extractErrorMessage } from '@/shared/api'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

interface AdminPagamentoConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

const TIPOS_CHAVE = ['CNPJ', 'CPF', 'E-MAIL', 'TELEFONE', 'ALEATÓRIA']

export function AdminPagamentoConfigDialog({ open, onOpenChange, onSaved }: AdminPagamentoConfigDialogProps) {
  const [pixChave, setPixChave] = useState('')
  const [pixTipoChave, setPixTipoChave] = useState('CNPJ')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    ecommerceService.adminObterPagamento()
      .then((data) => {
        setPixChave(data.pixChave ?? '')
        setPixTipoChave(data.pixTipoChave ?? 'CNPJ')
      })
      .catch((error: unknown) => {
        toast.error(extractErrorMessage(error, 'Erro ao carregar configuração de pagamento'))
      })
      .finally(() => setIsLoading(false))
  }, [open])

  const salvar = async () => {
    setIsSaving(true)
    try {
      await ecommerceService.adminAtualizarPagamento({
        pixChave: pixChave.trim() || null,
        pixTipoChave: pixTipoChave.trim() || null,
      })
      toast.success('PIX atualizado para todas as galerias')
      onSaved?.()
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Erro ao salvar configuração de pagamento'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!isSaving) onOpenChange(value) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagamento do e-commerce</DialogTitle>
          <DialogDescription>
            Este PIX aparece no checkout de fotos extras de todas as galerias e pode ser alterado a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pix-tipo-chave">Tipo da chave PIX</Label>
              <select
                id="pix-tipo-chave"
                value={pixTipoChave}
                onChange={(e) => setPixTipoChave(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {TIPOS_CHAVE.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix-chave">Chave PIX</Label>
              <Input
                id="pix-chave"
                value={pixChave}
                onChange={(e) => setPixChave(e.target.value)}
                placeholder="CNPJ, CPF, e-mail, telefone ou chave aleatória"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para desabilitar o PIX no checkout. O valor não fica salvo nas compras já criadas.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={isLoading || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
