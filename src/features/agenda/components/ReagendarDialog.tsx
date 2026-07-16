import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Input } from '@/shared/components/ui/input'
import { CalendarDays } from 'lucide-react'
import { format as formatDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/shared/lib/cn'
import { useReagendarAgendamento } from '../api/queries'
import type { Agendamento } from '../types'

interface ReagendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento
}

export function ReagendarDialog({ open, onOpenChange, agendamento }: ReagendarDialogProps) {
  const [data, setData] = useState<Date | undefined>(new Date(agendamento.dataHoraEnsaio))
  const [hora, setHora] = useState(formatDate(new Date(agendamento.dataHoraEnsaio), 'HH:mm'))
  const { mutate, isPending } = useReagendarAgendamento()

  const handleSubmit = () => {
    if (!data || !hora) return

    mutate(
      { id: agendamento.id, data: formatDate(data, 'yyyy-MM-dd'), hora },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reagendar Ensaio</DialogTitle>
          <DialogDescription>
            Selecione a nova data e horário para o ensaio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !data && 'text-muted-foreground')}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {data ? formatDate(data, "dd 'de' MMM 'de' yyyy", { locale: ptBR }) : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={setData}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Novo Horário</Label>
            <Input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !data || !hora}>
            {isPending ? 'Reagendando...' : 'Confirmar Reagendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
