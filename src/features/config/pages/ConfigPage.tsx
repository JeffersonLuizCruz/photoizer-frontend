import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { configService } from '../services/config.service'

const FIELDS = [
  { key: 'valorUnitarioFotoExtra', label: 'Valor Unitário da Foto Extra (R$)', placeholder: '15.00' },
  { key: 'valorUnitarioVideoExtra', label: 'Valor Unitário do Vídeo Extra (R$)', placeholder: '50.00' },
  { key: 'percentualComissao', label: 'Percentual de Comissão (%)', placeholder: '10.00' },
] as const

export function ConfigPage() {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => configService.get(),
  })

  useEffect(() => {
    if (data) {
      setValues({
        valorUnitarioFotoExtra: String(data.valorUnitarioFotoExtra ?? '15.00'),
        valorUnitarioVideoExtra: String(data.valorUnitarioVideoExtra ?? '50.00'),
        percentualComissao: String(data.percentualComissao ?? '10.00'),
      })
    }
  }, [data])

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => configService.update(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
      toast.success('Configurações salvas com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar configurações')
    },
  })

  return (
    <>
      <PageTitle
        title="Configurações"
        description="Valores globais do sistema"
        breadcrumbs={[{ label: 'Configurações' }]}
        actions={
          <Button onClick={() => save()} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        }
      />

      <div className="max-w-lg space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))
        ) : (
          FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="number"
                step="0.01"
                min="0"
                placeholder={placeholder}
                value={values[key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))
        )}
      </div>
    </>
  )
}
