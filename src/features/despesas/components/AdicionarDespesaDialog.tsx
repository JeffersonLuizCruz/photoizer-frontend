import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { despesaService } from '../services/despesa.service'

interface AdicionarDespesaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdicionarDespesaDialog({ open, onOpenChange }: AdicionarDespesaDialogProps) {
  const queryClient = useQueryClient()

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState<'MANUTENCAO' | 'COMPRA'>('MANUTENCAO')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [observacao, setObservacao] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => despesaService.criar({
      descricao,
      valor: Number.parseFloat(valor),
      categoria,
      data,
      observacao: observacao || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      toast.success('Despesa registrada')
      onOpenChange(false)
      setDescricao('')
      setValor('')
      setCategoria('MANUTENCAO')
      setData(new Date().toISOString().slice(0, 10))
      setObservacao('')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar despesa')
    },
  })

  const valid = descricao.trim() && valor && Number.parseFloat(valor) > 0 && data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogDescription>
            Registre uma despesa manual (manutenção, compra de equipamento, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Manutenção de câmera" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input id="valor" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoria} onValueChange={(v: 'MANUTENCAO' | 'COMPRA') => setCategoria(v)}>
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                  <SelectItem value="COMPRA">Compra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="data">Data *</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="observacao">Observação</Label>
            <textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Observações opcionais"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutate()} disabled={isPending || !valid}>
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
