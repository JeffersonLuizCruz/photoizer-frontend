import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from './store'
import { customerProfileService, type CustomerProfile, type UpdateProfileRequest } from './customerProfile.service'
import { Camera, Loader2, ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from 'sonner'

export function CustomerProfilePage() {
  const { user, updateUser, logout } = useCustomerAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/acesso-cliente')
      return
    }
    customerProfileService.getProfile()
      .then((data) => {
        setProfile(data)
        setNome(data.nome)
        setTelefone(data.telefone)
        setEmail(data.email)
        setCpf(data.cpf ?? '')
        setCidade(data.cidade ?? '')
        setEstado(data.estado ?? '')
      })
      .catch(() => {
        toast.error('Erro ao carregar perfil')
      })
      .finally(() => setIsLoading(false))
  }, [user, navigate])

  async function handleSave() {
    if (!profile) return
    setIsSaving(true)
    try {
      const payload: UpdateProfileRequest = { nome, telefone, email }
      if (cpf) payload.cpf = cpf
      if (cidade) payload.cidade = cidade
      if (estado) payload.estado = estado

      const updated = await customerProfileService.updateProfile(payload)
      setProfile(updated)
      updateUser({ nome: updated.nome, email: updated.email, telefone: updated.telefone })
      toast.success('Perfil atualizado com sucesso')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/acesso-cliente')
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Photoizer</span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/minha-conta')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <h1 className="text-2xl font-bold mb-6">Meus Dados</h1>

        <div className="space-y-5 rounded-xl border bg-card p-6">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} placeholder="SP" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
