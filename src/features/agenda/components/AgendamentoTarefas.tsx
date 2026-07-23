import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, AlertTriangle, CheckCircle2, Loader2, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { useUpdateTarefa, useDeleteTarefa, useUsuariosList } from '../api/queries'
import type { Tarefa } from '../types'
import type { TarefaStatus, TarefaTipo } from '@/shared/constants'

const TAREFA_TIPOS: { value: TarefaTipo; label: string }[] = [
  { value: 'EDITAR_FOTOS', label: 'Editar Fotos' },
  { value: 'ENVIAR_PARA_SELECAO', label: 'Enviar para Seleção' },
  { value: 'ENTREGA_FINAL', label: 'Entrega Final' },
]

const tarefaStatusConfig: Record<TarefaStatus, { label: string; variant: 'warning' | 'success' | 'info' | 'destructive' }> = {
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  EM_ANDAMENTO: { label: 'Em Andamento', variant: 'info' },
  CONCLUIDA: { label: 'Concluída', variant: 'success' },
  ATRASADA: { label: 'Atrasada', variant: 'destructive' },
}

function TarefaIcon({ status }: { status: TarefaStatus }) {
  if (status === 'CONCLUIDA') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  if (status === 'ATRASADA') return <AlertTriangle className="h-5 w-5 text-destructive" />
  if (status === 'EM_ANDAMENTO') return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
  return <Clock className="h-5 w-5 text-amber-500" />
}

interface EditarTarefaDialogProps {
  tarefa: Tarefa
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditarTarefaDialog({ tarefa, open, onOpenChange }: EditarTarefaDialogProps) {
  const [tipo, setTipo] = useState<TarefaTipo>(tarefa.tipo as TarefaTipo)
  const [responsavelId, setResponsavelId] = useState(tarefa.responsavelId ?? '')
  const [dataLimite, setDataLimite] = useState(
    tarefa.dataLimite ? format(new Date(tarefa.dataLimite), "yyyy-MM-dd'T'HH:mm") : ''
  )

  const { data: usuarios } = useUsuariosList()
  const { mutate: update, isPending } = useUpdateTarefa(tarefa.id)

  function handleSave() {
    if (!dataLimite) return
    update(
      {
        tipo,
        responsavelId: responsavelId || null,
        dataLimite: new Date(dataLimite).toISOString(),
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TarefaTipo)}>
              <SelectTrigger id="edit-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAREFA_TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-responsavel">Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger id="edit-responsavel">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem responsável</SelectItem>
                {usuarios?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-dataLimite">Data Limite</Label>
            <Input
              id="edit-dataLimite"
              type="datetime-local"
              value={dataLimite}
              onChange={(e) => setDataLimite(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending || !dataLimite}>
              {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AgendamentoTarefas({ tarefas, isLoading }: { tarefas: Tarefa[]; isLoading?: boolean }) {
  const [editTarefa, setEditTarefa] = useState<Tarefa | null>(null)
  const [deleteTarefaId, setDeleteTarefaId] = useState<string | null>(null)
  const { mutate: excluir, isPending: isExcluindo } = useDeleteTarefa()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="mt-2 h-3 w-48 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (tarefas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="mb-2 h-8 w-8" />
        <p className="text-sm">Nenhuma tarefa encontrada</p>
      </div>
    )
  }

  const sorted = [...tarefas].sort((a, b) => {
    if (a.status === 'ATRASADA' && b.status !== 'ATRASADA') return -1
    if (a.status !== 'ATRASADA' && b.status === 'ATRASADA') return 1
    if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1
    if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1
    return 0
  })

  return (
    <>
      <div className="space-y-3">
        {sorted.map((tarefa) => {
          const statusConfig = tarefaStatusConfig[tarefa.status as TarefaStatus] ?? tarefaStatusConfig.PENDENTE
          const isAtrasada = tarefa.status === 'ATRASADA' || (tarefa.status === 'PENDENTE' && tarefa.dataLimite && new Date(tarefa.dataLimite) < new Date())

          return (
            <div
              key={tarefa.id}
              className={cn(
                'flex items-start gap-4 rounded-lg border p-4 transition-colors',
                isAtrasada && 'border-destructive/30 bg-destructive/5',
              )}
            >
              <TarefaIcon status={tarefa.status as TarefaStatus} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{TAREFA_TIPOS.find(t => t.value === tarefa.tipo)?.label ?? tarefa.tipo}</span>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {tarefa.dataLimite && (
                    <span>
                      Prazo: {format(new Date(tarefa.dataLimite), "dd/MM/yyyy 'às' HH:mm")}
                      {isAtrasada && <span className="ml-1 text-destructive font-medium">(Atrasada)</span>}
                    </span>
                  )}
                  {tarefa.dataConclusao && (
                    <span>
                      Concluída em: {format(new Date(tarefa.dataConclusao), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTarefa(tarefa)} title="Editar tarefa">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarefaId(tarefa.id)} title="Excluir tarefa">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {editTarefa && (
        <EditarTarefaDialog
          tarefa={editTarefa}
          open={!!editTarefa}
          onOpenChange={(open) => { if (!open) setEditTarefa(null) }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarefaId}
        onOpenChange={(open) => { if (!open) setDeleteTarefaId(null) }}
        title="Excluir Tarefa"
        description="Tem certeza que deseja excluir esta tarefa?"
        confirmText={isExcluindo ? 'Excluindo...' : 'Excluir'}
        onConfirm={() => {
          if (deleteTarefaId) {
            excluir(deleteTarefaId, { onSettled: () => setDeleteTarefaId(null) })
          }
        }}
        variant="destructive"
        isLoading={isExcluindo}
      />
    </>
  )
}
