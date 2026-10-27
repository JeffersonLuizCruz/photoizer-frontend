import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Archive, HardDrive, ImageOff } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { formatarBytes } from '@/shared/lib/bytes'
import { MOTIVO_BLOQUEIO_LABEL, type GaleriaArmazenamento } from '../types/armazenamento.types'

interface GaleriasArmazenamentoTableProps {
  galerias: GaleriaArmazenamento[]
  onExpurgar: (galeria: GaleriaArmazenamento) => void
}

const STATUS_AGENDAMENTO: Record<string, string> = {
  PRE_RESERVA: 'Pré-reserva',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  PAGAMENTO_CONFIRMADO: 'Pagamento confirmado',
  CONFIRMADO: 'Confirmado',
  REALIZADO: 'Realizado',
  AGUARDANDO_PAGAMENTO_FINAL: 'Aguardando pagamento final',
  EM_EDICAO: 'Em edição',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  NO_SHOW: 'No-show',
}

function formatarData(valor: string | null | undefined): string {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return format(data, 'dd/MM/yyyy', { locale: ptBR })
}

function situacao(galeria: GaleriaArmazenamento) {
  if (galeria.arquivada) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Archive className="h-3 w-3" />
        Arquivada
      </Badge>
    )
  }
  if (galeria.expurgavel) {
    return <Badge variant="success">Elegível</Badge>
  }
  if (galeria.motivoBloqueio) {
    return (
      <span className="text-xs text-muted-foreground" title={MOTIVO_BLOQUEIO_LABEL[galeria.motivoBloqueio]}>
        {MOTIVO_BLOQUEIO_LABEL[galeria.motivoBloqueio]}
      </span>
    )
  }
  return <Badge variant="outline">—</Badge>
}

export function GaleriasArmazenamentoTable({ galerias, onExpurgar }: GaleriasArmazenamentoTableProps) {
  return (
    <>
      <div className="hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Galeria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Fotos</TableHead>
              <TableHead className="text-right">Consumo</TableHead>
              <TableHead>Último download</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {galerias.map((galeria) => (
              <TableRow key={galeria.agendamentoId}>
                <TableCell>
                  <Link
                    to={`/agenda/${galeria.agendamentoId}/fotos`}
                    className="font-medium hover:underline"
                  >
                    {galeria.clienteNome || 'Sem cliente'}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatarData(galeria.dataHoraEnsaio)}</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {galeria.status ? STATUS_AGENDAMENTO[galeria.status] ?? galeria.status : '—'}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {galeria.quantidadeFotos}
                  {galeria.quantidadeArquivadas > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({galeria.quantidadeArquivadas} arquivada(s))
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatarBytes(galeria.bytes)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarBytes(galeria.bytesFotos)} em originais
                  </p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatarData(galeria.ultimoDownload)}
                </TableCell>
                <TableCell>{situacao(galeria)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!galeria.expurgavel}
                    title={
                      galeria.expurgavel
                        ? 'Apagar os arquivos desta galeria'
                        : galeria.motivoBloqueio
                          ? MOTIVO_BLOQUEIO_LABEL[galeria.motivoBloqueio]
                          : undefined
                    }
                    onClick={() => onExpurgar(galeria)}
                  >
                    {galeria.arquivada ? 'Arquivada' : 'Liberar espaço'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="grid gap-3 md:hidden">
        {galerias.map((galeria) => (
          <li key={galeria.agendamentoId} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/agenda/${galeria.agendamentoId}/fotos`}
                  className="truncate font-medium hover:underline"
                >
                  {galeria.clienteNome || 'Sem cliente'}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatarData(galeria.dataHoraEnsaio)} ·{' '}
                  {galeria.status ? STATUS_AGENDAMENTO[galeria.status] ?? galeria.status : '—'}
                </p>
              </div>
              {situacao(galeria)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ImageOff className="h-3.5 w-3.5" />
                {galeria.quantidadeFotos} foto(s)
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <HardDrive className="h-3.5 w-3.5" />
                {formatarBytes(galeria.bytes)}
              </span>
              <span>Último download: {formatarData(galeria.ultimoDownload)}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              disabled={!galeria.expurgavel}
              title={
                galeria.expurgavel
                  ? 'Apagar os arquivos desta galeria'
                  : galeria.motivoBloqueio
                    ? MOTIVO_BLOQUEIO_LABEL[galeria.motivoBloqueio]
                    : undefined
              }
              onClick={() => onExpurgar(galeria)}
            >
              {galeria.arquivada ? 'Arquivada' : 'Liberar espaço'}
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}
