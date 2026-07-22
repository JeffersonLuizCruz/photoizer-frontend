import { useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Plus, Phone, Mail, MapPin, User, Eye } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useCliente, useClienteAgendamentos } from '../api/queries'
import { DataTable } from '@/shared/components/layout/DataTable'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import type { Agendamento } from '@/features/agenda/types'

const currencyFormat = (v: number | null | undefined): string => {
  if (v == null || isNaN(v)) return 'R$ 0,00'
  return `R$ ${v.toFixed(2)}`
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'destructive' | 'default' | 'secondary' }> = {
  [AGENDAMENTO_STATUS.CONFIRMADO]: { label: 'Confirmado', variant: 'info' },
  [AGENDAMENTO_STATUS.REALIZADO]: { label: 'Realizado', variant: 'success' },
  [AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL]: { label: 'Aguardando Pagto', variant: 'warning' },
  [AGENDAMENTO_STATUS.EM_EDICAO]: { label: 'Em Edição', variant: 'warning' },
  [AGENDAMENTO_STATUS.SELECAO_DAS_FOTOS]: { label: 'Seleção de Fotos', variant: 'info' },
  [AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO]: { label: 'Fotos p/ Seleção', variant: 'info' },
  [AGENDAMENTO_STATUS.FOTOS_ENTREGUES]: { label: 'Fotos Entregues', variant: 'success' },
  [AGENDAMENTO_STATUS.FINALIZADO]: { label: 'Finalizado', variant: 'success' },
  [AGENDAMENTO_STATUS.CANCELADO]: { label: 'Cancelado', variant: 'destructive' },
  [AGENDAMENTO_STATUS.NO_SHOW]: { label: 'Não Compareceu', variant: 'destructive' },
}

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
}

function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground min-w-24">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function ResumoTab({ agendamentos, clienteNome, cliente }: { agendamentos: Agendamento[]; clienteNome: string; cliente: NonNullable<ReturnType<typeof useCliente>['data']> }) {
  const totalGasto = agendamentos.reduce((acc, a) => acc + a.valorTotalFinal, 0)
  const ensaiosRealizados = agendamentos.filter(a =>
    a.status === AGENDAMENTO_STATUS.FINALIZADO ||
    a.status === AGENDAMENTO_STATUS.FOTOS_ENTREGUES ||
    a.status === AGENDAMENTO_STATUS.REALIZADO
  ).length
  const ultimoEnsaio = agendamentos.length > 0
    ? agendamentos.reduce((latest, a) =>
        new Date(a.dataHoraEnsaio) > new Date(latest.dataHoraEnsaio) ? a : latest
      ).dataHoraEnsaio
    : null
  const saldoPendente = agendamentos.reduce((acc, a) => acc + a.saldoDevedor, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Gasto" value={currencyFormat(totalGasto)} />
        <MetricCard label="Ensaios Realizados" value={String(ensaiosRealizados)} />
        <MetricCard
          label="Último Ensaio"
          value={ultimoEnsaio ? format(new Date(ultimoEnsaio), "dd/MM/yyyy", { locale: ptBR }) : '---'}
        />
        <MetricCard label="Saldo Pendente" value={currencyFormat(saldoPendente)} />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3">Dados do Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoRow icon={User} label="Nome" value={clienteNome} />
          <InfoRow icon={Phone} label="Telefone" value={cliente.telefone} />
          <InfoRow icon={Mail} label="Email" value={cliente.email || '-'} />
          <InfoRow icon={MapPin} label="Cidade/Estado" value={cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : '-'} />
        </div>
      </div>
    </div>
  )
}

function AgendamentosTab({ agendamentos, isLoading }: { agendamentos: Agendamento[]; isLoading: boolean }) {
  const navigate = useNavigate()

  const columns: ColumnDef<Agendamento>[] = useMemo(() => [
    {
      accessorKey: 'dataHoraEnsaio',
      header: 'Data',
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {format(new Date(row.original.dataHoraEnsaio), "dd/MM/yy", { locale: ptBR })}
        </span>
      ),
    },
    {
      accessorKey: 'pacoteNome',
      header: 'Pacote',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} customLabels={statusLabels} />
      ),
    },
    {
      accessorKey: 'valorTotalFinal',
      header: 'Valor Total',
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums whitespace-nowrap">
          {currencyFormat(row.original.valorTotalFinal)}
        </span>
      ),
    },
    {
      accessorKey: 'saldoDevedor',
      header: 'Saldo Devedor',
      cell: ({ row }) => (
        <span className={`text-sm tabular-nums whitespace-nowrap ${row.original.saldoDevedor > 0 ? 'text-destructive font-medium' : ''}`}>
          {currencyFormat(row.original.saldoDevedor)}
        </span>
      ),
    },
  ], [])

  return (
    <DataTable
      columns={columns}
      data={agendamentos}
      isLoading={isLoading}
      enablePagination={false}
      enableFiltering={false}
      emptyMessage="Nenhum agendamento encontrado para este cliente"
      renderActions={(row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', row.id))}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    />
  )
}

function FinanceiroTab({ agendamentos }: { agendamentos: Agendamento[] }) {
  const navigate = useNavigate()
  const hasCancelados = agendamentos.some(a =>
    a.status === AGENDAMENTO_STATUS.CANCELADO ||
    a.status === AGENDAMENTO_STATUS.NO_SHOW
  )

  const columns: ColumnDef<Agendamento>[] = useMemo(() => [
    {
      accessorKey: 'dataHoraEnsaio',
      header: 'Data',
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {format(new Date(row.original.dataHoraEnsaio), "dd/MM/yy", { locale: ptBR })}
        </span>
      ),
    },
    {
      accessorKey: 'pacoteNome',
      header: 'Pacote',
    },
    {
      accessorKey: 'valorTotalFinal',
      header: 'Valor Total',
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums whitespace-nowrap">
          {currencyFormat(row.original.valorTotalFinal)}
        </span>
      ),
    },
    {
      accessorKey: 'valorEntradaPago',
      header: 'Entrada Paga',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums whitespace-nowrap text-emerald-600 dark:text-emerald-400">
          {currencyFormat(row.original.valorEntradaPago)}
        </span>
      ),
    },
    {
      accessorKey: 'saldoDevedor',
      header: 'Saldo Devedor',
      cell: ({ row }) => (
        <span className={`text-sm tabular-nums whitespace-nowrap ${row.original.saldoDevedor > 0 ? 'text-destructive font-medium' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {currencyFormat(row.original.saldoDevedor)}
        </span>
      ),
    },
  ], [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total em Agendamentos"
          value={currencyFormat(agendamentos.reduce((acc, a) => acc + a.valorTotalFinal, 0))}
        />
        <MetricCard
          label="Total Recebido"
          value={currencyFormat(agendamentos.reduce((acc, a) => acc + a.valorEntradaPago, 0))}
        />
        <MetricCard
          label="Saldo Devedor Total"
          value={currencyFormat(agendamentos.reduce((acc, a) => acc + a.saldoDevedor, 0))}
          subtitle={hasCancelados ? 'Inclui agendamentos cancelados' : undefined}
        />
        <MetricCard
          label="Total em Extras"
          value={currencyFormat(agendamentos.reduce((acc, a) => acc + a.valorExtras, 0))}
        />
      </div>

      <DataTable
        columns={columns}
        data={agendamentos}
        enablePagination={false}
        enableFiltering={false}
        emptyMessage="Nenhum registro financeiro encontrado"
        renderActions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', row.id))}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />
    </div>
  )
}

export function ClienteDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: cliente, isLoading: isLoadingCliente } = useCliente(id)
  const { data: agendamentos, isLoading: isLoadingAgendamentos } = useClienteAgendamentos(id)

  const handleNovoAgendamento = useCallback(() => {
    navigate(`${ROUTES.AGENDA_NOVO}?clienteId=${id}`)
  }, [navigate, id])

  if (isLoadingCliente) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Cliente não encontrado</p>
      </div>
    )
  }

  return (
    <>
      <PageTitle
        title={cliente.nome}
        description="Detalhes do cliente"
        breadcrumbs={[
          { label: 'Clientes', href: ROUTES.CLIENTES },
          { label: cliente.nome },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.CLIENTES)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={handleNovoAgendamento}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <ResumoTab
            agendamentos={agendamentos ?? []}
            clienteNome={cliente.nome}
            cliente={cliente}
          />
        </TabsContent>

        <TabsContent value="agendamentos">
          <AgendamentosTab
            agendamentos={agendamentos ?? []}
            isLoading={isLoadingAgendamentos}
          />
        </TabsContent>

        <TabsContent value="financeiro">
          <FinanceiroTab agendamentos={agendamentos ?? []} />
        </TabsContent>
      </Tabs>
    </>
  )
}
