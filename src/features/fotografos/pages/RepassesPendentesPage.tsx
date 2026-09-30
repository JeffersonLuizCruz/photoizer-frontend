import { useState, Fragment } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HandCoins, Loader2, Check, Pencil, Lock } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useRepassesPendentes, usePagarRepasseLote, useParceirosList, useAtualizarRepasse } from '../api/queries'
import { formatCurrency } from '@/shared/lib/format'
import { AGENDAMENTO_STATUS } from '@/shared/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/cn'
import { RepasseInlineEditor } from '../components/RepasseInlineEditor'

export function RepassesPendentesPage() {
  const [filtroFotografo, setFiltroFotografo] = useState<string>('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const { data: repasses = [], isLoading } = useRepassesPendentes(filtroFotografo || undefined)
  const { data: fotografos = [] } = useParceirosList()
  const pagarLote = usePagarRepasseLote()
  const atualizarRepasse = useAtualizarRepasse()

  const pendentes = repasses.filter(r => r.status === 'PENDENTE')
  const totalPendente = pendentes.reduce((acc, r) => acc + r.valorRepassar, 0)

  const isEnsaioFinalizado = (r: (typeof repasses)[number]) =>
    r.agendamento?.status === AGENDAMENTO_STATUS.FINALIZADO

  const pendentesElegiveis = pendentes.filter(isEnsaioFinalizado)

  const toggleSelecao = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePagarSelecionados = () => {
    if (selecionados.size === 0) return
    pagarLote.mutate(Array.from(selecionados), {
      onSuccess: () => {
        setSelecionados(new Set())
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repasses Pendentes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os pagamentos pendentes para os fotógrafos parceiros
          </p>
        </div>
        {selecionados.size > 0 && (
          <Button onClick={handlePagarSelecionados} disabled={pagarLote.isPending}>
            {pagarLote.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <HandCoins className="mr-1 h-4 w-4" />
            )}
            Pagar {selecionados.size} repasse(s)
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPendente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Repasses Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendentes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parceiros com Pendência</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(pendentes.map(r => r.fotografo?.id ?? r.fotografo?.toString())).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-64">
          <Select value={filtroFotografo} onValueChange={(v) => setFiltroFotografo(v === 'todos' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por parceiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os fotógrafos</SelectItem>
              {fotografos.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : repasses.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <HandCoins className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum repasse pendente</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Todos os repasses para fotógrafos estão em dia.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden rounded-md border overflow-x-auto md:block">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selecionados.size === pendentesElegiveis.length && pendentesElegiveis.length > 0}
                    disabled={pendentesElegiveis.length === 0}
                    aria-label="Selecionar todos os repasses pendentes elegíveis"
                    onChange={() => {
                      if (selecionados.size === pendentesElegiveis.length) {
                        setSelecionados(new Set())
                      } else {
                        setSelecionados(new Set(pendentesElegiveis.map(r => r.id)))
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Parceiro</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ensaio</TableHead>
                <TableHead className="text-right">Valor Repasse</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Data Ensaio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repasses.map((r) => (
                <Fragment key={r.id}>
                <TableRow className={r.status === 'PAGO' ? 'opacity-60' : ''}>
                  <TableCell>
                    {r.status === 'PENDENTE' && isEnsaioFinalizado(r) && (
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selecionados.has(r.id)}
                        aria-label={`Selecionar repasse de ${r.fotografo?.nome ?? 'fotógrafo'}`}
                        onChange={() => toggleSelecao(r.id)}
                      />
                    )}
                    {r.status === 'PENDENTE' && !isEnsaioFinalizado(r) && (
                      <span title="Aguardando finalização do ensaio">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </span>
                    )}
                    {r.status === 'PAGO' && <Check className="h-4 w-4 text-emerald-500" />}
                  </TableCell>
                  <TableCell className="font-medium">{r.fotografo?.nome ?? '—'}</TableCell>
                  <TableCell>{r.agendamento?.cliente?.nome ?? '—'}</TableCell>
                  <TableCell>{r.agendamento?.pacote?.nome ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {formatCurrency(r.valorRepassar)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={r.status === 'PAGO' ? 'success' : 'warning'}>
                      {r.status === 'PAGO' ? 'Pago' : 'Pendente'}
                    </Badge>
                    {r.status === 'PENDENTE' && !isEnsaioFinalizado(r) && (
                      <p className="mt-1 text-xs text-muted-foreground">Aguardando finalização</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                    {r.agendamento?.dataHoraEnsaio
                      ? format(new Date(r.agendamento.dataHoraEnsaio), 'dd/MM/yyyy', { locale: ptBR })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'PENDENTE' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditandoId(editandoId === r.id ? null : r.id)}
                        disabled={atualizarRepasse.isPending}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        {editandoId === r.id ? 'Cancelar' : 'Editar'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {editandoId === r.id && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <RepasseInlineEditor
                        initial={{ tipoValor: r.tipoValor, percentual: r.percentual, valorRepassar: r.valorRepassar }}
                        isSaving={atualizarRepasse.isPending}
                        onSave={(payload) => {
                          if (!r.agendamento?.id || !r.fotografo?.id) return
                          atualizarRepasse.mutate(
                            { agendamentoId: r.agendamento.id, fotografoId: r.fotografo.id, payload },
                            { onSuccess: () => setEditandoId(null) },
                          )
                        }}
                        onCancel={() => setEditandoId(null)}
                      />
                    </TableCell>
                  </TableRow>
                )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 md:hidden">
          {repasses.map((r) => (
            <div
              key={r.id}
              className={cn('space-y-3 rounded-lg border bg-card p-4', r.status === 'PAGO' && 'opacity-60')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {r.status === 'PENDENTE' && isEnsaioFinalizado(r) && (
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0"
                      checked={selecionados.has(r.id)}
                      aria-label={`Selecionar repasse de ${r.fotografo?.nome ?? 'fotógrafo'}`}
                      onChange={() => toggleSelecao(r.id)}
                    />
                  )}
                  {r.status === 'PENDENTE' && !isEnsaioFinalizado(r) && (
                    <Lock className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  {r.status === 'PAGO' && <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.fotografo?.nome ?? '—'}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.agendamento?.cliente?.nome ?? '—'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.agendamento?.pacote?.nome ?? '—'}
                    </p>
                  </div>
                </div>
                <Badge variant={r.status === 'PAGO' ? 'success' : 'warning'}>
                  {r.status === 'PAGO' ? 'Pago' : 'Pendente'}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {r.agendamento?.dataHoraEnsaio
                    ? format(new Date(r.agendamento.dataHoraEnsaio), 'dd/MM/yyyy', { locale: ptBR })
                    : '—'}
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(r.valorRepassar)}</span>
              </div>

              {r.status === 'PENDENTE' && !isEnsaioFinalizado(r) && (
                <p className="text-xs text-muted-foreground">Aguardando finalização</p>
              )}

              {r.status === 'PENDENTE' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setEditandoId(editandoId === r.id ? null : r.id)}
                  disabled={atualizarRepasse.isPending}
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  {editandoId === r.id ? 'Cancelar' : 'Editar'}
                </Button>
              )}

              {editandoId === r.id && (
                <RepasseInlineEditor
                  initial={{ tipoValor: r.tipoValor, percentual: r.percentual, valorRepassar: r.valorRepassar }}
                  isSaving={atualizarRepasse.isPending}
                  onSave={(payload) => {
                    if (!r.agendamento?.id || !r.fotografo?.id) return
                    atualizarRepasse.mutate(
                      { agendamentoId: r.agendamento.id, fotografoId: r.fotografo.id, payload },
                      { onSuccess: () => setEditandoId(null) },
                    )
                  }}
                  onCancel={() => setEditandoId(null)}
                />
              )}
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  )
}
