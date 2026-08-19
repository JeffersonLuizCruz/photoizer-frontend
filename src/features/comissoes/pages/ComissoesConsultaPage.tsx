import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Package, Image, Video, Percent, User } from 'lucide-react'
import { toast } from 'sonner'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/cn'
import { comissoesService } from '../services/comissoes.service'
import { indicadorService } from '../services/indicador.service'
import { IndicadorDialog } from '../components/IndicadorDialog'
import type { IndicadorListagem } from '../types'
import type { IndicadorResponse } from '../types'

const currency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ORIGEM_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  PACOTE: Package,
  FOTO_EXTRA: Image,
  VIDEO_EXTRA: Video,
  INDICADOR: User,
}

const ORIGEM_LABEL: Record<string, string> = {
  PACOTE: 'Pacote',
  FOTO_EXTRA: 'Foto Extra',
  VIDEO_EXTRA: 'Vídeo Extra',
  INDICADOR: 'Indicador',
}

function IndicadorRow({
  indicador,
  onEdit,
  onDelete,
}: {
  indicador: IndicadorListagem
  onEdit: (i: IndicadorListagem) => void
  onDelete: (i: IndicadorListagem) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: detalhes } = useQuery({
    queryKey: ['comissoes', 'consulta', indicador.indicadorTelefone],
    queryFn: () => comissoesService.consultar(indicador.indicadorTelefone),
    enabled: expanded,
  })

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{indicador.indicadorNome}</p>
            {indicador.percentualComissao != null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                <Percent className="h-3 w-3" />
                {indicador.percentualComissao}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{indicador.indicadorTelefone}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="font-medium text-yellow-600 tabular-nums">{currency(indicador.totalPendente)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="font-medium text-green-600 tabular-nums">{currency(indicador.totalPago)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Indicações</p>
            <p className="font-medium tabular-nums">{indicador.totalIndicacoes}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(indicador)} aria-label={`Editar indicador ${indicador.indicadorNome}`}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(indicador)} aria-label={`Excluir indicador ${indicador.indicadorNome}`}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {expanded && detalhes && (
        <div className="border-t divide-y">
          {detalhes.indicacoes.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">
              Nenhuma indicação encontrada.
            </p>
          )}
          {detalhes.indicacoes.map((ind) => {
            const Icon = ORIGEM_ICON[ind.origem] || Package
            return (
              <div key={ind.id} className="p-4 pl-12 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium truncate">{ind.clienteNome}</p>
                    <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {ORIGEM_LABEL[ind.origem] || ind.origem}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {currency(ind.valorComissao)}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] px-1.5 py-0.5 rounded font-medium',
                        ind.status === 'PAGA' && 'bg-green-100 text-green-700',
                        ind.status === 'CANCELADA' && 'bg-rose-100 text-rose-600',
                        ind.status === 'PENDENTE' && 'bg-yellow-100 text-yellow-700',
                      )}
                    >
                      {ind.status === 'PAGA' ? 'Pago' : ind.status === 'CANCELADA' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{ind.pacoteNome}</span>
                  <span>Ref.: {currency(ind.valorReferencia)}</span>
                  <span>{ind.percentual}%</span>
                  {ind.origem !== 'PACOTE' && (
                    <span>{ind.origem === 'FOTO_EXTRA' ? 'Foto extra' : 'Vídeo extra'}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ComissoesConsultaPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editIndicador, setEditIndicador] = useState<IndicadorResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IndicadorListagem | null>(null)

  const { data: indicadores, isLoading } = useQuery({
    queryKey: ['comissoes', 'indicadores'],
    queryFn: () => comissoesService.listarIndicadores(),
  })

  const { data: indicadorList } = useQuery({
    queryKey: ['indicadores'],
    queryFn: () => indicadorService.listar(),
  })

  const filtered = indicadores?.filter(
    (i) =>
      !search ||
      i.indicadorNome.toLowerCase().includes(search.toLowerCase()) ||
      i.indicadorTelefone.includes(search),
  )

  const { mutate: removerIndicador } = useMutation({
    mutationFn: (telefone: string) => indicadorService.listar().then((list) => {
      const match = list.find((i) => i.telefone === telefone)
      if (match) return indicadorService.remover(match.id)
      return Promise.reject(new Error('Indicador não encontrado'))
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes', 'indicadores'] })
      toast.success('Indicador removido')
      setDeleteTarget(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover indicador')
    },
  })

  return (
    <>
      <PageTitle
        title="Comissões"
        description="Gerencie indicadores e consulte comissões"
        breadcrumbs={[{ label: 'Comissões' }]}
        actions={
          <Button onClick={() => { setEditIndicador(null); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Indicador
          </Button>
        }
      />

      <div className="max-w-md mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((ind) => (
            <IndicadorRow
              key={ind.indicadorTelefone}
              indicador={ind}
              onEdit={(i) => {
                const match = indicadorList?.find(ind => ind.telefone === i.indicadorTelefone)
                setEditIndicador(match ?? null)
                setDialogOpen(true)
              }}
              onDelete={(i) => setDeleteTarget(i)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p className="text-sm">Nenhum indicador encontrado.</p>
        </div>
      )}

      <IndicadorDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditIndicador(null)
        }}
        indicador={editIndicador}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border bg-card p-6 max-w-sm mx-4 shadow-lg">
            <h3 className="font-semibold mb-2">Remover Indicador</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza que deseja remover <strong>{deleteTarget.indicadorNome}</strong>?
              As comissões já registradas permanecem no histórico.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => removerIndicador(deleteTarget.indicadorTelefone)}>
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
