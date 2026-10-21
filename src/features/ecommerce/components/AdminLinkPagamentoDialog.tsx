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

interface AdminLinkPagamentoDialogProps {
  compraId: string | null
  linkAtual?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function linkValido(link: string): boolean {
  try {
    const url = new URL(link)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function AdminLinkPagamentoDialog({
  compraId, linkAtual, open, onOpenChange, onSaved,
}: AdminLinkPagamentoDialogProps) {
  const [link, setLink] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) setLink(linkAtual ?? '')
  }, [open, linkAtual])

  const salvar = async () => {
    if (!compraId) return
    const linkNormalizado = link.trim()
    if (linkNormalizado && !linkValido(linkNormalizado)) {
      toast.error('Informe uma URL http ou https válida')
      return
    }
    setIsSaving(true)
    try {
      await ecommerceService.adminAtualizarLinkPagamento(compraId, linkNormalizado || null)
      toast.success(linkNormalizado ? 'Link de pagamento salvo' : 'Link de pagamento removido')
      onSaved?.()
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Erro ao salvar link de pagamento'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!isSaving) onOpenChange(value) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link de pagamento por cartão</DialogTitle>
          <DialogDescription>
            Cole o link gerado no gateway. O cliente verá o botão de pagamento em &quot;Minhas Compras&quot; e no checkout.
            Deixe vazio para remover o link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="link-pagamento">URL de pagamento</Label>
          <Input
            id="link-pagamento"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://pagamento.exemplo.com/abc123"
            maxLength={1000}
            inputMode="url"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={isSaving || !compraId}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
