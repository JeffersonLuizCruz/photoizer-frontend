import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from './store'
import { Camera, LogOut, ChevronRight, Loader2, User, Image, Clock } from 'lucide-react'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import type { GaleriaStatusResponse } from '@/features/ecommerce/types/ecommerce.types'
import { Button } from '@/shared/components/ui/button'
import { extractErrorMessage } from '@/shared/api'
import type { AgendamentoCliente } from './types'
import { CustomerAgendamentoCard } from './CustomerAgendamentoCard'

export function CustomerDashboardPage() {
  const { user, logout } = useCustomerAuth()
  const navigate = useNavigate()
  const [agendamentos, setAgendamentos] = useState<AgendamentoCliente[]>([])
  const [statusPorAgendamento, setStatusPorAgendamento] = useState<Record<string, GaleriaStatusResponse | null>>({})
  const [isLoadingAgendamentos, setIsLoadingAgendamentos] = useState(true)
  const [erroAgendamentos, setErroAgendamentos] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let ativo = true

    const carregar = async (silencioso = false) => {
      if (!silencioso) {
        setIsLoadingAgendamentos(true)
        setErroAgendamentos(null)
      }
      try {
        const lista = await ecommerceService.listarAgendamentosCliente()
        if (!ativo) return
        setAgendamentos(lista)
        if (!silencioso) setStatusPorAgendamento({})
        // Libera a lista antes de buscar os status: o status e complementar e
        // nao pode esconder os cards atras de um spinner.
        setIsLoadingAgendamentos(false)

        const pares = await Promise.all(lista.map(async (agendamento) => {
          try {
            return [agendamento.id, await ecommerceService.galeriaStatus(agendamento.tokenGaleria)] as const
          } catch {
            return [agendamento.id, null] as const
          }
        }))
        if (ativo) {
          setStatusPorAgendamento(Object.fromEntries(pares))
        }
      } catch (err: unknown) {
        if (!ativo) return
        if (!silencioso) {
          setErroAgendamentos(extractErrorMessage(err, 'Não foi possível carregar seus ensaios'))
        }
        setIsLoadingAgendamentos(false)
      }
    }

    const atualizarAoVoltar = () => {
      if (document.visibilityState === 'visible') void carregar(true)
    }

    void carregar()
    document.addEventListener('visibilitychange', atualizarAoVoltar)
    return () => {
      ativo = false
      document.removeEventListener('visibilitychange', atualizarAoVoltar)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/acesso-cliente')
  }

  if (!user) {
    navigate('/acesso-cliente')
    return null
  }

  const agendamentosComFotos = agendamentos.filter(a => a.totalFotosPublicadas > 0)
  const agendamentosSemFotos = agendamentos.filter(a => a.totalFotosPublicadas === 0)

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 pt-[env(safe-area-inset-top)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Photoizer</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => navigate('/minha-conta/editar')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-1">
              <User className="h-3.5 w-3.5" /> Editar Dados
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-1">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Olá, {user.nome}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Bem-vindo à sua área do cliente</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="rounded-xl border bg-card p-4">
            <Image className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{agendamentosComFotos.length}</p>
            <p className="text-xs text-muted-foreground">Ensaios com fotos</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <Clock className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{agendamentosSemFotos.length}</p>
            <p className="text-xs text-muted-foreground">Em preparação</p>
          </div>
        </div>

        {/* Seção: Meus Ensaios */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold mb-4">Meus Ensaios</h2>

          {isLoadingAgendamentos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : erroAgendamentos ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Não foi possível carregar seus ensaios</p>
              <p className="mt-1 text-xs text-muted-foreground">{erroAgendamentos}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setIsLoadingAgendamentos(true)
                  setErroAgendamentos(null)
                  window.location.reload()
                }}
              >
                Tentar novamente
              </Button>
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum ensaio encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendamentosComFotos.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {agendamentosComFotos.map((a) => (
                    <CustomerAgendamentoCard key={a.id} agendamento={a} status={statusPorAgendamento[a.id]} />
                  ))}
                </div>
              )}
              {agendamentosSemFotos.length > 0 && (
                <details className="group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                    {agendamentosSemFotos.length} ensaio(s) em preparação
                  </summary>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {agendamentosSemFotos.map((a) => (
                      <CustomerAgendamentoCard key={a.id} agendamento={a} status={statusPorAgendamento[a.id]} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
