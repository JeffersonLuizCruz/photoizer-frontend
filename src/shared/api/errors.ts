import { isAxiosError } from 'axios'

/**
 * Extrai a mensagem de erro de uma resposta da API.
 *
 * Prioriza `error.response.data.message` (formato do backend ErrorResponse).
 * Caso contrário, retorna o `fallback` fornecido.
 *
 * Nunca expõe a mensagem bruta do Axios ("Request failed with status code XXX").
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return fallback
}
