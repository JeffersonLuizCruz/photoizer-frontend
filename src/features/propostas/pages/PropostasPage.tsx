import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { isAxiosError } from 'axios'
import {
  Plus,
  Loader2,
  Copy,
  ExternalLink,
  ThumbsUp,
  CheckCircle2,
  FileSignature,
  Eye,
  FileDown,
  XCircle,
  MoreVertical,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { ListToolbar, FilterSheet, MobileListCard } from '@/shared/components/mobile'
import { openProtected } from '@/shared/api/protectedResource'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import { formatCurrency } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  usePropostasList,
  useConfirmarPagamentoProposta,
  useAprovarProposta,
  useRecusarProposta,
} from '../api/queries'
import type { Proposta } from '../types'

type StatusVariant = 'warning' | 'info' | 'success'

const statusInfo: Record<string, { label: string; variant: StatusVariant }> = {
  [AGENDAMENTO_STATUS.PRE_RESERVA]: { label: 'Aguardando assinatura', variant: 'warning' },
  [AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO]: { label: 'Aguardando aprovação', variant: 'info' },
  [AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO]: { label: 'Pagamento confirmado', variant: 'info' },
}

const fases: Array<{ status: string; label: string; variant: StatusVariant }> = [
  { status: AGENDAMENTO_STATUS.PRE_RESERVA, label: 'Aguardando assinatura', variant: 'warning' },
  { status: AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO, label: 'Aguardando aprovação', variant: 'info' },
  { status: AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO, label: 'Pagamento confirmado', variant: 'success' },
]

export function PropostasPage() {
  const navigate = useNavigate()
  const { papel } = useAuth()
  const podeDecidir = papel === 'ADMIN' || papel === 'FOTOGRAFO'
  const { data: propostas = [], isLoading } = usePropostasList()
  const confirmar = useConfirmarPagamentoProposta()
  const aprovar = useAprovarProposta()
  const recusar = useRecusarProposta()

  const [busca, setBusca] = useState('')
  const [faseAtiva, setFaseAtiva] = useState<string>('TODAS')
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [acaoProposta, setAcaoProposta] = useState<Proposta | null>(null)
  const [fasesAbertas, setFasesAbertas] = useState<Record<string, boolean>>({
    [AGENDAMENTO_STATUS.PRE_RESERVA]: true,
    [AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO]: true,
    [AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO]: true,
  })
  const [recusa, setRecusa] = useState<{ id: string; cliente: string } | null>(null)
  const [motivo, setMotivo] = useState('')

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

  const abrirComprovante = (p: Proposta) =>
    openProtected(`/documentos/comprovantes/${p.id}/entrada`).catch(() =>
      toast.error('Erro ao abrir o comprovante'),
    )

  const abrirTermo = (p: Proposta) =>
    openProtected(`/agendamentos/${p.id}/termo`).catch(() => toast.error('Erro ao abrir o termo'))

  const abrirRecusa = (p: Proposta) => {
    setMotivo('')
    setRecusa({ id: p.id, cliente: p.clienteNome ?? 'esta proposta' })
    setAcaoProposta(null)
  }

  const confirmarRecusa = () => {
    if (!recusa) return
    const texto = motivo.trim()
    if (texto.length < 3) {
      toast.error('Informe o motivo da recusa')
      return
    }
    recusar.mutate({ id: recusa.id, motivo: texto }, { onSuccess: () => setRecusa(null) })
  }

  const concluirAcao = (acao: (id: string, options?: { onSuccess?: () => void }) => void) => {
    if (!acaoProposta) return
    acao(acaoProposta.id, { onSuccess: () => setAcaoProposta(null) })
  }

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return propostas.filter((p) => {
      if (faseAtiva !== 'TODAS' && p.status !== faseAtiva) return false
      if (!termo) return true
      return (
        (p.clienteNome ?? '').toLowerCase().includes(termo) ||
        p.pacoteNome.toLowerCase().includes(termo)
      )
    })
  }, [propostas, busca, faseAtiva])

  const porFase = useMemo(
    () =>
      fases
        .map((fase) => ({ ...fase, itens: filtradas.filter((p) => p.status === fase.status) }))
        .filter((fase) => faseAtiva === 'TODAS' || faseAtiva === fase.status),
    [filtradas, faseAtiva],
  )

  const filtrosAtivos = faseAtiva === 'TODAS' ? 0 : 1

  const renderAcoes = (p: Proposta, className = 'justify-start') => {
    const link = linkDe(p)
    const emAnalise =
      p.status === AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO ||
      p.status === AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', p.id))}>
          Detalhes
        </Button>
        {podeDecidir && emAnalise && p.temComprovanteEntrada && (
          <Button variant="outline" size="sm" onClick={() => abrirComprovante(p)}>
            <Eye className="mr-1 h-4 w-4" />
            Ver comprovante
          </Button>
        )}
        {p.temTermoAssinado && (
          <Button variant="outline" size="sm" onClick={() => abrirTermo(p)}>
            <FileDown className="mr-1 h-4 w-4" />
            Ver termo
          </Button>
        )}
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
        {podeDecidir && p.status === AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO && (
          <Button size="sm" onClick={() => confirmar.mutate(p.id)} disabled={confirmar.isPending}>
            <ThumbsUp className="mr-1 h-4 w-4" />
            Confirmar pagamento
          </Button>
        )}
        {podeDecidir && p.status === AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO && (
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
        {podeDecidir && emAnalise && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => abrirRecusa(p)}
          >
            <XCircle className="mr-1 h-4 w-4" />
            Recusar
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
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

      <ListToolbar
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar por cliente ou pacote"
        onOpenFilters={() => setFiltrosOpen(true)}
        activeFilterCount={filtrosAtivos}
      />

      <FilterSheet
        open={filtrosOpen}
        onOpenChange={setFiltrosOpen}
        title="Filtrar propostas"
        description="Selecione a fase do funil"
        onApply={() => setFiltrosOpen(false)}
        onClear={() => setFaseAtiva('TODAS')}
      >
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={faseAtiva === 'TODAS' ? 'default' : 'outline'}
            className="justify-start"
            onClick={() => setFaseAtiva('TODAS')}
          >
            Todas as fases
          </Button>
          {fases.map((fase) => (
            <Button
              key={fase.status}
              type="button"
              variant={faseAtiva === fase.status ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setFaseAtiva(fase.status)}
            >
              {fase.label}
            </Button>
          ))}
        </div>
      </FilterSheet>

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
      ) : filtradas.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <h3 className="text-base font-semibold">Nenhuma proposta encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">Ajuste a busca ou os filtros.</p>
        </div>
      ) : (
        <>
          {/* Mobile: pipeline agrupado por fase */}
          <div className="space-y-5 md:hidden">
            {porFase.map((fase) => (
              <section key={fase.status} aria-label={fase.label}>
                <button
                  type="button"
                  onClick={() =>
                    setFasesAbertas((prev) => ({ ...prev, [fase.status]: !prev[fase.status] }))
                  }
                  aria-expanded={!!fasesAbertas[fase.status]}
                  className="flex w-full items-center gap-2 rounded-lg py-2 text-left"
                >
                  <span className="text-sm font-semibold">{fase.label}</span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                    {fase.itens.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      fasesAbertas[fase.status] && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                </button>

                {fasesAbertas[fase.status] && (
                  <div className="mt-1 space-y-3">
                    {fase.itens.length === 0 ? (
                      <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                        Nenhuma proposta nesta fase
                      </p>
                    ) : (
                      fase.itens.map((p) => (
                        <MobileListCard
                          key={p.id}
                          onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', p.id))}
                          title={p.clienteNome ?? '—'}
                          subtitle={p.pacoteNome}
                          trailing={<Badge variant={fase.variant}>{statusInfo[p.status]?.label ?? p.status}</Badge>}
                          meta={
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="text-muted-foreground">
                                {format(new Date(p.dataHoraEnsaio), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              <span className="font-semibold tabular-nums">{formatCurrency(p.valorTotal)}</span>
                            </div>
                          }
                          actions={
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', p.id))}
                              >
                                <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
                                Detalhes
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Mais ações para ${p.clienteNome ?? 'proposta'}`}
                                onClick={() => setAcaoProposta(p)}
                              >
                                <MoreVertical className="h-5 w-5" aria-hidden="true" />
                              </Button>
                            </>
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden overflow-x-auto rounded-md border md:block">
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
                {filtradas.map((p) => {
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
                        {p.dataEnvioProposta && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Enviada em {format(new Date(p.dataEnvioProposta), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        )}
                        {p.dataAssinatura && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Assinada em {format(new Date(p.dataAssinatura), "dd/MM/yyyy 'às' HH:mm")}
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
        </>
      )}

      <Sheet open={!!acaoProposta} onOpenChange={(open) => !open && setAcaoProposta(null)}>
        <SheetContent className="gap-0 p-0">
          <SheetHeader className="border-b px-6 pb-4 pr-14 pt-5 text-left">
            <SheetTitle>Ações da proposta</SheetTitle>
            <SheetDescription>{acaoProposta?.clienteNome ?? 'Proposta'}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-6 py-4">
            {acaoProposta && (
              <>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    navigate(ROUTES.AGENDA_DETALHES.replace(':id', acaoProposta.id))
                    setAcaoProposta(null)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                  Ver detalhes
                </Button>
                {podeDecidir && acaoProposta.temComprovanteEntrada && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      abrirComprovante(acaoProposta)
                      setAcaoProposta(null)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                    Ver comprovante
                  </Button>
                )}
                {acaoProposta.temTermoAssinado && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      abrirTermo(acaoProposta)
                      setAcaoProposta(null)
                    }}
                  >
                    <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
                    Ver termo assinado
                  </Button>
                )}
                {linkDe(acaoProposta) && (
                  <>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        void copiarLink(acaoProposta)
                        setAcaoProposta(null)
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                      Copiar link da proposta
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => window.open(linkDe(acaoProposta)!, '_blank', 'noopener')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                      Abrir link
                    </Button>
                  </>
                )}
                {podeDecidir && acaoProposta.status === AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO && (
                  <Button
                    className="justify-start"
                    disabled={confirmar.isPending}
                    onClick={() => concluirAcao(confirmar.mutate)}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" aria-hidden="true" />
                    Confirmar pagamento
                  </Button>
                )}
                {podeDecidir && acaoProposta.status === AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO && (
                  <Button
                    className="justify-start"
                    disabled={aprovar.isPending}
                    onClick={() => concluirAcao(aprovar.mutate)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Aprovar proposta
                  </Button>
                )}
                {podeDecidir &&
                  (acaoProposta.status === AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO ||
                    acaoProposta.status === AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO) && (
                    <Button
                      variant="outline"
                      className="justify-start text-destructive hover:text-destructive"
                      onClick={() => abrirRecusa(acaoProposta)}
                    >
                      <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                      Recusar proposta
                    </Button>
                  )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!recusa} onOpenChange={(open) => !open && setRecusa(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar proposta</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa de {recusa?.cliente}. O motivo ficará registrado no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-recusa">Motivo da recusa</Label>
            <Textarea
              id="motivo-recusa"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Ex.: comprovante ilegível, valor divergente, pagamento não identificado..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecusa(null)} disabled={recusar.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarRecusa} disabled={recusar.isPending}>
              {recusar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
              Confirmar recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
