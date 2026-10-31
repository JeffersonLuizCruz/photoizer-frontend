import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import { extractErrorMessage } from '@/shared/api'
import { ecommerceService } from '../services/ecommerce.service'
import type { LeadPacoteResponse, StatusLead } from '../types/ecommerce.types'
import { cn } from '@/shared/lib/cn'

const STATUS_LABEL: Record<StatusLead, string> = {
  NOVO: 'Novo',
  CONTATADO: 'Contatado',
  CONVERTIDO: 'Convertido',
  DESCARTADO: 'Descartado',
}

const STATUS_CLASS: Record<StatusLead, string> = {
  NOVO: 'bg-amber-100 text-amber-700',
  CONTATADO: 'bg-sky-100 text-sky-700',
  CONVERTIDO: 'bg-emerald-100 text-emerald-700',
  DESCARTADO: 'bg-slate-100 text-slate-600',
}

const formatBRL = (value: number | null | undefined) =>
  (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function AdminLeadsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<StatusLead | ''>('')
  const [page, setPage] = useState(1)

  const queryKey = ['admin-leads', status, page]
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => ecommerceService.adminListarLeads({
      status: status || undefined,
      page,
      perPage: 20,
    }),
  })

  const atualizar = useMutation({
    mutationFn: ({ id, novoStatus }: { id: string; novoStatus: StatusLead }) =>
      ecommerceService.adminAtualizarLeadStatus(id, novoStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
      toast.success('Status do lead atualizado')
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err, 'Erro ao atualizar o lead')),
  })

  const leads: LeadPacoteResponse[] = data?.data ?? []

  return (
    <div className="space-y-5">
      <PageTitle
        title="Leads de pacotes"
        description="Solicitações de contato enviadas pelo catálogo público de pacotes"
        breadcrumbs={[{ label: 'Pacotes', href: ROUTES.PACOTES }, { label: 'Leads' }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={cn('mr-1 h-4 w-4', isFetching && 'animate-spin')} />
            Atualizar
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(['', 'NOVO', 'CONTATADO', 'CONVERTIDO', 'DESCARTADO'] as const).map((opcao) => (
          <button
            key={opcao || 'todos'}
            type="button"
            onClick={() => { setStatus(opcao as StatusLead | ''); setPage(1) }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              status === opcao
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {opcao ? STATUS_LABEL[opcao as StatusLead] : 'Todos'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border bg-card py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border bg-card px-4 py-12 text-center">
          <p className="text-sm font-medium">Não foi possível carregar os leads</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {extractErrorMessage(error, 'Tente novamente em instantes.')}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center text-muted-foreground">
          <UserPlus className="mb-2 h-8 w-8" />
          <p className="text-sm font-medium">Nenhum lead encontrado</p>
          <p className="mt-1 text-xs">
            As solicitações feitas no catálogo público aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {leads.map((lead) => (
            <article key={lead.id} className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{lead.nome}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lead.telefone}{lead.email ? ` · ${lead.email}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', STATUS_CLASS[lead.status])}>
                  {STATUS_LABEL[lead.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Pacote</span>
                  <span className="truncate text-right font-medium">{lead.pacoteNome}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Extras</span>
                  <span className="font-medium">{lead.quantidadeExtras}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="font-medium">{lead.opcaoEntrega}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span className="font-medium">{lead.formaPagamento}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Estimativa</span>
                  <span className="font-medium">
                    {formatBRL((lead.valorBase ?? 0) + (lead.precoFotoExtra ?? 0) * lead.quantidadeExtras)}
                  </span>
                </div>
              </div>

              {lead.observacao && (
                <p className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                  {lead.observacao}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <span className="text-xs text-muted-foreground">Status:</span>
                <select
                  value={lead.status}
                  disabled={atualizar.isPending}
                  onChange={(e) => atualizar.mutate({ id: lead.id, novoStatus: e.target.value as StatusLead })}
                  className="h-9 rounded-md border bg-background px-2 text-xs"
                >
                  {(Object.keys(STATUS_LABEL) as StatusLead[]).map((opcao) => (
                    <option key={opcao} value={opcao}>{STATUS_LABEL[opcao]}</option>
                  ))}
                </select>
                <a
                  href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs font-medium text-primary hover:underline"
                >
                  WhatsApp
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Página {data.page} de {data.totalPages} · {data.total} lead(s)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
