import { useState } from 'react'
import { Ticket, Plus, Trash2, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ecommerceService } from '../services/ecommerce.service'
import type { Cupom } from '../types/ecommerce.types'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ROUTES } from '@/shared/constants'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDesconto(cupom: Cupom): string {
  if (cupom.tipoDesconto === 'PERCENTUAL') return `${cupom.valorDesconto}%`
  return formatCurrency(cupom.valorDesconto)
}

function cupomStatus(cupom: Cupom): { label: string; className: string } {
  if (cupom.dataValidade && new Date(cupom.dataValidade) < new Date()) {
    return { label: 'Expirado', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  }
  if (cupom.ativo) {
    return { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
  }
  return { label: 'Inativo', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
}

interface CupomFormState {
  codigo: string
  descricao: string
  tipoDesconto: string
  valorDesconto: string
  valorMinimoPedido: string
  usoLimite: string
  dataValidade: string
  ativo: boolean
  usoUnico: boolean
}

const emptyForm: CupomFormState = {
  codigo: '',
  descricao: '',
  tipoDesconto: 'PERCENTUAL',
  valorDesconto: '',
  valorMinimoPedido: '',
  usoLimite: '',
  dataValidade: '',
  ativo: true,
  usoUnico: false,
}

export function AdminCuponsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CupomFormState>(emptyForm)

  const { data: cupons, isLoading } = useQuery({
    queryKey: ['admin-cupons'],
    queryFn: () => ecommerceService.listarCupons(),
  })

  const { mutate: criar, isPending: isCreating } = useMutation({
    mutationFn: () =>
      ecommerceService.criarCupom({
        codigo: form.codigo.trim().toUpperCase(),
        descricao: form.descricao.trim() || null,
        tipoDesconto: form.tipoDesconto,
        valorDesconto: Number(form.valorDesconto),
        valorMinimoPedido: form.valorMinimoPedido ? Number(form.valorMinimoPedido) : null,
        usoLimite: form.usoLimite ? Number(form.usoLimite) : null,
        dataValidade: form.dataValidade || null,
        ativo: form.ativo,
        usoUnico: form.usoUnico,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cupons'] })
      toast.success('Cupom criado com sucesso!')
      setForm(emptyForm)
      setShowForm(false)
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao criar cupom'),
  })

  const { mutate: deletar, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => ecommerceService.deletarCupom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cupons'] })
      toast.success('Cupom removido!')
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao remover cupom'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.codigo.trim()) {
      toast.error('Informe o código do cupom')
      return
    }
    if (!form.valorDesconto || Number(form.valorDesconto) <= 0) {
      toast.error('Informe um valor de desconto válido')
      return
    }
    criar()
  }

  function handleDelete(cupom: Cupom) {
    if (window.confirm(`Tem certeza que deseja excluir o cupom "${cupom.codigo}"?`)) {
      deletar(cupom.id)
    }
  }

  return (
    <div>
      <PageTitle
        title="Cupons de Desconto"
        icon={<Ticket className="h-5 w-5" />}
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Cupons' },
        ]}
      />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Fechar' : 'Novo Cupom'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 mb-6">
          <h3 className="text-sm font-semibold mb-4">Novo Cupom</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Código *</label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                placeholder="EX: DESCONTO10"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descrição do cupom"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de Desconto *</label>
              <select
                value={form.tipoDesconto}
                onChange={(e) => setForm({ ...form, tipoDesconto: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="PERCENTUAL">Percentual (%)</option>
                <option value="FIXO">Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Valor do Desconto * {form.tipoDesconto === 'PERCENTUAL' ? '(%)' : '(R$)'}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valorDesconto}
                onChange={(e) => setForm({ ...form, valorDesconto: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Valor Mínimo do Pedido (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valorMinimoPedido}
                onChange={(e) => setForm({ ...form, valorMinimoPedido: e.target.value })}
                placeholder="Opcional"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Limite de Usos</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.usoLimite}
                onChange={(e) => setForm({ ...form, usoLimite: e.target.value })}
                placeholder="Ilimitado"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Data de Validade</label>
              <input
                type="date"
                value={form.dataValidade}
                onChange={(e) => setForm({ ...form, dataValidade: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end gap-6 pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="h-4 w-4 rounded border"
                />
                Ativo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.usoUnico}
                  onChange={(e) => setForm({ ...form, usoUnico: e.target.checked })}
                  className="h-4 w-4 rounded border"
                />
                Uso único por cliente
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(emptyForm) }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Cupom
            </button>
          </div>
        </form>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !cupons || cupons.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhum cupom cadastrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Desconto</th>
                  <th className="px-4 py-3 font-medium">Usos</th>
                  <th className="px-4 py-3 font-medium">Validade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cupons.map((cupom) => {
                  const status = cupomStatus(cupom)
                  return (
                    <tr key={cupom.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{cupom.codigo}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cupom.descricao || '—'}</td>
                      <td className="px-4 py-3 font-medium">{formatDesconto(cupom)}</td>
                      <td className="px-4 py-3">
                        {cupom.usosAtuais}/{cupom.usoLimite ?? '∞'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {cupom.dataValidade ? new Date(cupom.dataValidade).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(cupom)}
                          disabled={isDeleting}
                          className="h-7 w-7 rounded hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
                          title="Excluir cupom"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
