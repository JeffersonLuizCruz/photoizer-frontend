import { useEffect, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { TimeSlotPicker } from '@/shared/components/ui/time-slot-picker'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { useAtualizarBloqueio, useCancelarBloqueio, useCriarBloqueio } from '../api/bloqueio.queries'
import { HORARIOS_COMPROMISSO } from '../constants'
import type { BloqueioAgenda, Usuario } from '../types'

const GLOBAL = '__global__'

interface BloqueioAgendaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bloqueio?: BloqueioAgenda | null
  dataInicial?: Date
  usuarios: Usuario[]
  podeGerenciar?: boolean
}

function hora(value: Date): string {
  return format(value, 'HH:mm')
}

export function BloqueioAgendaDialog({
  open,
  onOpenChange,
  bloqueio,
  dataInicial,
  usuarios,
  podeGerenciar = false,
}: BloqueioAgendaDialogProps) {
  const editando = Boolean(bloqueio)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [dataFim, setDataFim] = useState('')
  const [horaFim, setHoraFim] = useState('18:00')
  const [diaInteiro, setDiaInteiro] = useState(false)
  const [profissionalId, setProfissionalId] = useState(GLOBAL)
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false)

  const criar = useCriarBloqueio()
  const atualizar = useAtualizarBloqueio()
  const cancelar = useCancelarBloqueio()
  const isPending = criar.isPending || atualizar.isPending || cancelar.isPending

  useEffect(() => {
    if (!open) return

    if (bloqueio) {
      const inicio = parseISO(bloqueio.inicio)
      const fim = parseISO(bloqueio.fim)
      const fimEhMeiaNoite = hora(fim) === '00:00'
      const diaInteiroSalvo = hora(inicio) === '00:00' && fimEhMeiaNoite
      const fimExibicao = diaInteiroSalvo ? addDays(fim, -1) : fim

      setTitulo(bloqueio.titulo)
      setDescricao(bloqueio.descricao ?? '')
      setDataInicio(format(inicio, 'yyyy-MM-dd'))
      setHoraInicio(hora(inicio))
      setDataFim(format(fimExibicao, 'yyyy-MM-dd'))
      setHoraFim(fimEhMeiaNoite && !diaInteiroSalvo ? '23:59' : hora(fim))
      setDiaInteiro(diaInteiroSalvo)
      setProfissionalId(bloqueio.profissionalId ?? GLOBAL)
      return
    }

    const base = dataInicial ?? new Date()
    setTitulo('')
    setDescricao('')
    setDataInicio(format(base, 'yyyy-MM-dd'))
    setHoraInicio('08:00')
    setDataFim(format(base, 'yyyy-MM-dd'))
    setHoraFim('18:00')
    setDiaInteiro(false)
    setProfissionalId(GLOBAL)
  }, [open, bloqueio, dataInicial])

  const handleSubmit = () => {
    if (!titulo.trim() || !dataInicio || !dataFim) return

    const inicio = diaInteiro
      ? `${dataInicio}T00:00:00`
      : `${dataInicio}T${horaInicio}:00`
    const fim = diaInteiro
      ? `${format(addDays(parseISO(dataFim), 1), 'yyyy-MM-dd')}T00:00:00`
      : `${dataFim}T${horaFim}:00`

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      inicio,
      fim,
      profissionalId: profissionalId === GLOBAL ? null : profissionalId,
    }

    if (bloqueio) {
      atualizar.mutate(
        { id: bloqueio.id, payload },
        { onSuccess: () => onOpenChange(false) },
      )
      return
    }

    criar.mutate(payload, { onSuccess: () => onOpenChange(false) })
  }

  const handleCancelar = () => {
    if (!bloqueio) return
    cancelar.mutate(bloqueio.id, {
      onSuccess: () => {
        setConfirmarCancelamento(false)
        onOpenChange(false)
      },
    })
  }

  const podeCancelar = editando && podeGerenciar

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar compromisso' : 'Novo compromisso'}</DialogTitle>
            <DialogDescription>
              O período ficará indisponível para novos agendamentos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bloqueio-titulo">Título</Label>
              <Input
                id="bloqueio-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Congresso de fotografia"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloqueio-descricao">Descrição (opcional)</Label>
              <Textarea
                id="bloqueio-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes do compromisso"
                maxLength={500}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select value={profissionalId} onValueChange={setProfissionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL}>Toda a equipe</SelectItem>
                  {usuarios.filter((u) => u.ativo !== false).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="bloqueio-dia-inteiro"
                checked={diaInteiro}
                onCheckedChange={(checked) => setDiaInteiro(checked === true)}
              />
              <Label htmlFor="bloqueio-dia-inteiro" className="cursor-pointer">Dia inteiro</Label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bloqueio-data-inicio">Início</Label>
                <div className="flex gap-2">
                  <Input
                    id="bloqueio-data-inicio"
                    type="date"
                    className="min-w-0 flex-1"
                    value={dataInicio}
                    onChange={(e) => {
                      setDataInicio(e.target.value)
                      if (!dataFim || dataFim < e.target.value) setDataFim(e.target.value)
                    }}
                  />
                  <TimeSlotPicker
                    value={horaInicio}
                    onChange={setHoraInicio}
                    slots={HORARIOS_COMPROMISSO}
                    allowCustom
                    disabled={diaInteiro}
                    ariaLabel="Hora de início"
                    title="Hora de início"
                    description="Selecione o horário de início do compromisso."
                    className="w-32 shrink-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloqueio-data-fim">Fim</Label>
                <div className="flex gap-2">
                  <Input
                    id="bloqueio-data-fim"
                    type="date"
                    className="min-w-0 flex-1"
                    value={dataFim}
                    min={dataInicio || undefined}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                  <TimeSlotPicker
                    value={horaFim}
                    onChange={setHoraFim}
                    slots={HORARIOS_COMPROMISSO}
                    allowCustom
                    disabled={diaInteiro}
                    ariaLabel="Hora de fim"
                    title="Hora de fim"
                    description="Selecione o horário de fim do compromisso."
                    className="w-32 shrink-0"
                  />
                </div>
              </div>
            </div>

            {diaInteiro && (
              <p className="text-xs text-muted-foreground">
                O bloqueio considera o dia final inteiro.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {podeCancelar ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmarCancelamento(true)}
                disabled={isPending}
              >
                Cancelar compromisso
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Fechar
              </Button>
              <Button onClick={handleSubmit} disabled={isPending || !titulo.trim() || !dataInicio || !dataFim}>
                {isPending ? 'Salvando...' : editando ? 'Salvar' : 'Criar compromisso'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmarCancelamento}
        onOpenChange={setConfirmarCancelamento}
        onConfirm={handleCancelar}
        title="Cancelar compromisso"
        description="O período voltará a ficar disponível para agendamentos. Deseja continuar?"
        confirmText="Cancelar compromisso"
        cancelText="Voltar"
        variant="destructive"
        isLoading={cancelar.isPending}
      />
    </>
  )
}
