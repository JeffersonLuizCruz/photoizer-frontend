import { useState, Fragment } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HandCoins, Loader2, Check, Pencil } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useRepassesPendentes, usePagarRepasseLote, useParceirosList, useAtualizarRepasse } from '../api/queries'
import { formatCurrency } from '@/shared/lib/format'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
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

      <div className="flex items-center gap-4">
        <div className="w-64">
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selecionados.size === pendentes.length && pendentes.length > 0}
                    onChange={() => {
                      if (selecionados.size === pendentes.length) {
                        setSelecionados(new Set())
                      } else {
                        setSelecionados(new Set(pendentes.map(r => r.id)))
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
                    {r.status === 'PENDENTE' && (
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selecionados.has(r.id)}
                        onChange={() => toggleSelecao(r.id)}
                      />
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
      )}
    </div>
  )
}
