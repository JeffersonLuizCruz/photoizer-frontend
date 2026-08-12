import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSignature, Search } from 'lucide-react'
import { format } from 'date-fns'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { EmptyState } from '@/shared/components/layout/EmptyState'
import { PageLoading } from '@/shared/components/layout/Loading'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { ROUTES, CONTRATO_STATUS } from '@/shared/constants'
import type { ContratoStatus } from '@/shared/constants'
import { formatCurrency, formatDateBR } from '@/shared/lib/format'
import { useContratosList } from '../api/queries'
import { STATUS_LABEL } from './status'

const STATUS_OPTIONS = Object.entries(CONTRATO_STATUS).map(([value]) => ({
  value,
  label: STATUS_LABEL[value as ContratoStatus],
}))

export function ContratosPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ContratoStatus | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  const { data: contratos = [], isLoading } = useContratosList({
    status,
    search: debounced || undefined,
  })

  return (
    <div className="p-6">
      <PageTitle
        title="Contratos"
        description="Envie contratos por link, acompanhe a assinatura e a aprovação"
        actions={
          <Button onClick={() => navigate(ROUTES.CONTRATOS_NOVO)}>
            <FileSignature className="mr-2 h-4 w-4" />
            Novo contrato
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              window.setTimeout(() => setDebounced(e.target.value), 300)
            }}
            placeholder="Buscar por cliente, telefone ou pacote"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value === 'all' ? undefined : (value as ContratoStatus))}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <PageLoading />
      ) : contratos.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-16 w-16" />}
          message="Nenhum contrato encontrado"
          description="Crie um contrato preenchendo os dados do ensaio e do pacote."
          actionLabel="Criar contrato"
          onAction={() => navigate(ROUTES.CONTRATOS_NOVO)}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="grid grid-cols-12 gap-3 border-b px-4 py-2 text-xs font-semibold text-muted-foreground">
            <div className="col-span-4">Cliente</div>
            <div className="col-span-3">Pacote / Ensaio</div>
            <div className="col-span-2">Valores</div>
            <div className="col-span-3">Status</div>
          </div>
          {contratos.map((contrato) => (
            <button
              key={contrato.id}
              type="button"
              onClick={() => navigate(ROUTES.CONTRATOS_NOVO.replace('/novo', `/${contrato.id}`))}
              className="grid w-full grid-cols-12 items-center gap-3 border-b px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-accent/50"
            >
              <div className="col-span-4 min-w-0">
                <p className="truncate font-medium">
                  {contrato.clienteNome ?? 'Aguardando preenchimento do cliente'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contrato.clienteTelefone ?? 'Sem telefone'}
                </p>
              </div>
              <div className="col-span-3 min-w-0">
                <p className="truncate">{contrato.pacoteNome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateBR(contrato.dataHoraEnsaio)}
                </p>
              </div>
              <div className="col-span-2">
                <p>{formatCurrency(contrato.valorTotal)}</p>
                <p className="text-xs text-muted-foreground">Entrada {formatCurrency(contrato.valorEntradaExigido)}</p>
              </div>
              <div className="col-span-3">
                <Badge
                  variant={
                    contrato.status === CONTRATO_STATUS.APROVADO
                      ? 'default'
                      : contrato.status === CONTRATO_STATUS.ASSINADO_PELO_CLIENTE ||
                          contrato.status === CONTRATO_STATUS.PAGAMENTO_CONFIRMADO
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {STATUS_LABEL[contrato.status]}
                </Badge>
              </div>
            </button>
          ))}
          {contratos.length > 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              {contratos.length} contrato(s) · {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}