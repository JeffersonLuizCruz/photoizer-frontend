import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

const fotografoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional().or(z.literal('')),
})

const criarSchema = fotografoSchema.extend({
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export type FotografoFormData = z.infer<typeof fotografoSchema>
export type CriarFotografoFormData = z.infer<typeof criarSchema>

interface FotografosFormProps {
  onSubmit: (data: any) => void
  defaultValues?: Partial<CriarFotografoFormData>
  isPending: boolean
  mode: 'create' | 'edit'
}

export function FotografosForm({ onSubmit, defaultValues, isPending, mode }: FotografosFormProps) {
  const schema = mode === 'create' ? criarSchema : fotografoSchema
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues ?? {},
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" {...register('nome')} placeholder="Nome do fotógrafo" />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="senha">Senha *</Label>
          <Input id="senha" type="password" {...register('senha')} placeholder="Mínimo 6 caracteres" />
          {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input id="telefone" {...register('telefone')} placeholder="(11) 99999-9999" />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === 'create' ? 'Criar Fotógrafo' : 'Salvar Alterações'}
      </Button>
    </form>
  )
}