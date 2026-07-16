import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { pacoteSchema, type PacoteFormData } from '../schemas/pacote.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ROUTES } from '@/shared/constants'
interface PacoteFormProps {
  onSubmit: (data: PacoteFormData) => void
  defaultValues?: Partial<PacoteFormData>
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function PacoteForm({ onSubmit, defaultValues, isLoading, mode }: PacoteFormProps) {
  const navigate = useNavigate()

  const form = useForm<PacoteFormData>({
    resolver: zodResolver(pacoteSchema) as any,
    defaultValues: {
      nome: '',
      descricao: '',
      quantidadeFotos: 0,
      quantidadeVideos: 0,
      valorBase: 0,
      bloqueiaDiaInteiro: false,
      duracaoEstimada: '',
      ativo: true,
      ...defaultValues,
    },
  })

  const { register, setValue, watch, formState: { errors } } = form

  const ativo = watch('ativo')
  const bloqueiaDiaInteiro = watch('bloqueiaDiaInteiro')

  useEffect(() => {
    if (defaultValues) {
      if (defaultValues.bloqueiaDiaInteiro !== undefined) setValue('bloqueiaDiaInteiro', defaultValues.bloqueiaDiaInteiro)
      if (defaultValues.ativo !== undefined) setValue('ativo', defaultValues.ativo)
    }
  }, [defaultValues, setValue])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nome">Nome do Pacote *</Label>
          <Input id="nome" {...register('nome')} placeholder="Ex: Memórias, Herança, Exclusivo" />
          {errors.nome && <p className="mt-1 text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <textarea
            id="descricao"
            {...register('descricao')}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Descrição do pacote"
          />
          {errors.descricao && <p className="mt-1 text-sm text-destructive">{errors.descricao.message}</p>}
        </div>

        <div>
          <Label htmlFor="quantidadeFotos">Quantidade de Fotos *</Label>
          <Input id="quantidadeFotos" type="number" min={0} {...register('quantidadeFotos')} placeholder="0" />
          {errors.quantidadeFotos && <p className="mt-1 text-sm text-destructive">{errors.quantidadeFotos.message}</p>}
        </div>

        <div>
          <Label htmlFor="quantidadeVideos">Quantidade de Vídeos *</Label>
          <Input id="quantidadeVideos" type="number" min={0} {...register('quantidadeVideos')} placeholder="0" />
          {errors.quantidadeVideos && <p className="mt-1 text-sm text-destructive">{errors.quantidadeVideos.message}</p>}
        </div>

        <div>
          <Label htmlFor="valorBase">Valor Base (R$) *</Label>
          <Input
            id="valorBase"
            type="number"
            step="0.01"
            min={0}
            {...register('valorBase')}
            placeholder="0,00"
          />
          {errors.valorBase && <p className="mt-1 text-sm text-destructive">{errors.valorBase.message}</p>}
        </div>

        <div>
          <Label htmlFor="duracaoEstimada">Duração Estimada *</Label>
          <Input id="duracaoEstimada" {...register('duracaoEstimada')} placeholder="Ex: 2h, 4h, 2 horas" />
          {errors.duracaoEstimada && <p className="mt-1 text-sm text-destructive">{errors.duracaoEstimada.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-4">
          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors">
            <input
              type="checkbox"
              checked={bloqueiaDiaInteiro}
              onChange={(e) => setValue('bloqueiaDiaInteiro', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <div>
              <span className="text-sm font-medium">Bloqueia o dia inteiro</span>
              <p className="text-xs text-muted-foreground">
                Se ativo, este pacote ocupará a agenda pelo dia todo
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setValue('ativo', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <div>
              <span className="text-sm font-medium">Pacote ativo</span>
              <p className="text-xs text-muted-foreground">
                Se ativo, estará disponível para novos agendamentos
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(ROUTES.PACOTES)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Criar Pacote' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  )
}
