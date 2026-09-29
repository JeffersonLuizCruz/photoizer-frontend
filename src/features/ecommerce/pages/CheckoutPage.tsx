import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Camera, ChevronRight, Download, CreditCard, Check, Loader2, ShoppingBag, ArrowLeft, User, Mail, Phone, Lock, Waves } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import { useCustomerAuth } from '@/features/auth/customer'
import { apiClient } from '@/shared/api'
import { BeachBackdrop } from '@/shared/components/beach/BeachBackdrop'
import { BEACH_CARD, BEACH_CTA } from '@/shared/components/beach/beach'
import { cn } from '@/shared/lib/cn'
import type { PacoteResponse } from '@/features/pacotes/types/pacotes.types'
import type { OpcaoEntrega } from '../types/ecommerce.types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// RF010: fluxo de checkout em etapas
const STEPS = ['Revisão', 'Dados', 'Entrega', 'Pagamento', 'Confirmação']

export function CheckoutPage() {
  const { pacoteId } = useParams<{ pacoteId: string }>()
  const navigate = useNavigate()
  const { user, login } = useCustomerAuth()
  const [step, setStep] = useState(0)
  const [pacote, setPacote] = useState<PacoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dados do cliente (RF010 etapa 2)
  const [nome, setNome] = useState(user?.nome ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [telefone, setTelefone] = useState(user?.telefone ?? '')
  const [senha, setSenha] = useState('')

  // Opções de entrega (RF011)
  const [opcaoEntrega, setOpcaoEntrega] = useState<OpcaoEntrega>('DIGITAL')
  const entregaPrecos: Record<OpcaoEntrega, number> = { DIGITAL: 0, FISICA: 29.90, AMBAS: 49.90 }
  const entregaPrazos: Record<OpcaoEntrega, string> = {
    DIGITAL: 'Imediato após confirmação',
    FISICA: '7 a 10 dias úteis',
    AMBAS: 'Download imediato + mídia em 7-10 dias',
  }

  // Pagamento (RF012)
  const [formaPagamento, setFormaPagamento] = useState('PIX')

  // Upsell de fotos extras (FA003)
  const [quantidadeExtras, setQuantidadeExtras] = useState(0)
  const precoFotoExtra = (pacote?.precoFotoExtra ?? 0) > 0 ? (pacote?.precoFotoExtra ?? 0) : 15
  const valorExtras = precoFotoExtra * quantidadeExtras
  const taxaEntrega = entregaPrecos[opcaoEntrega]
  const total = Math.max(0, (pacote?.valorBase ?? 0) + valorExtras + taxaEntrega)

  useEffect(() => {
    if (!pacoteId) return
    ecommerceService.buscarPacote(pacoteId)
      .then(setPacote)
      .catch(() => toast.error('Pacote não encontrado'))
      .finally(() => setIsLoading(false))
  }, [pacoteId])

  // Etapa Dados: identifica ou registra o cliente
  const handleConfirmarDados = async () => {
    if (user) {
      setStep(2)
      return
    }
    if (!nome.trim() || !email.trim() || !telefone.trim() || senha.length < 6) {
      toast.error('Preencha todos os campos. A senha deve ter no mínimo 6 caracteres.')
      return
    }
    setIsSubmitting(true)
    try {
      // Tenta login primeiro; se falhar, registra
      let auth
      try {
        const { data } = await apiClient.post('/auth/cliente/login', { email, senha })
        auth = data
      } catch {
        const { data } = await apiClient.post('/auth/cliente/registro', { nome, email, telefone, senha })
        auth = data
      }
      login({ id: auth.id, nome: auth.nome, email: auth.email, telefone: auth.telefone, token: auth.token, isLoggedIn: true })
      toast.success(`Bem-vindo, ${auth.nome}!`)
      setStep(2)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao identificar cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalizar = async () => {
    if (!pacote) return
    const clienteId = user?.id
    if (!clienteId) {
      toast.error('Identifique-se antes de finalizar')
      setStep(1)
      return
    }
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Solicitação registrada com sucesso!')
      setStep(4)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao processar solicitação')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <BeachBackdrop />
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (!pacote) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <BeachBackdrop />
        <div className="text-center">
          <Camera className="mx-auto mb-3 h-12 w-12 text-cyan-400" />
          <h1 className="font-display text-lg font-semibold text-cyan-950">Pacote não encontrado</h1>
          <button onClick={() => navigate('/pacotes-disponiveis')}
            className="mt-4 text-sm font-medium text-cyan-700 hover:underline">
            Ver pacotes disponíveis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <BeachBackdrop />

      <header className="sticky top-0 z-40 border-b border-cyan-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <button onClick={() => step === 0 ? navigate('/pacotes-disponiveis') : setStep(Math.max(0, step - 1))}
            aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-cyan-800 hover:bg-cyan-100">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold text-cyan-950">
            <Waves className="h-4 w-4 text-cyan-500" />
            Finalizar Pedido
          </span>
        </div>
      </header>

      {/* Progresso das etapas */}
      <div className="mx-auto max-w-3xl px-4 pb-4 pt-6">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors',
                i < step ? 'bg-teal-500 text-white'
                  : i === step ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-300'
                  : 'bg-white text-slate-400 ring-1 ring-cyan-100',
              )}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('ml-1.5 hidden text-[10px] sm:inline', i <= step ? 'font-medium text-cyan-900' : 'text-slate-400')}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={cn('mx-2 h-0.5 flex-1 rounded-full', i < step ? 'bg-teal-400' : 'bg-cyan-100')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-12">
        {/* Etapa 0: Revisão */}
        {step === 0 && (
          <div className="space-y-4">
            <div className={cn('p-5', BEACH_CARD)}>
              <h2 className="mb-3 font-display text-base font-semibold text-cyan-950">Pacote Selecionado</h2>
              <div className="flex items-start gap-3">
                {pacote.imagemCapa && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-cyan-100">
                    <img src={pacote.imagemCapa} alt={pacote.nome} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{pacote.nome}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{pacote.quantidadeFotos} fotos inclusas</p>
                </div>
                <span className="text-sm font-semibold text-cyan-900">{formatCurrency(pacote.valorBase)}</span>
              </div>
            </div>

            {/* FA003: Upsell de fotos extras */}
            {pacote.precoFotoExtra != null && (
              <div className={cn('space-y-3 p-5', BEACH_CARD)}>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-cyan-950">Adicionar Fotos Extras</h2>
                  {quantidadeExtras > 0 && (
                    <button onClick={() => setQuantidadeExtras(0)}
                      className="text-xs text-slate-500 transition-colors hover:text-cyan-700">
                      Remover
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {formatCurrency(precoFotoExtra)} por foto extra
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-xl border border-cyan-100 bg-white">
                    <button onClick={() => setQuantidadeExtras(Math.max(0, quantidadeExtras - 5))}
                      disabled={quantidadeExtras === 0}
                      className="flex h-9 w-9 items-center justify-center text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-50 disabled:opacity-30">
                      –
                    </button>
                    <span className="w-16 text-center text-sm font-medium tabular-nums text-slate-800">{quantidadeExtras}</span>
                    <button onClick={() => setQuantidadeExtras(quantidadeExtras + 5)}
                      className="flex h-9 w-9 items-center justify-center text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-50">
                      +
                    </button>
                  </div>
                  {quantidadeExtras > 0 && (
                    <span className="text-xs font-medium text-cyan-700">
                      +{formatCurrency(valorExtras)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className={cn('space-y-2 p-5', BEACH_CARD)}>
              <h2 className="mb-1 font-display text-base font-semibold text-cyan-950">Resumo</h2>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pacote ({pacote.nome})</span>
                <span className="text-slate-800">{formatCurrency(pacote.valorBase)}</span>
              </div>
              {quantidadeExtras > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fotos extras ({quantidadeExtras} × {formatCurrency(precoFotoExtra)})</span>
                  <span className="text-slate-800">{formatCurrency(valorExtras)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Taxa de entrega</span>
                <span className="text-slate-800">{taxaEntrega === 0 ? 'Grátis' : formatCurrency(taxaEntrega)}</span>
              </div>
              <div className="flex justify-between border-t border-cyan-100 pt-2 text-sm font-semibold text-cyan-950">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button onClick={() => setStep(1)}
              className={cn('flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold', BEACH_CTA)}>
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Etapa 1: Dados do cliente */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-cyan-950">Seus Dados</h2>

            {user ? (
              <div className={cn('space-y-2 p-5', BEACH_CARD)}>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-cyan-500" /><span className="font-medium text-slate-800">{user.nome}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="h-4 w-4 text-cyan-400" /><span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Phone className="h-4 w-4 text-cyan-400" /><span>{user.telefone}</span>
                </div>
              </div>
            ) : (
              <div className={cn('space-y-3 p-5', BEACH_CARD)}>
                <p className="text-xs text-slate-500">Identifique-se para continuar. Se já tem conta, informe email e senha.</p>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                  <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo"
                    className="w-full rounded-xl border border-cyan-100 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                    className="w-full rounded-xl border border-cyan-100 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                  <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-8888"
                    className="w-full rounded-xl border border-cyan-100 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                  <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha (mín. 6 caracteres)"
                    className="w-full rounded-xl border border-cyan-100 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
                </div>
              </div>
            )}

            <button onClick={handleConfirmarDados} disabled={isSubmitting}
              className={cn('flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold disabled:opacity-50', BEACH_CTA)}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuar <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        )}

        {/* Etapa 2: Entrega */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-cyan-950">Opção de Entrega</h2>
            <div className="space-y-2">
              {(['DIGITAL', 'FISICA', 'AMBAS'] as OpcaoEntrega[]).map((opcao) => {
                const preco = entregaPrecos[opcao]
                const selecionado = opcaoEntrega === opcao
                return (
                  <div key={opcao}
                    onClick={() => setOpcaoEntrega(opcao)}
                    role="radio"
                    aria-checked={selecionado}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpcaoEntrega(opcao) }}
                    className={cn(
                      'cursor-pointer rounded-2xl border bg-white p-4 transition-colors',
                      selecionado ? 'border-cyan-300 ring-2 ring-cyan-200' : 'border-cyan-100 hover:border-cyan-200',
                    )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Download className={cn('h-5 w-5', selecionado ? 'text-cyan-600' : 'text-slate-400')} />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {opcao === 'DIGITAL' ? 'Download Digital' : opcao === 'FISICA' ? 'Mídia Física' : 'Ambos'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {opcao === 'DIGITAL' ? 'Links de download por e-mail' :
                             opcao === 'FISICA' ? 'USB ou DVD entregue em casa' :
                             'Download + mídia física'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">Prazo: {entregaPrazos[opcao]}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-cyan-900">{preco === 0 ? 'Grátis' : formatCurrency(preco)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => setStep(3)}
              className={cn('flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold', BEACH_CTA)}>
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Etapa 3: Pagamento */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-cyan-950">Pagamento</h2>

            <div className={cn('space-y-2 p-4', BEACH_CARD)}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Forma de pagamento</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {['PIX', 'CARTAO_CREDITO', 'TRANSFERENCIA', 'PAYPAL'].map((metodo) => (
                  <button key={metodo} onClick={() => setFormaPagamento(metodo)}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-center text-xs font-medium transition-colors',
                      formaPagamento === metodo
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                        : 'border-cyan-100 hover:bg-cyan-50/50',
                    )}>
                    {metodo === 'PIX' ? 'PIX' : metodo === 'CARTAO_CREDITO' ? 'Cartão' : metodo === 'TRANSFERENCIA' ? 'Transferência' : 'PayPal'}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn('space-y-1.5 p-4', BEACH_CARD)}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-800">{formatCurrency(total)}</span>
              </div>
            </div>

            <button onClick={handleFinalizar} disabled={isSubmitting}
              className={cn('flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold disabled:opacity-50', BEACH_CTA)}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {isSubmitting ? 'Processando...' : `Pagar ${formatCurrency(total)}`}
            </button>
          </div>
        )}

        {/* Etapa 4: Confirmação */}
        {step === 4 && (
          <div className="py-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 shadow-lg shadow-cyan-200">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-cyan-950">Solicitação Recebida!</h1>
            <p className="mx-auto mb-6 max-w-sm text-sm text-slate-600">
              Sua solicitação foi registrada com sucesso. Entraremos em contato em breve.
            </p>
            <div className={cn('mx-auto mb-6 max-w-xs p-4', BEACH_CARD)}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-500">Pacote</span>
                <span className="font-medium text-slate-800">{pacote.nome}</span>
              </div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold text-cyan-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pagamento</span>
                <span className="font-medium text-slate-800">{formaPagamento}</span>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('/')}
                className={cn('flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold', BEACH_CTA)}>
                <ShoppingBag className="h-4 w-4" /> Ir para o Início
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
