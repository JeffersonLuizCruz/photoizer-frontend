import { useState, useMemo } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, CreditCard, Clock, Phone, Package, MapPin } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { RegistrarPagamentoDialog } from '@/features/agenda/components/RegistrarPagamentoDialog'
import type { Agendamento } from '@/features/agenda/types'

interface Props {
  agendamentos: Agendamento[]
  isLoading?: boolean
}

export function DashboardDetalhesPagamentos({ agendamentos, isLoading }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return agendamentos
    const q = search.toLowerCase()
    return agendamentos.filter(
      (a) =>
        a.clienteNome.toLowerCase().includes(q) ||
        a.clienteTelefone.includes(q) ||
        a.pacoteNome.toLowerCase().includes(q),
    )
  }, [agendamentos, search])

  const selected = agendamentos.find((a) => a.id === selectedId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="mt-2 h-4 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (agendamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
        <CreditCard className="mb-3 h-8 w-8" />
        <p className="text-sm font-medium">Nenhum pagamento pendente</p>
        <p className="text-xs mt-1">Todos os agendamentos estão com o pagamento em dia</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, telefone ou pacote..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Pacote</th>
                <th className="px-4 py-3 text-left">Data do Ensaio</th>
                <th className="px-4 py-3 text-left">Dias</th>
                <th className="px-4 py-3 text-left">Valor Restante</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agendamento) => {
                const dataEnsaio = parseISO(agendamento.dataHoraEnsaio)
                const dias = differenceInDays(new Date(), dataEnsaio)
                return (
                  <tr key={agendamento.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{agendamento.clienteNome}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {agendamento.clienteTelefone}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{agendamento.pacoteNome}</p>
                      {agendamento.localEnsaio && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {agendamento.localEnsaio}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(dataEnsaio, "dd/MM/yyyy", { locale: ptBR })}
                      <p className="text-xs text-muted-foreground">
                        {format(dataEnsaio, "HH:mm", { locale: ptBR })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-sm ${dias > 30 ? 'text-destructive font-medium' : dias > 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        <Clock className="h-3 w-3" />
                        {dias <= 0 ? 'Hoje' : `${dias}d`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium tabular-nums">
                        R$ {agendamento.saldoDevedor.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSelectedId(agendamento.id)}
                      >
                        <CreditCard className="mr-1 h-3 w-3" />
                        Pagamento
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && search && (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Search className="mb-2 h-6 w-6" />
            <p className="text-sm">Nenhum resultado para "{search}"</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} de {agendamentos.length} pagamento(s) pendente(s)
      </p>

      {selected && (
        <RegistrarPagamentoDialog
          open={!!selectedId}
          onOpenChange={(open) => { if (!open) setSelectedId(null) }}
          agendamento={selected}
        />
      )}
    </div>
  )
}
