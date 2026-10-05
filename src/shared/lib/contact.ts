export function somenteDigitos(valor?: string | null): string {
  if (!valor) return ''
  return valor.replace(/\D/g, '')
}

export function telUrl(telefone?: string | null): string | null {
  const digitos = somenteDigitos(telefone)
  return digitos ? `tel:+${digitos}` : null
}

export function mailtoUrl(email?: string | null, assunto?: string): string | null {
  if (!email) return null
  const query = assunto ? `?subject=${encodeURIComponent(assunto)}` : ''
  return `mailto:${email}${query}`
}

export function whatsappUrl(telefone?: string | null, mensagem?: string): string | null {
  let digitos = somenteDigitos(telefone)
  if (!digitos) return null
  if (digitos.length <= 11) {
    digitos = `55${digitos}`
  }
  const query = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${digitos}${query}`
}
