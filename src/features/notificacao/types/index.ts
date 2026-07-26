export interface Notificacao {
  id: string
  userId: string
  titulo: string
  mensagem: string
  lida: boolean
  link: string | null
  createdAt: string
}
