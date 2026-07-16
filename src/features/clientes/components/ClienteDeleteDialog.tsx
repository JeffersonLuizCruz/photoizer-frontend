import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import type { Cliente } from '../types'

interface ClienteDeleteDialogProps {
  cliente: Cliente | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading?: boolean
}

export function ClienteDeleteDialog({ cliente, open, onOpenChange, onConfirm, isLoading }: ClienteDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Excluir cliente"
      description={`Tem certeza que deseja excluir "${cliente?.nome}"? Esta ação não pode ser desfeita.`}
      confirmText="Excluir"
      cancelText="Cancelar"
      variant="destructive"
      isLoading={isLoading}
    />
  )
}
