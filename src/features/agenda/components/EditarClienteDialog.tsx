import { useCliente, useUpdateCliente } from '@/features/clientes/api/queries'
import { ClienteForm } from '@/features/clientes/components/ClienteForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { PageLoading } from '@/shared/components/layout/Loading'
import type { ClienteFormData } from '@/features/clientes/schemas/cliente.schema'

interface EditarClienteDialogProps {
  clienteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditarClienteDialog({ clienteId, open, onOpenChange }: EditarClienteDialogProps) {
  const { data: cliente, isLoading } = useCliente(clienteId)
  const { mutate: updateCliente, isPending } = useUpdateCliente(clienteId)

  const handleSubmit = (data: ClienteFormData) => {
    updateCliente(data, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <PageLoading />
        ) : (
          <ClienteForm
            onSubmit={handleSubmit}
            defaultValues={
              cliente
                ? {
                    nome: cliente.nome,
                    telefone: cliente.telefone,
                    email: cliente.email ?? '',
                    cpf: cliente.cpf ?? '',
                    cidade: cliente.cidade ?? '',
                    estado: cliente.estado ?? '',
                    origem: cliente.origem,
                    observacoes: cliente.observacoes ?? '',
                  }
                : undefined
            }
            isLoading={isPending}
            mode="edit"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
