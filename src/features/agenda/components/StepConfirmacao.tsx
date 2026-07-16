import { useFormContext } from 'react-hook-form'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePacotesList, useUsuariosList } from '../api/queries'
import { calcularValores } from '../utils/financeiro'
import type { WizardFormValues } from '../schemas/agendamento.schema'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

interface StepConfirmacaoProps {
  confirmado: boolean
  onConfirmadoChange: (value: boolean) => void
}

export function StepConfirmacao({ confirmado, onConfirmadoChange }: StepConfirmacaoProps) {
  const { watch } = useFormContext<WizardFormValues>()
  const { data: pacotes } = usePacotesList()
  const { data: usuarios } = useUsuariosList()

  const values = watch()
  const pacote = pacotes?.find((p) => p.id === values.pacoteId)
  const editor = usuarios?.find((u) => u.id === values.editorId)

  const valores = pacote
    ? calcularValores(pacote, values.taxaDeslocamento ?? 0)
    : null

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dados do Cliente
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Nome</dt>
            <dd className="font-medium">{values.nome}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Telefone</dt>
            <dd className="font-medium">{values.telefone}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{values.email || '-'}</dd>
          </div>
          {values.cpf && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">CPF</dt>
              <dd className="font-medium">{values.cpf}</dd>
            </div>
          )}
          {values.cidade && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cidade/Estado</dt>
              <dd className="font-medium">{values.cidade}{values.estado ? `/${values.estado}` : ''}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dados do Ensaio
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Pacote</dt>
            <dd className="font-medium text-right">{pacote?.nome ?? values.pacoteId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Data</dt>
            <dd className="font-medium">
              {values.data ? format(values.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '-'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Horário</dt>
            <dd className="font-medium">{values.hora}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Local</dt>
            <dd className="font-medium text-right">{values.localEnsaio}</dd>
          </div>
          {values.enderecoCompleto && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Endereço</dt>
              <dd className="font-medium text-right max-w-[60%]">{values.enderecoCompleto}</dd>
            </div>
          )}
          {editor && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Editor</dt>
              <dd className="font-medium">{editor.nome}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxa Deslocamento</dt>
            <dd className="font-medium">{formatCurrency(values.taxaDeslocamento ?? 0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Uso de Imagem</dt>
            <dd className="font-medium">{values.autorizaUsoImagem ? 'Autorizado' : 'Não autorizado'}</dd>
          </div>
        </dl>
      </div>

      {valores && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resumo Financeiro
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Valor Total</dt>
              <dd className="font-medium">{formatCurrency(valores.valorTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Entrada (30%)</dt>
              <dd className="font-medium text-green-600">{formatCurrency(valores.valorEntradaExigido)} ✓</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Restante (70%)</dt>
              <dd className="font-medium">{formatCurrency(valores.valorRestante)}</dd>
            </div>
          </dl>
        </div>
      )}

      {values.observacoes && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Observações
          </h3>
          <p className="text-sm">{values.observacoes}</p>
        </div>
      )}

      <label className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => onConfirmadoChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <div>
          <span className="text-sm font-medium">Declaro que as informações estão corretas</span>
          <p className="text-xs text-muted-foreground">
            Ao confirmar, o agendamento será registrado no sistema
          </p>
        </div>
      </label>
    </div>
  )
}
