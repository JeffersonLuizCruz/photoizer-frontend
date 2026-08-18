import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ClipboardCopy,
  Copy,
  Download,
  FileSignature,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { ROUTES, CONTRATO_STATUS } from '@/shared/constants'
import { formatCurrency, formatDateBR } from '@/shared/lib/format'
import {
  useContrato,
  usePublicarContrato,
  useConfirmarPagamento,
  useAprovarContrato,
  useDevolverContrato,
  useCancelarContrato,
  useUsuariosOptions,
} from '../api/queries'
import { contratoService, baixarBlob } from '../services/contrato.service'
import { STATUS_LABEL, STATUS_COR } from './status'

export function ContratoDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: contrato, isLoading, refetch } = useContrato(id!)
  const { data: usuarios = [] } = useUsuariosOptions()
  const publicar = usePublicarContrato()
  const confirmarPagamento = useConfirmarPagamento()
  const aprovar = useAprovarContrato()
  const devolver = useDevolverContrato()
  const cancelar = useCancelarContrato()
  const [dialogDevolver, setDialogDevolver] = useState(false)
  const [tipoMotivo, setTipoMotivo] = useState('comprovante_invalido')
  const [motivo, setMotivo] = useState('')

  if (isLoading) return <PageLoading />

  if (!contrato) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Contrato não encontrado.</p>
      </div>
    )
  }

  const linkPublico = contrato.token
    ? `${window.location.origin}${ROUTES.CONTRATO_PUBLICO.replace(':token', contrato.token)}`
    : null

  const handleCopiarLink = () => {
    if (!linkPublico) return
    navigator.clipboard.writeText(linkPublico)
    toast.success('Link copiado para a área de transferência')
  }

  const handlePublicar = async () => {
    const res = await publicar.mutateAsync(contrato.id)
    if (res?.url) {
      const link = `${window.location.origin}${res.url}`
      navigator.clipboard.writeText(link)
      toast.success('Link copiado! Envie ao cliente.')
    }
    refetch()
  }

  const handleConfirmarPagamento = async () => {
    await confirmarPagamento.mutateAsync(contrato.id)
    refetch()
  }

  const handleAprovar = async () => {
    await aprovar.mutateAsync(contrato.id)
    refetch()
  }

  const handleDevolver = async () => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo da devolução')
      return
    }
    await devolver.mutateAsync({ id: contrato.id, payload: { tipoMotivo, motivo } })
    setDialogDevolver(false)
    setMotivo('')
    refetch()
  }

  const handleCancelar = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar este contrato?')) return
    await cancelar.mutateAsync(contrato.id)
    refetch()
  }

  const handleDownloadPdf = async () => {
    try {
      const blob = await contratoService.baixarArquivo(contrato.id, 'pdf')
      baixarBlob(blob, `contrato_${contrato.id}.pdf`)
    } catch {
      toast.error('Erro ao baixar PDF')
    }
  }

  const handleDownloadComprovante = async () => {
    try {
      const blob = await contratoService.baixarArquivo(contrato.id, 'comprovante')
      const ext = blob.type.includes('pdf') ? '.pdf' : '.jpg'
      baixarBlob(blob, `comprovante_${contrato.id}${ext}`)
    } catch {
      toast.error('Erro ao baixar comprovante')
    }
  }

  const podePublicar = contrato.status === CONTRATO_STATUS.RASCUNHO
  const podeConfirmar = contrato.status === CONTRATO_STATUS.ASSINADO_PELO_CLIENTE
  const podeAprovar = contrato.status === CONTRATO_STATUS.PAGAMENTO_CONFIRMADO
  const podeDevolver = contrato.status === CONTRATO_STATUS.ASSINADO_PELO_CLIENTE || contrato.status === CONTRATO_STATUS.PAGAMENTO_CONFIRMADO
  const podeCancelar = contrato.status !== CONTRATO_STATUS.APROVADO && contrato.status !== CONTRATO_STATUS.CANCELADO
  const podeBaixarPdf = !!contrato.urlPdf && contrato.status !== CONTRATO_STATUS.RASCUNHO

  const editorNome = usuarios.find((u) => u.id === contrato.editorId)?.nome || '—'

  return (
    <div className="p-6">
      <PageTitle
        title="Detalhes do Contrato"
        breadcrumbs={[
          { label: 'Contratos', href: ROUTES.CONTRATOS },
          { label: contrato.clienteNome || `Contrato #${contrato.id.slice(0, 8)}` },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {podePublicar && (
              <Button onClick={handlePublicar} disabled={publicar.isPending}>
                {publicar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileSignature className="mr-1 h-4 w-4" />}
                Publicar
              </Button>
            )}
            {linkPublico && (
              <Button variant="outline" onClick={handleCopiarLink}>
                <Copy className="mr-1 h-4 w-4" />
                Copiar link
              </Button>
            )}
            {podeConfirmar && (
              <Button onClick={handleConfirmarPagamento} disabled={confirmarPagamento.isPending}>
                <ThumbsUp className="mr-1 h-4 w-4" />
                Confirmar Pagamento
              </Button>
            )}
            {podeAprovar && (
              <Button onClick={handleAprovar} disabled={aprovar.isPending}>
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Aprovar
              </Button>
            )}
            {podeDevolver && (
              <Dialog open={dialogDevolver} onOpenChange={setDialogDevolver}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <ThumbsDown className="mr-1 h-4 w-4" />
                    Devolver
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Devolver contrato ao cliente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Motivo</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        value={tipoMotivo}
                        onChange={(e) => setTipoMotivo(e.target.value)}
                      >
                        <option value="comprovante_invalido">Comprovante inválido</option>
                        <option value="corrigir_termos">Corrigir termos do contrato</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <Label>Descrição do motivo</Label>
                      <Textarea
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        rows={3}
                        placeholder="Explique ao cliente o que precisa ser corrigido"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDialogDevolver(false)}>Cancelar</Button>
                      <Button variant="destructive" onClick={handleDevolver} disabled={devolver.isPending}>
                        Devolver
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {podeCancelar && (
              <Button variant="ghost" onClick={handleCancelar} disabled={cancelar.isPending}>
                <XCircle className="mr-1 h-4 w-4" />
                Cancelar
              </Button>
            )}
            {podeBaixarPdf && (
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="mr-1 h-4 w-4" />
                PDF
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {contrato.clienteNome && (
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h2 className="font-semibold">Dados do Cliente</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Nome" value={contrato.clienteNome} />
                <Info label="Telefone" value={contrato.clienteTelefone || '—'} />
                <Info label="Email" value={contrato.clienteEmail || '—'} />
                <Info label="CPF" value={contrato.clienteCpf || '—'} />
                <Info label="Cidade / Estado" value={`${contrato.clienteCidade || ''} / ${contrato.clienteEstado || ''}`} />
                <Info label="Uso de imagem" value={contrato.autorizaUsoImagem === true ? 'Autorizado' : contrato.autorizaUsoImagem === false ? 'Não autorizado' : '—'} />
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h2 className="font-semibold">Dados do Ensaio</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Data / Hora" value={`${formatDateBR(contrato.dataHoraEnsaio)} ${new Date(contrato.dataHoraEnsaio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`} />
              <Info label="Local" value={contrato.localEnsaio} />
              <Info label="Endereço" value={contrato.enderecoCompleto || '—'} />
              <Info label="Pacote" value={contrato.pacoteNome} />
              <Info label="Editor" value={editorNome} />
              <Info label="Duração" value={`${contrato.duracaoMinutos} min`} />
            </div>
            {contrato.fotografos && contrato.fotografos.length > 0 && (
              <div className="border-t pt-3">
                <p className="mb-2 text-sm font-medium">Equipe de parceiros</p>
                <ul className="space-y-1.5">
                  {contrato.fotografos.map((f) => (
                    <li key={f.fotografoId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{f.fotografoNome}</span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        {f.papelParceiro && <span>{f.papelParceiro}</span>}
                        <span>
                          {f.tipoValor === 'PERCENTUAL'
                            ? `${f.percentual}% do repasse`
                            : formatCurrency(f.valorRepassar || 0)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h2 className="font-semibold">Valores</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Valor total" value={formatCurrency(contrato.valorTotal)} />
              <Info label={`Entrada (${contrato.percentualEntrada}%)`} value={formatCurrency(contrato.valorEntradaExigido)} />
              <Info label="Restante" value={formatCurrency(contrato.valorRestante)} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h2 className="font-semibold">Status</h2>
            <Badge className={STATUS_COR[contrato.status]}>{STATUS_LABEL[contrato.status]}</Badge>
            {contrato.status === CONTRATO_STATUS.DEVOLVIDO && contrato.motivoDevolucao && (
              <div className="mt-2 rounded-md bg-orange-50 p-3 text-sm text-orange-800">
                <p className="font-medium">Motivo da devolução</p>
                <p className="mt-1">{contrato.motivoDevolucao}</p>
              </div>
            )}
            {contrato.agendamentoId && (
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', contrato.agendamentoId!))}
              >
                Ver agendamento →
              </Button>
            )}
          </div>

          {contrato.urlComprovanteEntrada && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="font-semibold">Comprovante de entrada</h2>
              <Button variant="outline" size="sm" onClick={handleDownloadComprovante}>
                <Download className="mr-1 h-4 w-4" />
                Baixar comprovante
              </Button>
            </div>
          )}

          {contrato.indicadorNome && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="font-semibold">Indicação</h2>
              <p className="text-sm">
                Indicado por: <strong>{contrato.indicadorNome}</strong>
              </p>
              {contrato.indicadorTelefone && <p className="text-sm text-muted-foreground">Telefone: {contrato.indicadorTelefone}</p>}
            </div>
          )}


          {linkPublico && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="font-semibold">Link público</h2>
              <div className="flex items-center gap-2">
                <Input value={linkPublico} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopiarLink}>
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}