import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Camera, ChevronRight, Download, CreditCard, Gift, Check, Loader2, ShoppingBag, ArrowLeft, User, Mail, Phone, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import { useCustomerAuth } from '@/features/auth/customer'
import { apiClient } from '@/shared/api'
import type { PacoteResponse } from '@/features/pacotes/types/pacotes.types'
import type { CupomValidacaoResponse, OpcaoEntrega, Pedido } from '../types/ecommerce.types'

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
  const [pedidoCriado, setPedidoCriado] = useState<Pedido | null>(null)

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

  // Cupom (FA001)
  const [codigoCupom, setCodigoCupom] = useState('')
  const [cupomValido, setCupomValido] = useState<CupomValidacaoResponse | null>(null)
  const [isValidandoCupom, setIsValidandoCupom] = useState(false)

  // Upsell de fotos extras (FA003)
  const [quantidadeExtras, setQuantidadeExtras] = useState(0)
  const valorExtras = (pacote?.precoFotoExtra ?? 15) * quantidadeExtras
  const taxaEntrega = entregaPrecos[opcaoEntrega]
  const desconto = cupomValido?.valido ? cupomValido.valorDesconto : 0
  const total = Math.max(0, (pacote?.valorBase ?? 0) + valorExtras + taxaEntrega - desconto)

  useEffect(() => {
    if (!pacoteId) return
    ecommerceService.buscarPacote(pacoteId)
      .then(setPacote)
      .catch(() => toast.error('Pacote não encontrado'))
      .finally(() => setIsLoading(false))
  }, [pacoteId])

  const handleValidarCupom = async () => {
    if (!codigoCupom.trim()) return
    setIsValidandoCupom(true)
    try {
      const valorBase = (pacote?.valorBase ?? 0) + valorExtras + taxaEntrega
      const result = await ecommerceService.validarCupom(codigoCupom, valorBase)
      setCupomValido(result)
      if (!result.valido) toast.error(result.mensagem)
      else toast.success(result.mensagem)
    } catch {
      toast.error('Erro ao validar cupom')
    } finally {
      setIsValidandoCupom(false)
    }
  }

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
      login({ id: auth.id, nome: auth.nome, email: auth.email, telefone: auth.telefone, isLoggedIn: true })
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
      const pedido = await ecommerceService.criarPedido({
        clienteId,
        pacoteId: pacote.id,
        fotosSelecionadasIds: [],
        fotosExtrasIds: [],
        taxaEntrega,
        opcaoEntrega,
        formaPagamento,
        codigoCupom: cupomValido?.valido ? cupomValido.codigo : undefined,
      } as any)
      setPedidoCriado(pedido)
      toast.success('Pedido realizado com sucesso!')
      setStep(4)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao finalizar pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pacote) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold">Pacote não encontrado</h1>
          <button onClick={() => navigate('/pacotes-disponiveis')}
            className="mt-4 text-sm text-primary hover:underline">
            Ver pacotes disponíveis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => step === 0 ? navigate('/pacotes-disponiveis') : setStep(Math.max(0, step - 1))}
            aria-label="Voltar"
            className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">Finalizar Pedido</span>
        </div>
      </header>

      {/* Progresso das etapas */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] ml-1.5 hidden sm:inline ${i <= step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        {/* Etapa 0: Revisão */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3">Pacote Selecionado</h2>
              <div className="flex items-start gap-3">
                {pacote.imagemCapa && (
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                    <img src={pacote.imagemCapa} alt={pacote.nome} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{pacote.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pacote.quantidadeFotos} fotos inclusas</p>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(pacote.valorBase)}</span>
              </div>
            </div>

            {/* FA003: Upsell de fotos extras */}
            {pacote.precoFotoExtra != null && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Adicionar Fotos Extras</h2>
                  {quantidadeExtras > 0 && (
                    <button onClick={() => setQuantidadeExtras(0)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Remover
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(pacote.precoFotoExtra)} por foto extra
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border overflow-hidden">
                    <button onClick={() => setQuantidadeExtras(Math.max(0, quantidadeExtras - 5))}
                      disabled={quantidadeExtras === 0}
                      className="h-9 w-9 flex items-center justify-center text-sm font-medium hover:bg-accent disabled:opacity-30 transition-colors">
                      –
                    </button>
                    <span className="w-16 text-center text-sm font-medium tabular-nums">{quantidadeExtras}</span>
                    <button onClick={() => setQuantidadeExtras(quantidadeExtras + 5)}
                      className="h-9 w-9 flex items-center justify-center text-sm font-medium hover:bg-accent transition-colors">
                      +
                    </button>
                  </div>
                  {quantidadeExtras > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{formatCurrency(valorExtras)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h2 className="text-sm font-semibold mb-1">Resumo</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pacote ({pacote.nome})</span>
                <span>{formatCurrency(pacote.valorBase)}</span>
              </div>
              {quantidadeExtras > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fotos extras ({quantidadeExtras} × {formatCurrency(pacote.precoFotoExtra)})</span>
                  <span>{formatCurrency(valorExtras)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>{taxaEntrega === 0 ? 'Grátis' : formatCurrency(taxaEntrega)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button onClick={() => setStep(1)}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1">
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Etapa 1: Dados do cliente */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Seus Dados</h2>

            {user ? (
              <div className="rounded-xl border bg-card p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" /><span className="font-medium">{user.nome}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" /><span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" /><span>{user.telefone}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <p className="text-xs text-muted-foreground">Identifique-se para continuar. Se já tem conta, informe email e senha.</p>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo"
                    className="w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                    className="w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-8888"
                    className="w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha (mín. 6 caracteres)"
                    className="w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm" />
                </div>
              </div>
            )}

            <button onClick={handleConfirmarDados} disabled={isSubmitting}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuar <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        )}

        {/* Etapa 2: Entrega */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Opção de Entrega</h2>
            <div className="space-y-2">
              {(['DIGITAL', 'FISICA', 'AMBAS'] as OpcaoEntrega[]).map((opcao) => {
                const preco = entregaPrecos[opcao]
                return (
                  <div key={opcao}
                    onClick={() => setOpcaoEntrega(opcao)}
                    role="radio"
                    aria-checked={opcaoEntrega === opcao}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpcaoEntrega(opcao) }}
                    className={`rounded-xl border bg-card p-4 cursor-pointer transition-colors ${
                      opcaoEntrega === opcao ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Download className={`h-5 w-5 ${opcaoEntrega === opcao ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {opcao === 'DIGITAL' ? 'Download Digital' : opcao === 'FISICA' ? 'Mídia Física' : 'Ambos'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opcao === 'DIGITAL' ? 'Links de download por e-mail' :
                             opcao === 'FISICA' ? 'USB ou DVD entregue em casa' :
                             'Download + mídia física'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Prazo: {entregaPrazos[opcao]}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">{preco === 0 ? 'Grátis' : formatCurrency(preco)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => setStep(3)}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1">
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Etapa 3: Pagamento */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Pagamento</h2>

            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">FORMA DE PAGAMENTO</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['PIX', 'CARTAO_CREDITO', 'TRANSFERENCIA', 'PAYPAL'].map((metodo) => (
                  <button key={metodo} onClick={() => setFormaPagamento(metodo)}
                    className={`rounded-xl border px-3 py-3 text-xs font-medium transition-colors text-center ${
                      formaPagamento === metodo
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-accent'
                    }`}>
                    {metodo === 'PIX' ? 'PIX' : metodo === 'CARTAO_CREDITO' ? 'Cartão' : metodo === 'TRANSFERENCIA' ? 'Transferência' : 'PayPal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Cupom */}
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Gift className="h-3 w-3" /> CUPOM DE DESCONTO
              </p>
              <div className="flex gap-2">
                <input value={codigoCupom} onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                  placeholder="Digite o código"
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm" />
                <button onClick={handleValidarCupom} disabled={isValidandoCupom || !codigoCupom.trim()}
                  className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isValidandoCupom ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Validar'}
                </button>
              </div>
              {cupomValido && (
                <p className={`text-xs ${cupomValido.valido ? 'text-emerald-600' : 'text-red-500'}`}>
                  {cupomValido.mensagem}
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(total + desconto)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t pt-1.5">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button onClick={handleFinalizar} disabled={isSubmitting}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {isSubmitting ? 'Processando...' : `Pagar ${formatCurrency(total)}`}
            </button>
          </div>
        )}

        {/* Etapa 4: Confirmação */}
        {step === 4 && (
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Pedido Confirmado!</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Seu pedido foi registrado com sucesso. Você receberá um e-mail com os detalhes e instruções de pagamento.
            </p>
            <div className="rounded-xl border bg-card p-4 max-w-xs mx-auto mb-6">
              {pedidoCriado && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Pedido</span>
                  <span className="font-mono text-xs">{pedidoCriado.id.slice(0, 8)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Pacote</span>
                <span className="font-medium">{pacote.nome}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(pedidoCriado?.total ?? total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium">{formaPagamento}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/minha-conta')}
                className="rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Meus Pedidos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
