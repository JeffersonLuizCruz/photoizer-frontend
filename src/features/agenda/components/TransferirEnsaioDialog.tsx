import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useUsuariosList, usePacotesList, useDisponibilidade, useReatribuirFotografo } from '../api/queries'
import type { Agendamento } from '../types'

interface TransferirEnsaioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento
}

export function TransferirEnsaioDialog({ open, onOpenChange, agendamento }: TransferirEnsaioDialogProps) {
  const [novoFotografoId, setNovoFotografoId] = useState('')
  const [motivo, setMotivo] = useState('')

  const { data: usuarios = [] } = useUsuariosList()
  const { data: pacotes = [] } = usePacotesList()
  const { mutate, isPending } = useReatribuirFotografo(agendamento.id)

  useEffect(() => {
    if (open) {
      setNovoFotografoId('')
      setMotivo('')
    }
  }, [open])

  const elegiveis = usuarios.filter(
    (u) => (u.papel === 'FOTOGRAFO' || u.papel === 'ADMIN') && u.ativo !== false && u.id !== agendamento.fotografoId,
  )

  const pacote = pacotes.find((p) => p.id === agendamento.pacoteId)
  const dataEnsaio = new Date(agendamento.dataHoraEnsaio)
  const horaEnsaio = format(dataEnsaio, 'HH:mm')

  const { data: disponibilidade } = useDisponibilidade(
    dataEnsaio,
    horaEnsaio,
    agendamento.duracaoMinutos,
    pacote?.bloqueiaDiaInteiro ?? false,
    novoFotografoId || undefined,
    agendamento.id,
  )

  const conflito = novoFotografoId && disponibilidade && !disponibilidade.disponivel

  const handleSubmit = () => {
    if (!novoFotografoId) return
    mutate(
      { fotografoId: novoFotografoId, motivo: motivo.trim() || undefined },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir Ensaio</DialogTitle>
          <DialogDescription>
            Atribua este ensaio a outro fotógrafo responsável. O histórico fica registrado no agendamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">
              Responsável atual:{' '}
              <span className="font-medium text-foreground">{agendamento.fotografoNome ?? 'Não definido'}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Novo responsável *</Label>
            <Select value={novoFotografoId} onValueChange={setNovoFotografoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fotógrafo" />
              </SelectTrigger>
              <SelectContent>
                {elegiveis.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: indisponibilidade de última hora"
            />
          </div>

          {conflito && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm font-medium text-amber-700">Conflito de agenda</p>
              </div>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                {disponibilidade.conflitos.map((c) => (
                  <li key={c.agendamentoId}>
                    {c.clienteNome} — {c.horario}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Você pode confirmar mesmo assim.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !novoFotografoId}>
            {isPending ? 'Transferindo...' : 'Confirmar Transferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
