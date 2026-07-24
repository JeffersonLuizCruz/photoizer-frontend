import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Image, Upload, ArrowRight, CheckCircle2, Download, Eye } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { EmptyState } from '@/shared/components/layout/EmptyState'
import { useEdicaoList } from '../api/queries'
import { EdicaoStatusBadge } from '../components/EdicaoStatusBadge'
import type { EdicaoProcesso, StatusEdicao } from '../types'

const TABS: { value: string; label: string; status?: StatusEdicao }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'AGUARDANDO_RAW', label: 'Aguardando RAW', status: 'AGUARDANDO_RAW' },
  { value: 'RAW_ENVIADOS', label: 'RAW Enviados', status: 'RAW_ENVIADOS' },
  { value: 'EM_EDICAO', label: 'Em Edição', status: 'EM_EDICAO' },
  { value: 'EDICAO_CONCLUIDA', label: 'Concluídos', status: 'EDICAO_CONCLUIDA' },
]

export function EdicaoListPage() {
  const [tab, setTab] = useState('todos')
  const status = TABS.find((t) => t.value === tab)?.status
  const { data: edicoes, isLoading } = useEdicaoList(status)
  const navigate = useNavigate()

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-6">
      <PageTitle
        title="Edição"
        description="Gerencie o fluxo de edição de fotos dos ensaios"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            {!edicoes || edicoes.length === 0 ? (
              <EmptyState
                icon={<Image className="h-16 w-16" />}
                message="Nenhum processo de edição encontrado"
                description={t.status === 'AGUARDANDO_RAW' ? 'Ensaios com pagamento confirmado aparecerão aqui para upload das fotos RAW.' : undefined}
              />
            ) : (
              <div className="space-y-3">
                {edicoes.map((edicao) => (
                  <EdicaoCard key={edicao.id} edicao={edicao} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function EdicaoCard({ edicao }: { edicao: EdicaoProcesso }) {
  const navigate = useNavigate()

  const actionButton = () => {
    switch (edicao.status) {
      case 'AGUARDANDO_RAW':
        return (
          <Button size="sm" onClick={() => navigate(`/edicao/${edicao.agendamentoId}/upload-raw`)}>
            <Upload className="mr-1 h-4 w-4" />
            Enviar RAW
          </Button>
        )
      case 'RAW_ENVIADOS':
      case 'EM_EDICAO':
        return (
          <Button size="sm" onClick={() => navigate(`/edicao/${edicao.agendamentoId}`)}>
            <Eye className="mr-1 h-4 w-4" />
            Abrir Workspace
          </Button>
        )
      case 'EDICAO_CONCLUIDA':
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(`/edicao/${edicao.agendamentoId}`)}>
              <Eye className="mr-1 h-4 w-4" />
              Ver
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Image className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium">Ensaio #{edicao.agendamentoId.substring(0, 8)}</p>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <EdicaoStatusBadge status={edicao.status} />
            <span>{edicao.totalFotosRaw} RAW</span>
            {edicao.totalFotosEditadas > 0 && (
              <>
                <ArrowRight className="h-3 w-3" />
                <span>{edicao.totalFotosEditadas} editadas</span>
              </>
            )}
            {edicao.dataEnvioRaw && (
              <span>Envio: {new Date(edicao.dataEnvioRaw).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
      {actionButton()}
    </div>
  )
}
