function gerarHorarios(horaInicio: number, horaFim: number): string[] {
  const horarios: string[] = []
  for (let minutos = horaInicio * 60; minutos <= horaFim * 60; minutos += 30) {
    const hora = Math.floor(minutos / 60)
    const minuto = minutos % 60
    horarios.push(`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`)
  }
  return horarios
}

export const HORARIOS_ENSAIO = gerarHorarios(9, 18)
export const HORARIOS_COMPROMISSO = gerarHorarios(6, 22)

export const AGENDA_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'PRE_RESERVA', label: 'Pré-reserva' },
  { value: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovação' },
  { value: 'PAGAMENTO_CONFIRMADO', label: 'Pagamento Confirmado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'AGUARDANDO_PAGAMENTO_FINAL', label: 'Aguardando Pagamento' },
  { value: 'EM_EDICAO', label: 'Em Edição' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Não Compareceu' },
]
