import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { agendamentoService } from '../services/agendamento.service'
import type { Usuario } from '../types'

export function StepFotografo() {
  const { register, setValue, watch, formState: { errors } } = useFormContext()
  const [fotografos, setFotografos] = useState<Usuario[]>([])

  const fotografoId = watch('fotografoId')

  useEffect(() => {
    agendamentoService.listUsuarios().then((usuarios) => {
      setFotografos(usuarios.filter((u) => u.papel === 'FOTOGRAFO'))
    })
  }, [])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fotografoId">Fotógrafo Responsável</Label>
        <Select
          value={fotografoId || ''}
          onValueChange={(value) => setValue('fotografoId', value || '', { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um fotógrafo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem fotógrafo</SelectItem>
            {fotografos.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valorRepassarFotografo">Valor a Repassar ao Fotógrafo (R$)</Label>
        <Input
          id="valorRepassarFotografo"
          type="number"
          step="0.01"
          min="0"
          placeholder="Ex: 200.00"
          {...register('valorRepassarFotografo', { valueAsNumber: true })}
        />
        {errors.valorRepassarFotografo && (
          <p className="text-sm text-destructive">{String(errors.valorRepassarFotografo.message)}</p>
        )}
      </div>
    </div>
  )
}