import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { indicadorService } from '../services/indicador.service'
import type { IndicadorResponse } from '../types'

interface IndicadorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  indicador?: IndicadorResponse | null
}

export function IndicadorDialog({ open, onOpenChange, indicador }: IndicadorDialogProps) {
  const queryClient = useQueryClient()
  const isEdit = !!indicador

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (indicador) {
      setNome(indicador.nome)
      setTelefone(indicador.telefone)
      setObservacoes(indicador.observacoes ?? '')
    } else {
      setNome('')
      setTelefone('')
      setObservacoes('')
    }
  }, [indicador, open])

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: () => {
      const payload = { nome, telefone, observacoes: observacoes || undefined }
      return isEdit
        ? indicadorService.atualizar(indicador!.id, payload)
        : indicadorService.criar(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes', 'indicadores'] })
      queryClient.invalidateQueries({ queryKey: ['indicadores'] })
      toast.success(isEdit ? 'Indicador atualizado' : 'Indicador criado')
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar indicador')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Indicador' : 'Novo Indicador'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do indicador.'
              : 'Cadastre uma nova pessoa que indica clientes.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do indicador" />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Observações opcionais"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={() => salvar()} disabled={isPending || !nome.trim() || !telefone.trim()}>
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
