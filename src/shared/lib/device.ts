export interface DadosDispositivo {
  userAgent: string
  plataforma: string
  fusoHorario: string
}

export function coletarDadosDispositivo(): DadosDispositivo {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  let fusoHorario = ''
  try {
    fusoHorario = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
  } catch {
    fusoHorario = ''
  }
  return {
    userAgent: nav.userAgent ?? '',
    plataforma: nav.userAgentData?.platform ?? nav.platform ?? '',
    fusoHorario,
  }
}
