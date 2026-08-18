import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import {
  useCriarCategoria,
  useAtualizarCategoria,
  useRemoverCategoria,
  useDespesasCategorias,
} from '../api/queries'
import type { DespesaCategoria } from '../types/despesa.types'

interface GerenciarCategoriasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CORES = ['#0ea5e9', '#22c55e', '#f59e0b', '#e1749a', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b']

export function GerenciarCategoriasDialog({ open, onOpenChange }: GerenciarCategoriasDialogProps) {
  const { data: categorias, isLoading } = useDespesasCategorias(false)
  const criar = useCriarCategoria()
  const atualizar = useAtualizarCategoria()
  const remover = useRemoverCategoria()

  const [editando, setEditando] = useState<DespesaCategoria | null>(null)
  const [criandoNova, setCriandoNova] = useState(false)
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(CORES[0])
  const [ativo, setAtivo] = useState(true)

  const resetForm = () => {
    setEditando(null)
    setCriandoNova(false)
    setNome('')
    setCor(CORES[0])
    setAtivo(true)
  }

  const startEdit = (c: DespesaCategoria) => {
    setEditando(c)
    setCriandoNova(false)
    setNome(c.nome)
    setCor(c.cor ?? CORES[0])
    setAtivo(c.ativo)
  }

  const salvar = () => {
    if (!nome.trim()) {
      toast.error('Informe o nome da categoria')
      return
    }
    if (editando) {
      atualizar.mutate(
        { id: editando.id, request: { nome: nome.trim(), cor, ativo } },
        {
          onSuccess: () => {
            toast.success('Categoria atualizada')
            resetForm()
          },
        },
      )
    } else {
      criar.mutate(
        { nome: nome.trim(), cor, ativo },
        {
          onSuccess: () => {
            toast.success('Categoria criada')
            resetForm()
          },
        },
      )
    }
  }

  const excluir = (c: DespesaCategoria) => {
    remover.mutate(c.id, {
      onSuccess: () => toast.success(c.qtdDespesas > 0 ? 'Categoria inativada' : 'Categoria removida'),
    })
  }

  const isPending = criar.isPending || atualizar.isPending || remover.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias de Despesa</DialogTitle>
          <DialogDescription>Edite as categorias disponíveis nos formulários de despesa.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!criandoNova && !editando && (
            <Button variant="outline" size="sm" onClick={() => { setCriandoNova(true); setEditando(null); setNome(''); setCor(CORES[0]); setAtivo(true) }}>
              <Plus className="mr-1 h-4 w-4" />
              Nova categoria
            </Button>
          )}

          {(criandoNova || editando) && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="nova-categoria-nome">Nome *</Label>
                  <Input id="nova-categoria-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Marketing e Publicidade" />
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {CORES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCor(c)}
                        className={`h-6 w-6 rounded-full border-2 transition-transform ${cor === c ? 'scale-110 border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Cor ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="nova-categoria-ativo">Categoria ativa</Label>
                <Switch id="nova-categoria-ativo" checked={ativo} onCheckedChange={setAtivo} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={salvar} disabled={isPending}>
                  <Save className="mr-1 h-4 w-4" />
                  {editando ? 'Salvar alterações' : 'Criar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetForm} disabled={isPending}>
                  <X className="mr-1 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {isLoading && <div className="py-6 text-center text-sm text-muted-foreground">Carregando categorias...</div>}

          {!isLoading && (
            <ul className="max-h-72 space-y-2 overflow-auto pr-1">
              {categorias?.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.cor ?? '#94a3b8' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.qtdDespesas} despesa(s) · {c.ativo ? 'Ativa' : 'Inativa'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(c)} disabled={isPending} aria-label={`Editar ${c.nome}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => excluir(c)} disabled={isPending} aria-label={`Excluir ${c.nome}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
