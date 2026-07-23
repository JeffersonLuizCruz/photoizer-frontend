import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { useCustomerAuth } from './store'
import { toast } from 'sonner'
import { apiClient } from '@/shared/api'

export function CustomerLoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useCustomerAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // RF013: registro/login com email e senha (BCrypt no backend)
      const endpoint = isRegister ? '/auth/cliente/registro' : '/auth/cliente/login'
      const payload = isRegister ? { nome, email, telefone, senha } : { email, senha }
      const { data } = await apiClient.post(endpoint, payload)
      login({ id: data.id, nome: data.nome, email: data.email, telefone: data.telefone, token: data.token, isLoggedIn: true })
      toast.success(isRegister ? 'Cadastro realizado!' : 'Login realizado!')
      navigate('/minha-conta')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isRegister ? 'Erro ao cadastrar' : 'Email ou senha inválidos'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Photoizer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? 'Crie sua conta para acessar suas fotos' : 'Acesse sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
          {isRegister && (
            <div>
              <label className="text-xs font-medium mb-1.5 block">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={nome} onChange={(e) => setNome(e.target.value)} required
                  className="w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm" placeholder="Seu nome" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm" placeholder="seu@email.com" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="text-xs font-medium mb-1.5 block">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} required
                  className="w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm" placeholder="(11) 99999-8888" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-1.5 block">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6}
                className="w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm"
                placeholder={isRegister ? 'Mínimo 6 caracteres' : 'Sua senha'} />
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {isLoading ? 'Aguarde...' : isRegister ? 'Criar Conta' : 'Entrar'}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            {isRegister ? 'Já tem conta?' : 'Não tem conta?'}{' '}
            <button type="button" onClick={() => setIsRegister(!isRegister)}
              className="text-primary font-medium hover:underline">
              {isRegister ? 'Fazer login' : 'Cadastrar'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
