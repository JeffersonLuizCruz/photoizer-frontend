import { useFormContext } from 'react-hook-form'
import { usePacotesList } from '../api/queries'
import { FileUpload } from '@/shared/components/layout/FileUpload'
import { Label } from '@/shared/components/ui/label'
import { calcularValores } from '../utils/financeiro'
import type { WizardFormValues } from '../schemas/agendamento.schema'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

interface StepFinanceiroProps {
  comprovante: File | undefined
  onComprovanteChange: (file: File | undefined) => void
}

export function StepFinanceiro({ comprovante, onComprovanteChange }: StepFinanceiroProps) {
  const { register, watch } = useFormContext<WizardFormValues>()
  const { data: pacotes } = usePacotesList()

  const pacoteId = watch('pacoteId')
  const taxaDeslocamento = watch('taxaDeslocamento') ?? 0
  const pacote = pacotes?.find((p) => p.id === pacoteId)

  const valores = pacote
    ? calcularValores(pacote, taxaDeslocamento)
    : null

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Resumo Financeiro
        </h3>

        {valores ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pacote</span>
              <span className="font-medium">{pacote!.nome}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor do Pacote</span>
              <span className="font-medium">{formatCurrency(pacote!.valorBase)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Deslocamento</span>
              <span className="font-medium">{formatCurrency(taxaDeslocamento)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Valor Total</span>
                <span>{formatCurrency(valores.valorTotal)}</span>
              </div>
            </div>
            <div className="rounded-md bg-primary/5 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entrada (30%)</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(valores.valorEntradaExigido)} ✓
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Restante (70%)</span>
                <span className="font-medium">{formatCurrency(valores.valorRestante)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione um pacote no passo anterior para ver o resumo financeiro.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Comprovante de Entrada *
        </h3>
        <FileUpload
          accept="image/*,.pdf"
          maxFiles={1}
          label="Arraste o comprovante ou clique para selecionar"
          onFilesChange={(files) => onComprovanteChange(files[0])}
        />
        {comprovante && (
          <p className="mt-2 text-xs text-muted-foreground">
            Arquivo selecionado: {comprovante.name}
          </p>
        )}
        {!comprovante && (
          <p className="mt-1 text-xs text-destructive">
            O comprovante de entrada é obrigatório
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea
          id="observacoes"
          {...register('observacoes')}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Observações sobre o agendamento"
        />
      </div>
    </div>
  )
}
