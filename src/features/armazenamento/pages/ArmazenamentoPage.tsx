import { useMemo, useState } from 'react'
import { AlertTriangle, HardDrive, RefreshCw, Search } from 'lucide-react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { EmptyState } from '@/shared/components/layout/EmptyState'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { extractErrorMessage } from '@/shared/api'
import { formatarPercentual } from '@/shared/lib/bytes'
import { useArmazenamentoResumo, useGaleriasArmazenamento } from '../api/queries'
import { ResumoArmazenamentoCards } from '../components/ResumoArmazenamentoCards'
import { GaleriasArmazenamentoTable } from '../components/GaleriasArmazenamentoTable'
import { ExpurgarGaleriaDialog } from '../components/ExpurgarGaleriaDialog'
import type { GaleriaArmazenamento } from '../types/armazenamento.types'

type Filtro = 'todas' | 'elegiveis' | 'arquivadas'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'elegiveis', label: 'Elegíveis' },
  { id: 'arquivadas', label: 'Arquivadas' },
]

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function combinaFiltro(galeria: GaleriaArmazenamento, filtro: Filtro): boolean {
  if (filtro === 'elegiveis') return galeria.expurgavel
  if (filtro === 'arquivadas') return galeria.arquivada
  return true
}

export function ArmazenamentoPage() {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [galeriaParaExpurgar, setGaleriaParaExpurgar] = useState<GaleriaArmazenamento | null>(null)

  const resumo = useArmazenamentoResumo()
  const galerias = useGaleriasArmazenamento()

  const lista = galerias.data ?? []

  const contagens = useMemo(
    () => ({
      todas: lista.length,
      elegiveis: lista.filter((galeria) => galeria.expurgavel).length,
      arquivadas: lista.filter((galeria) => galeria.arquivada).length,
    }),
    [lista],
  )

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim())
    return lista.filter((galeria) => {
      if (!combinaFiltro(galeria, filtro)) return false
      if (!termo) return true
      return normalizar(galeria.clienteNome ?? '').includes(termo)
    })
  }, [lista, filtro, busca])

  const recarregar = () => {
    void resumo.refetch()
    void galerias.refetch()
  }

  if (resumo.isLoading || galerias.isLoading) {
    return <PageLoading label="Medindo o consumo de disco..." />
  }

  if (resumo.isError || galerias.isError || !resumo.data) {
    return (
      <div>
        <PageTitle
          title="Armazenamento"
          description="Consumo de disco das galerias e liberação de espaço"
          breadcrumbs={[{ label: 'Armazenamento' }]}
        />
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-4 py-16 text-center">
          <AlertTriangle className="mb-2 h-8 w-8 text-amber-600" />
          <p className="text-sm font-medium">Não foi possível carregar o armazenamento</p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {extractErrorMessage(resumo.error ?? galerias.error, 'Tente novamente em instantes.')}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={recarregar}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const dados = resumo.data

  return (
    <div>
      <PageTitle
        title="Armazenamento"
        description="Acompanhe o consumo de disco e libere espaço das galerias já entregues"
        breadcrumbs={[{ label: 'Armazenamento' }]}
        actions={
          <Button variant="outline" size="sm" onClick={recarregar}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Atualizar
          </Button>
        }
      />

      <div className="space-y-4">
        {dados.percentualUso >= 80 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              O volume de uploads está em {formatarPercentual(dados.percentualUso)} de uso. Considere
              expurgar galerias já finalizadas ou ampliar o disco do servidor.
            </p>
          </div>
        )}

        <ResumoArmazenamentoCards resumo={dados} />

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar galerias">
              {FILTROS.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={filtro === item.id ? 'default' : 'outline'}
                  aria-pressed={filtro === item.id}
                  onClick={() => setFiltro(item.id)}
                >
                  {item.label}
                  <span className="ml-1.5 text-xs opacity-70">{contagens[item.id]}</span>
                </Button>
              ))}
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar por cliente"
                className="pl-8"
                aria-label="Buscar galeria por cliente"
              />
            </div>
          </div>

          {filtradas.length === 0 ? (
            <EmptyState
              icon={<HardDrive className="h-12 w-12" />}
              message="Nenhuma galeria encontrada"
              description={
                lista.length === 0
                  ? 'Nenhuma galeria com arquivos no momento.'
                  : 'Ajuste a busca ou o filtro para ver outras galerias.'
              }
              actionLabel={busca || filtro !== 'todas' ? 'Limpar filtros' : undefined}
              onAction={() => {
                setBusca('')
                setFiltro('todas')
              }}
            />
          ) : (
            <GaleriasArmazenamentoTable galerias={filtradas} onExpurgar={setGaleriaParaExpurgar} />
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          O expurgo é feito galeria por galeria, apenas em ensaios finalizados e sem pendências.
          Comprovantes e contratos assinados não entram na remoção.
        </p>
      </div>

      <ExpurgarGaleriaDialog
        galeria={galeriaParaExpurgar}
        open={galeriaParaExpurgar !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setGaleriaParaExpurgar(null)
        }}
      />
    </div>
  )
}
