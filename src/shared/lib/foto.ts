/**
 * Identificacao visual da foto na galeria.
 *
 * O numero sequencial e a referencia curta usada por cliente e staff; o nome
 * do arquivo e a referencia operacional usada na edicao. Os dois devem
 * aparecer juntos para evitar ambiguidade.
 */
export function numeroGaleriaLabel(numero?: number | null): string {
  if (numero === null || numero === undefined) return ''
  return `#${String(numero).padStart(3, '0')}`
}

export function nomeArquivoFoto(fileName?: string | null): string {
  return fileName?.trim() || 'foto'
}

/**
 * Nome de exibição para a galeria pública: troca underscores por espaços e
 * remove sufixos internos de versão (ex.: "Jefferson Luiz_v1" -> "Jefferson Luiz").
 */
export function humanizarNome(valor?: string | null): string {
  if (!valor) return ''
  return valor
    .replace(/_/g, ' ')
    .replace(/\s+v\d+$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function rotuloFoto(foto: {
  numeroGaleria?: number | null
  fileName?: string | null
}): string {
  const numero = numeroGaleriaLabel(foto.numeroGaleria)
  const nome = nomeArquivoFoto(foto.fileName)
  return numero ? `${numero} · ${nome}` : nome
}

interface FotoComVersao {
  editadaEm?: string | null
  auditInfo?: { updatedAt?: string | null; createdAt?: string | null }
}

/**
 * Acrescenta o cache-buster de uma foto à URL informada.
 *
 * O endpoint de thumb é estável por foto; sem uma versão na URL o navegador
 * (e o AuthImage, que só refaz a busca quando `src` muda) continua exibindo a
 * imagem antiga depois de uma edição/substituição. A versão usa o momento da
 * edição e, na falta dele, o `updatedAt` do registro.
 */
function comVersaoDaFoto(url: string, foto: FotoComVersao): string {
  const versao = foto.editadaEm
    ?? foto.auditInfo?.updatedAt
    ?? foto.auditInfo?.createdAt
  if (!versao) return url
  const separador = url.includes('?') ? '&' : '?'
  return `${url}${separador}v=${encodeURIComponent(versao)}`
}

/** URL pública da miniatura (galeria do cliente). */
export function fotoThumbUrl(foto: { thumbUrl: string } & FotoComVersao): string {
  return comVersaoDaFoto(foto.thumbUrl, foto)
}

/**
 * URL autenticada da miniatura para o staff.
 *
 * O endpoint público só serve fotos PUBLICADA/PAGA. O workspace do staff
 * precisa exibir também as fotos INEDITA logo após o upload, então usa o
 * endpoint protegido do módulo foto.
 */
export function fotoStaffThumbUrl(
  foto: { id: string } & FotoComVersao,
  agendamentoId: string,
): string {
  return comVersaoDaFoto(
    `/api/v1/agendamentos/${agendamentoId}/fotos/${foto.id}/thumb`,
    foto,
  )
}
