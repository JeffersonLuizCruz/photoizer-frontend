import { useState } from 'react'
import { Plus, CreditCard, Receipt, Check, History } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { RegistrarPagamentoDialog } from './RegistrarPagamentoDialog'
import { AdicionarExtrasDialog } from './AdicionarExtrasDialog'
import { usePagamentosList } from '../api/queries'
import { montarReciboPagamento } from '../utils/recibo'
import type { Agendamento } from '../types'
import { AGENDAMENTO_STATUS } from '@/shared/constants'

interface AgendamentoFinanceiroProps {
  agendamento: Agendamento
}

interface FinanceiroRow {
  descricao: string
  valor: number
  tipo: 'positivo' | 'negativo' | 'total'
  status?: string
}

export function AgendamentoFinanceiro({ agendamento }: AgendamentoFinanceiroProps) {
  const [showPagamento, setShowPagamento] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  const [reciboCopiado, setReciboCopiado] = useState(false)
  const { data: pagamentos = [] } = usePagamentosList(agendamento.id)

  const podePagarFinal =
    agendamento.status === AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL ||
    agendamento.status === AGENDAMENTO_STATUS.REALIZADO

  const podeAdicionarExtras =
    agendamento.status !== AGENDAMENTO_STATUS.FINALIZADO &&
    agendamento.status !== AGENDAMENTO_STATUS.CANCELADO &&
    agendamento.status !== AGENDAMENTO_STATUS.NO_SHOW

  const pagamentoFinalRealizado = ([
    AGENDAMENTO_STATUS.EM_EDICAO,
    AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO,
    AGENDAMENTO_STATUS.FOTOS_ENTREGUES,
    AGENDAMENTO_STATUS.FINALIZADO,
  ] as Agendamento['status'][]).includes(agendamento.status)

  const handleGerarRecibo = async () => {
    const texto = montarReciboPagamento(agendamento)
    await navigator.clipboard.writeText(texto)
    setReciboCopiado(true)
    toast.success('Recibo copiado para a área de transferência!')
    setTimeout(() => setReciboCopiado(false), 2000)
  }

  const rows: FinanceiroRow[] = [
    {
      descricao: 'Pacote',
      valor: agendamento.valorPacote,
      tipo: 'positivo',
    },
    {
      descricao: 'Taxa de Deslocamento',
      valor: agendamento.taxaDeslocamento,
      tipo: 'positivo',
    },
    {
      descricao: 'Valor Total',
      valor: agendamento.valorTotal,
      tipo: 'total',
    },
    {
      descricao: 'Entrada (30%)',
      valor: agendamento.valorEntradaExigido,
      tipo: 'negativo',
      status: agendamento.valorEntradaPago > 0 ? 'Pago' : 'Pendente',
    },
    {
      descricao: 'Restante (70%)',
      valor: agendamento.valorRestante,
      tipo: 'negativo',
      status: 'A Pagar',
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Detalhamento Financeiro</h3>
        <div className="flex gap-2">
          {podeAdicionarExtras && (
            <Button variant="outline" size="sm" onClick={() => setShowExtras(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Fotos Extras
            </Button>
          )}
          {podePagarFinal && (
            <Button size="sm" onClick={() => setShowPagamento(true)}>
              <CreditCard className="mr-1 h-4 w-4" />
              Registrar Pagamento Final
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

      <div className="rounded-md border">
        <Table>
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
                  {row.tipo === 'negativo' ? null : <span className="text-emerald-600 dark:text-emerald-400">+ </span>}
                  R$ {row.valor.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total do Pacote</p>
          <p className="text-xl font-bold">R$ {agendamento.valorTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor Pago</p>
          <p className="text-xl font-bold text-emerald-600">
            R$ {agendamento.valorEntradaPago.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Saldo Restante</p>
          <p className="text-xl font-bold text-amber-600">
            R$ {agendamento.saldoDevedor.toFixed(2)}
          </p>
        </div>
      </div>

      {pagamentos.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <History className="h-4 w-4" />
            Histórico de Pagamentos
          </h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
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
                    <TableCell>
                      {pag.urlComprovante ? (
                        <a
                          href={pag.urlComprovante}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline text-sm"
                        >
                          Visualizar
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

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
    </div>
  )
}
