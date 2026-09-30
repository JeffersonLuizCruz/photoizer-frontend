import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { isAxiosError } from 'axios'
import { Plus, Loader2, Copy, ExternalLink, ThumbsUp, CheckCircle2, FileSignature } from 'lucide-react'
import { toast } from 'sonner'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import { formatCurrency } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import {
  usePropostasList,
  useConfirmarPagamentoProposta,
  useAprovarProposta,
} from '../api/queries'
import type { Proposta } from '../types'

const statusInfo: Record<string, { label: string; variant: 'warning' | 'info' | 'success' }> = {
  [AGENDAMENTO_STATUS.PRE_RESERVA]: { label: 'Aguardando assinatura', variant: 'warning' },
  [AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO]: { label: 'Aguardando aprovação', variant: 'info' },
  [AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO]: { label: 'Pagamento confirmado', variant: 'info' },
}

export function PropostasPage() {
  const navigate = useNavigate()
  const { data: propostas = [], isLoading } = usePropostasList()
  const confirmar = useConfirmarPagamentoProposta()
  const aprovar = useAprovarProposta()

  const linkDe = (p: Proposta) =>
    p.tokenProposta ? `${window.location.origin}${ROUTES.PROPOSTA_PUBLICA.replace(':token', p.tokenProposta)}` : null

  const copiarLink = async (p: Proposta) => {
    const link = linkDe(p)
    if (!link) {
      toast.error('Esta proposta não possui link ativo')
      return
    }
    await navigator.clipboard.writeText(link)
    toast.success('Link copiado para a área de transferência')
  }

  const renderAcoes = (p: Proposta, className = 'justify-start') => {
    const link = linkDe(p)
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', p.id))}
        >
          Detalhes
        </Button>
        {link && (
          <>
            <Button variant="outline" size="sm" onClick={() => copiarLink(p)}>
              <Copy className="mr-1 h-4 w-4" />
              Copiar link
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(link, '_blank', 'noopener')}>
              <ExternalLink className="mr-1 h-4 w-4" />
              Abrir
            </Button>
          </>
        )}
        {p.status === AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO && (
          <Button size="sm" onClick={() => confirmar.mutate(p.id)} disabled={confirmar.isPending}>
            <ThumbsUp className="mr-1 h-4 w-4" />
            Confirmar pagamento
          </Button>
        )}
        {p.status === AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO && (
          <Button
            size="sm"
            onClick={() =>
              aprovar.mutate(p.id, {
                onError: (error) => {
                  if (isAxiosError(error) && error.response?.status === 409) {
                    toast.error('Conflito de agenda ao aprovar.', {
                      action: {
                        label: 'Abrir detalhes',
                        onClick: () => navigate(ROUTES.AGENDA_DETALHES.replace(':id', p.id)),
                      },
                    })
                  }
                },
              })
            }
            disabled={aprovar.isPending}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Aprovar
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Propostas"
        description="Pré-reservas aguardando assinatura, confirmação de pagamento e aprovação"
        breadcrumbs={[{ label: 'Propostas' }]}
        actions={
          <Button onClick={() => navigate(ROUTES.PROPOSTAS_NOVO)}>
            <Plus className="mr-1 h-4 w-4" />
            Nova Proposta
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : propostas.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <FileSignature className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma proposta em andamento</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie uma proposta a partir de uma data e envie o link para o cliente.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden rounded-md border overflow-x-auto md:block">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Pacote</TableHead>
                <TableHead>Ensaio</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propostas.map((p) => {
                const info = statusInfo[p.status] ?? { label: p.status, variant: 'warning' as const }
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.clienteNome ?? '—'}</TableCell>
                    <TableCell>{p.pacoteNome}</TableCell>
                    <TableCell>
                      {format(new Date(p.dataHoraEnsaio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.valorTotal)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={info.variant}>{info.label}</Badge>
                      {p.dataAssinatura && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Assinado em {format(new Date(p.dataAssinatura), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{renderAcoes(p, 'justify-end')}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 md:hidden">
          {propostas.map((p) => {
            const info = statusInfo[p.status] ?? { label: p.status, variant: 'warning' as const }
            return (
              <div key={p.id} className="space-y-3 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.clienteNome ?? '—'}</p>
                    <p className="truncate text-sm text-muted-foreground">{p.pacoteNome}</p>
                  </div>
                  <Badge variant={info.variant}>{info.label}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {format(new Date(p.dataHoraEnsaio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(p.valorTotal)}</span>
                </div>
                {p.dataAssinatura && (
                  <p className="text-xs text-muted-foreground">
                    Assinado em {format(new Date(p.dataAssinatura), 'dd/MM/yyyy')}
                  </p>
                )}
                {renderAcoes(p)}
              </div>
            )
          })}
        </div>
        </>
      )}
    </div>
  )
}
