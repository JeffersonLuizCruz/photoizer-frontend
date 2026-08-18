import { useNavigate } from 'react-router-dom'
import { Camera, TrendingUp } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { useRelatorioGlobalFotografos } from '../api/queries'
import { formatCurrency } from '@/shared/lib/format'

export function RelatorioGlobalPage() {
  const navigate = useNavigate()
  const { data: relatorio, isLoading } = useRelatorioGlobalFotografos()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse h-8 w-48 bg-muted rounded" />
        <div className="animate-pulse h-24 w-full bg-muted rounded" />
        <div className="animate-pulse h-64 w-full bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatório Global de Fotógrafos</h1>
        <p className="text-sm text-muted-foreground">
          Consolidação financeira de todos os fotógrafos do sistema
        </p>
      </div>

      {relatorio && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Fotógrafos</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{relatorio.totalFotografos}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Ensaios</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{relatorio.totalEnsaios}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Partilha</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(relatorio.totalPartilha)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Lucro Total do Estúdio</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(relatorio.totalLucroCrm)}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Valor Cobrado Total</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(relatorio.totalValorCobrado)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Custos Totais</p>
              <p className="text-lg font-bold tabular-nums text-rose-600">{formatCurrency(relatorio.totalCustos)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Repasses</p>
              <p className="text-lg font-bold tabular-nums text-amber-600">{formatCurrency(relatorio.totalRepasse)}</p>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fotógrafo</TableHead>
                  <TableHead className="text-right">Ensaios</TableHead>
                  <TableHead className="text-right">Valor Cobrado</TableHead>
                  <TableHead className="text-right">Custos</TableHead>
                  <TableHead className="text-right">Partilha</TableHead>
                  <TableHead className="text-right">Repasse</TableHead>
                  <TableHead className="text-right">Lucro do Estúdio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorio.porFotografo.map((f) => (
                  <TableRow
                    key={f.fotografoNome}
                    className="cursor-pointer"
                    onClick={() => {
                      navigate(`/fotografos`)
                    }}
                  >
                    <TableCell className="font-medium">{f.fotografoNome}</TableCell>
                    <TableCell className="text-right">{f.totalEnsaios}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(f.totalValorCobrado)}</TableCell>
                    <TableCell className="text-right tabular-nums text-rose-600">{formatCurrency(f.totalCustos)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(f.totalPartilha)}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-600">{formatCurrency(f.totalRepasse)}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600">{formatCurrency(f.totalLucroCrm)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!relatorio && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">Nenhum dado disponível</p>
        </div>
      )}
    </div>
  )
}