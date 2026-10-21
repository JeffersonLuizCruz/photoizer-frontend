import { useState, Fragment } from 'react'
import { Plus, CreditCard, Receipt, Check, History, Link2, Download, FileSpreadsheet, HandCoins, Pencil, Banknote } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { formatCurrency } from '@/shared/lib/format'
import { exportarCSV, exportarXLS } from '@/shared/lib/export'
import { DespesaFormDialog } from '@/features/despesas/components/DespesaFormDialog'
import { RegistrarPagamentoDialog } from './RegistrarPagamentoDialog'
import { RegistrarRecebimentoDialog } from './RegistrarRecebimentoDialog'
import { AdicionarExtrasDialog } from './AdicionarExtrasDialog'
import { VincularDespesaDialog } from './VincularDespesaDialog'
import { usePagamentosList, useResumoFinanceiroTrabalho, useUpdateAgendamentoStatus, useVincularDespesaTrabalho } from '../api/queries'
import { usePagarRepasse, useAtualizarRepasse } from '@/features/fotografos/api/queries'
import { RepasseInlineEditor } from '@/features/fotografos/components/RepasseInlineEditor'
import { useAuth } from '@/features/auth/AuthProvider'
import { openProtected } from '@/shared/api/protectedResource'
import { montarReciboPagamento } from '../utils/recibo'
import type { Agendamento } from '../types'
import { AGENDAMENTO_STATUS, FORMA_PAGAMENTO, FORMA_PAGAMENTO_LABELS } from '@/shared/constants'
import type { FormaPagamento } from '@/shared/constants'
import { extractErrorMessage } from '@/shared/api'
import { cn } from '@/shared/lib/cn'

interface AgendamentoFinanceiroProps {
  agendamento: Agendamento
}

interface FinanceiroRow {
  descricao: string
  valor: number
  tipo: 'positivo' | 'negativo' | 'total'
  status?: string
  formaPagamento?: FormaPagamento | null
}

const tipoPagamentoLabel: Record<string, string> = {
  ENTRADA: 'Entrada',
  FINAL: 'Final',
  EXTRA: 'Extra',
}

const statusPagamentoMap: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  PAGO: { label: 'Pago', variant: 'success' },
  PARCIAL: { label: 'Parcial', variant: 'warning' },
  PENDENTE: { label: 'Pendente', variant: 'destructive' },
}

export function AgendamentoFinanceiro({ agendamento }: AgendamentoFinanceiroProps) {
  const [showPagamento, setShowPagamento] = useState(false)
  const [showRecebimento, setShowRecebimento] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  const [showVincular, setShowVincular] = useState(false)
  const [showNovaDespesa, setShowNovaDespesa] = useState(false)
  const [reciboCopiado, setReciboCopiado] = useState(false)
  const [editandoFotografoId, setEditandoFotografoId] = useState<string | null>(null)

  const { data: pagamentos = [] } = usePagamentosList(agendamento.id)
  const { data: resumo, isLoading } = useResumoFinanceiroTrabalho(agendamento.id)
  const vincular = useVincularDespesaTrabalho()
  const { isAdmin } = useAuth()
  const pagarRepasse = usePagarRepasse()
  const atualizarRepasse = useAtualizarRepasse()
  const atualizarStatus = useUpdateAgendamentoStatus()

  const statusPagamento = resumo?.statusPagamento ?? 'PENDENTE'
  const statusInfo = statusPagamentoMap[statusPagamento] ?? statusPagamentoMap.PENDENTE

  const statusPermitePagamentoFinal =
    agendamento.status === AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL ||
    agendamento.status === AGENDAMENTO_STATUS.REALIZADO
  const podePagarFinal = statusPermitePagamentoFinal && agendamento.valorRestante > 0
  const podeEnviarParaEdicao = statusPermitePagamentoFinal && agendamento.valorRestante <= 0

  const podeAdicionarExtras =
    agendamento.status !== AGENDAMENTO_STATUS.FINALIZADO &&
    agendamento.status !== AGENDAMENTO_STATUS.CANCELADO &&
    agendamento.status !== AGENDAMENTO_STATUS.NO_SHOW

  const podeRegistrarRecebimento =
    agendamento.valorRestante > 0 &&
    agendamento.status !== AGENDAMENTO_STATUS.FINALIZADO &&
    agendamento.status !== AGENDAMENTO_STATUS.CANCELADO &&
    agendamento.status !== AGENDAMENTO_STATUS.NO_SHOW

  const ensaioFinalizado = agendamento.status === AGENDAMENTO_STATUS.FINALIZADO

  const pagamentoFinalRealizado = ([
    AGENDAMENTO_STATUS.EM_EDICAO,
    AGENDAMENTO_STATUS.FINALIZADO,
  ] as Agendamento['status'][]).includes(agendamento.status)

  const handleGerarRecibo = async () => {
    const texto = montarReciboPagamento(agendamento)
    await navigator.clipboard.writeText(texto)
    setReciboCopiado(true)
    toast.success('Recibo copiado para a área de transferência!')
    setTimeout(() => setReciboCopiado(false), 2000)
  }

  const margemVariant = (margem: number): 'success' | 'warning' | 'destructive' => {
    if (margem > 60) return 'success'
    if (margem >= 30) return 'warning'
    return 'destructive'
  }

  const handleDesvincular = (despesaId: string) => {
    vincular.mutate(
      { despesaId, agendamentoId: null },
      {
        onSuccess: () => toast.success('Despesa desvinculada do trabalho'),
        onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao desvincular despesa')),
      },
    )
  }

  const handleExport = (formato: 'csv' | 'xls') => {
    const header = ['Seção', 'Descrição', 'Categoria', 'Data', 'Valor', 'Status']
    const rows: (string | number | null | undefined)[][] = []
    rows.push(['Valor cobrado', resumo?.clienteNome ?? agendamento.clienteNome, '', '', resumo?.valorCobrado ?? 0, ''])
    rows.push(['Total recebido', '', '', '', resumo?.totalRecebido ?? 0, statusPagamento])
    rows.push(['Saldo devedor', '', '', '', resumo?.saldoDevedor ?? 0, ''])
    rows.push(['Custo total', '', '', '', resumo?.custoTotal ?? 0, ''])
    rows.push(['Lucro bruto', '', '', '', resumo?.lucroBruto ?? 0, ''])
    rows.push(['Margem (%)', '', '', '', resumo?.margemLucro ?? 0, ''])
    ;(resumo?.despesas ?? []).forEach((d) => {
      rows.push(['Despesa', d.descricao, d.categoria, d.data, d.valor, d.status])
    })
    const filename = `resumo-financeiro-${(agendamento.clienteNome ?? 'proposta').replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyyMMdd')}`
    if (formato === 'csv') {
      exportarCSV(`${filename}.csv`, header, rows)
    } else {
      exportarXLS(`${filename}.xls`, header, rows)
    }
  }

  const rows: FinanceiroRow[] = [
    {
      descricao: 'Pacote',
      valor: agendamento.valorPacote,
      tipo: 'positivo',
    },
    {
      descricao: agendamento.repassarDeslocamento ? 'Custo de Deslocamento' : 'Custo de Deslocamento (absorvido)',
      valor: agendamento.custoDeslocamento ?? 0,
      tipo: 'positivo',
    },
    {
      descricao: 'Valor Total',
      valor: agendamento.valorTotal,
      tipo: 'total',
    },
    {
      descricao: `Entrada (${agendamento.percentualEntrada}%)`,
      valor: agendamento.valorEntradaExigido,
      tipo: 'negativo',
      status: agendamento.valorEntradaPago > 0 ? 'Pago' : 'Pendente',
    },
    {
      descricao: `Restante (${100 - agendamento.percentualEntrada}%)`,
      valor: agendamento.valorTotalFinal - agendamento.valorEntradaExigido,
      tipo: 'negativo',
      status: agendamento.valorRestante > 0 ? 'A Pagar' : 'Pago',
      formaPagamento: agendamento.valorRestante <= 0 ? agendamento.formaPagamentoFinal : null,
    },
    ...(agendamento.valorExtras > 0
      ? [
          {
            descricao: 'Fotos Extras',
            valor: agendamento.valorExtras,
            tipo: 'positivo' as const,
          },
        ]
      : []),
    {
      descricao: 'Total Final',
      valor: agendamento.valorTotalFinal,
      tipo: 'total',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Detalhamento Financeiro</h3>
        <div className="flex flex-col gap-2 [&>button]:w-full sm:flex-row sm:flex-wrap sm:[&>button]:w-auto">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isLoading}>
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('xls')} disabled={isLoading}>
            <FileSpreadsheet className="mr-1 h-4 w-4" />
            XLS
          </Button>
          {podeAdicionarExtras && (
            <Button variant="outline" size="sm" onClick={() => setShowExtras(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Fotos Extras
            </Button>
          )}
          {podeRegistrarRecebimento && (
            <Button variant="outline" size="sm" onClick={() => setShowRecebimento(true)}>
              <HandCoins className="mr-1 h-4 w-4" />
              Registrar Recebimento
            </Button>
          )}
          {podePagarFinal && (
            <Button size="sm" onClick={() => setShowPagamento(true)}>
              <CreditCard className="mr-1 h-4 w-4" />
              Registrar Pagamento Final
            </Button>
          )}
          {podeEnviarParaEdicao && (
            <Button
              size="sm"
              onClick={() => atualizarStatus.mutate({ id: agendamento.id, status: AGENDAMENTO_STATUS.EM_EDICAO })}
              disabled={atualizarStatus.isPending}
            >
              <Check className="mr-1 h-4 w-4" />
              Enviar para edição
            </Button>
          )}
          {pagamentoFinalRealizado && (
            <Button variant="outline" size="sm" onClick={handleGerarRecibo}>
              {reciboCopiado ? (
                <Check className="mr-1 h-4 w-4 text-emerald-500" />
              ) : (
                <Receipt className="mr-1 h-4 w-4" />
              )}
              {reciboCopiado ? 'Copiado!' : 'Gerar Recibo'}
            </Button>
          )}
        </div>
      </div>

      <div className="hidden rounded-md border overflow-x-auto md:block">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <span
                    className={
                      row.tipo === 'total'
                        ? 'font-semibold'
                        : row.tipo === 'negativo'
                          ? 'text-muted-foreground'
                          : ''
                    }
                  >
                    {row.descricao}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {row.tipo === 'negativo' ? null : <span className="text-emerald-600">+ </span>}
                  R$ {row.valor.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {row.status && (
                      <Badge
                        variant={
                          row.status === 'Pago'
                            ? 'success'
                            : row.status === 'Pendente'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {row.status}
                      </Badge>
                    )}
                    {row.formaPagamento && (
                      <Badge
                        variant="outline"
                        className={
                          row.formaPagamento === FORMA_PAGAMENTO.DINHEIRO
                            ? 'border-amber-500/50 text-amber-600'
                            : undefined
                        }
                      >
                        {row.formaPagamento === FORMA_PAGAMENTO.DINHEIRO && (
                          <Banknote className="mr-1 h-3 w-3" />
                        )}
                        {FORMA_PAGAMENTO_LABELS[row.formaPagamento] ?? row.formaPagamento}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {rows.map((row, index) => (
          <div key={index} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
            <span
              className={cn(
                'min-w-0 break-words text-sm',
                row.tipo === 'total' && 'font-semibold',
                row.tipo === 'negativo' && 'text-muted-foreground',
              )}
            >
              {row.descricao}
            </span>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={cn(
                  'text-sm font-medium tabular-nums',
                  row.tipo === 'negativo' ? 'text-muted-foreground' : 'text-emerald-600',
                )}
              >
                {row.tipo === 'negativo' ? '' : '+ '}R$ {row.valor.toFixed(2)}
              </span>
              {(row.status || row.formaPagamento) && (
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {row.status && (
                    <Badge
                      variant={row.status === 'Pago' ? 'success' : row.status === 'Pendente' ? 'warning' : 'default'}
                    >
                      {row.status}
                    </Badge>
                  )}
                  {row.formaPagamento && (
                    <Badge
                      variant="outline"
                      className={
                        row.formaPagamento === FORMA_PAGAMENTO.DINHEIRO
                          ? 'border-amber-500/50 text-amber-600'
                          : undefined
                      }
                    >
                      {row.formaPagamento === FORMA_PAGAMENTO.DINHEIRO && <Banknote className="mr-1 h-3 w-3" />}
                      {FORMA_PAGAMENTO_LABELS[row.formaPagamento] ?? row.formaPagamento}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse h-8 w-full bg-muted rounded" />
          <div className="animate-pulse h-8 w-full bg-muted rounded" />
        </div>
      ) : (
        resumo && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Resumo do Trabalho</h4>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">Valor Cobrado</p>
                <p className="text-xl font-bold tabular-nums">{formatCurrency(resumo.valorCobrado)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Recebido</p>
                <p className="text-xl font-bold tabular-nums text-emerald-600">{formatCurrency(resumo.totalRecebido)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">Saldo Devedor</p>
                <p className="text-xl font-bold tabular-nums text-amber-600">{formatCurrency(resumo.saldoDevedor)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">Custo Total</p>
                <p className="text-xl font-bold tabular-nums text-rose-500">
                  {formatCurrency(resumo.custoTotal)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Despesas {formatCurrency(resumo.totalDespesas)} · Deslocamento {formatCurrency(resumo.custoDeslocamento)}
                  {resumo.comissao > 0 ? ` · Comissão ${formatCurrency(resumo.comissao)}` : ''}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">Lucro Bruto</p>
                <p className="text-xl font-bold tabular-nums text-emerald-600">{formatCurrency(resumo.lucroBruto)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">Margem de Lucro</p>
                <Badge variant={margemVariant(resumo.margemLucro)}>
                  {resumo.margemLucro.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </>
        )
      )}

      {resumo?.fotografos && resumo.fotografos.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Partilha dos Parceiros
            </h4>
            {resumo.valorPartilhaGlobal != null && (
              <Badge variant="outline" className="text-xs">
                Partilha Global: {formatCurrency(resumo.valorPartilhaGlobal)}
              </Badge>
            )}
          </div>

          <div className="hidden rounded-md border overflow-x-auto md:block">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead className="text-right">Custos</TableHead>
                  <TableHead className="text-right">Repasse</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumo.fotografos.map((f) => (
                  <Fragment key={f.fotografoId}>
                    <TableRow>
                      <TableCell className="font-medium">{f.fotografoNome}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(f.custos)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(f.valorRepassar)}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {f.tipoValor === 'PERCENTUAL'
                          ? `${f.percentual != null ? f.percentual : 0}%`
                          : 'R$'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            f.statusRepasse === 'PAGO'
                              ? 'success'
                              : f.statusRepasse === 'CANCELADO'
                                ? 'destructive'
                                : 'warning'
                          }
                        >
                          {f.statusRepasse === 'PAGO'
                            ? 'Pago'
                            : f.statusRepasse === 'CANCELADO'
                              ? 'Cancelado'
                              : 'Pendente'}
                        </Badge>
                        {f.dataPagamento && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(f.dataPagamento), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && f.statusRepasse === 'PENDENTE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditandoFotografoId(f.fotografoId)}
                            disabled={atualizarRepasse.isPending}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                        {isAdmin && f.statusRepasse === 'PENDENTE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagarRepasse.mutate({ agendamentoId: agendamento.id, fotografoId: f.fotografoId })}
                            disabled={pagarRepasse.isPending || !ensaioFinalizado}
                            title={!ensaioFinalizado ? 'O repasse só pode ser realizado após a finalização do ensaio' : undefined}
                          >
                            <HandCoins className="mr-1 h-4 w-4" />
                            Pagar
                          </Button>
                        )}
                        {f.statusRepasse === 'PAGO' && (
                          <span className="text-xs text-emerald-600 font-medium">Pago</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {editandoFotografoId === f.fotografoId && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <RepasseInlineEditor
                            initial={{
                              tipoValor: f.tipoValor,
                              percentual: f.percentual,
                              valorRepassar: f.valorRepassar,
                            }}
                            isSaving={atualizarRepasse.isPending}
                            onSave={(payload) =>
                              atualizarRepasse.mutate(
                                { agendamentoId: agendamento.id, fotografoId: f.fotografoId, payload },
                                { onSuccess: () => setEditandoFotografoId(null) },
                              )
                            }
                            onCancel={() => setEditandoFotografoId(null)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {resumo.fotografos.map((f) => (
              <div key={f.fotografoId} className="space-y-3 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{f.fotografoNome}</p>
                  <Badge
                    variant={
                      f.statusRepasse === 'PAGO'
                        ? 'success'
                        : f.statusRepasse === 'CANCELADO'
                          ? 'destructive'
                          : 'warning'
                    }
                  >
                    {f.statusRepasse === 'PAGO' ? 'Pago' : f.statusRepasse === 'CANCELADO' ? 'Cancelado' : 'Pendente'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Custos</span>
                    <span className="tabular-nums">{formatCurrency(f.custos)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Repasse</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(f.valorRepassar)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Tipo</span>
                    <span>{f.tipoValor === 'PERCENTUAL' ? `${f.percentual ?? 0}%` : 'R$'}</span>
                  </div>
                  {f.dataPagamento && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Pago em</span>
                      <span>{format(new Date(f.dataPagamento), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>
                {((isAdmin && f.statusRepasse === 'PENDENTE') || f.statusRepasse === 'PAGO') && (
                  <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    {isAdmin && f.statusRepasse === 'PENDENTE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditandoFotografoId(f.fotografoId)}
                        disabled={atualizarRepasse.isPending}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                    )}
                    {isAdmin && f.statusRepasse === 'PENDENTE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagarRepasse.mutate({ agendamentoId: agendamento.id, fotografoId: f.fotografoId })}
                        disabled={pagarRepasse.isPending || !ensaioFinalizado}
                        title={!ensaioFinalizado ? 'O repasse só pode ser realizado após a finalização do ensaio' : undefined}
                      >
                        <HandCoins className="mr-1 h-4 w-4" />
                        Pagar
                      </Button>
                    )}
                    {f.statusRepasse === 'PAGO' && <span className="text-xs font-medium text-emerald-600">Pago</span>}
                  </div>
                )}
                {editandoFotografoId === f.fotografoId && (
                  <RepasseInlineEditor
                    initial={{
                      tipoValor: f.tipoValor,
                      percentual: f.percentual,
                      valorRepassar: f.valorRepassar,
                    }}
                    isSaving={atualizarRepasse.isPending}
                    onSave={(payload) =>
                      atualizarRepasse.mutate(
                        { agendamentoId: agendamento.id, fotografoId: f.fotografoId, payload },
                        { onSuccess: () => setEditandoFotografoId(null) },
                      )
                    }
                    onCancel={() => setEditandoFotografoId(null)}
                  />
                )}
              </div>
            ))}
          </div>

          {resumo.custosFotografo && resumo.custosFotografo.length > 0 && (
            <div className="space-y-2">
              <h5 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                Custos dos Fotógrafos
              </h5>
              <div className="hidden rounded-md border overflow-x-auto md:block">
                <Table className="min-w-[420px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumo.custosFotografo.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.cor ?? '#888' }} />
                            {d.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(d.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-2 md:hidden">
                {resumo.custosFotografo.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">{d.descricao}</p>
                      <Badge variant="outline" className="mt-1 gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.cor ?? '#888' }} />
                        {d.categoria}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(d.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Link2 className="h-4 w-4" />
            Despesas Vinculadas
          </h4>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => setShowVincular(true)}>
              <Link2 className="mr-1 h-4 w-4" />
              Vincular existente
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowNovaDespesa(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nova despesa
            </Button>
          </div>
        </div>
        <div className="hidden rounded-md border overflow-x-auto md:block">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(resumo?.despesas ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma despesa vinculada a este trabalho.
                  </TableCell>
                </TableRow>
              )}
              {(resumo?.despesas ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.descricao}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.cor ?? '#888' }} />
                      {d.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(d.valor)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={d.status === 'PAGO' ? 'success' : d.status === 'RECORRENTE' ? 'outline' : 'warning'}>
                      {d.status === 'PAGO' ? 'Pago' : d.status === 'RECORRENTE' ? 'Recorrente' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDesvincular(d.id)} disabled={vincular.isPending}>
                      Desvincular
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2 md:hidden">
          {(resumo?.despesas ?? []).length === 0 && (
            <p className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
              Nenhuma despesa vinculada a este trabalho.
            </p>
          )}
          {(resumo?.despesas ?? []).map((d) => (
            <div key={d.id} className="space-y-2 rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">{d.descricao}</p>
                  <Badge variant="outline" className="mt-1 gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.cor ?? '#888' }} />
                    {d.categoria}
                  </Badge>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(d.valor)}</span>
                  <Badge variant={d.status === 'PAGO' ? 'success' : d.status === 'RECORRENTE' ? 'outline' : 'warning'}>
                    {d.status === 'PAGO' ? 'Pago' : d.status === 'RECORRENTE' ? 'Recorrente' : 'Pendente'}
                  </Badge>
                </div>
              </div>
              <div className="border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDesvincular(d.id)}
                  disabled={vincular.isPending}
                  className="w-full"
                >
                  Desvincular
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pagamentos.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <History className="h-4 w-4" />
            Histórico de Pagamentos
          </h4>
          <div className="hidden rounded-md border overflow-x-auto md:block">
            <Table className="min-w-[420px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Comprovante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentos.map((pag) => (
                  <TableRow key={pag.id}>
                    <TableCell className="tabular-nums">
                      {format(new Date(pag.dataPagamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      R$ {pag.valor.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {pag.tipoPagamento ? (tipoPagamentoLabel[pag.tipoPagamento] ?? pag.tipoPagamento) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {pag.formaPagamento ? (FORMA_PAGAMENTO_LABELS[pag.formaPagamento] ?? pag.formaPagamento) : '—'}
                    </TableCell>
                    <TableCell>
                      {pag.urlComprovante ? (
                        <button
                          type="button"
                          onClick={() => void openProtected(`/financeiro/pagamentos/${pag.id}/comprovante`)}
                          className="text-primary underline text-sm"
                        >
                          Visualizar
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {pagamentos.map((pag) => (
              <div key={pag.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                <div className="min-w-0">
                  <p className="text-sm tabular-nums">
                    {format(new Date(pag.dataPagamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-sm font-medium tabular-nums">R$ {pag.valor.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {pag.tipoPagamento ? (tipoPagamentoLabel[pag.tipoPagamento] ?? pag.tipoPagamento) : '—'}
                    {pag.formaPagamento ? ` · ${FORMA_PAGAMENTO_LABELS[pag.formaPagamento] ?? pag.formaPagamento}` : ''}
                  </p>
                </div>
                {pag.urlComprovante ? (
                  <button
                    type="button"
                    onClick={() => void openProtected(`/financeiro/pagamentos/${pag.id}/comprovante`)}
                    className="shrink-0 text-sm text-primary underline"
                  >
                    Visualizar
                  </button>
                ) : (
                  <span className="shrink-0 text-sm text-muted-foreground">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <RegistrarRecebimentoDialog
        open={showRecebimento}
        onOpenChange={setShowRecebimento}
        agendamento={agendamento}
      />

      <RegistrarPagamentoDialog
        open={showPagamento}
        onOpenChange={setShowPagamento}
        agendamento={agendamento}
      />

      <AdicionarExtrasDialog
        open={showExtras}
        onOpenChange={setShowExtras}
        agendamento={agendamento}
      />

      <VincularDespesaDialog
        open={showVincular}
        onOpenChange={setShowVincular}
        agendamentoId={agendamento.id}
      />

      <DespesaFormDialog
        open={showNovaDespesa}
        onOpenChange={setShowNovaDespesa}
        agendamentoFixoId={agendamento.id}
        agendamentoFixoLabel={`${agendamento.clienteNome} — ${format(new Date(agendamento.dataHoraEnsaio), 'dd/MM/yyyy', { locale: ptBR })}`}
      />
    </div>
  )
}
