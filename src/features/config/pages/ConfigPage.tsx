import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Loader2, FileUp, RotateCcw, FileSignature } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { configService } from '../services/config.service'
import { extractErrorMessage } from '@/shared/api'
import { QUERY_KEYS } from '@/shared/constants'

const FIELDS = [
  { key: 'valorUnitarioFotoExtra', label: 'Valor Unitário da Foto Extra (R$)', placeholder: '15.00', type: 'number' as const },
  { key: 'valorUnitarioVideoExtra', label: 'Valor Unitário do Vídeo Extra (R$)', placeholder: '50.00', type: 'number' as const },
  { key: 'percentualComissao', label: 'Percentual de Comissão (%)', placeholder: '10.00', type: 'number' as const },
  { key: 'percentualEntrada', label: 'Percentual de Entrada (%)', placeholder: '30.00', type: 'number' as const },
  { key: 'taxaDeslocamentoPadrao', label: 'Taxa de Deslocamento Padrão (R$)', placeholder: '0.00', type: 'number' as const },
] as const

const CONTRATADA_FIELDS = [
  { key: 'nomeContratada', label: 'Nome da Contratada', placeholder: 'Carol Oliva Fotografia' },
  { key: 'cnpjContratada', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { key: 'enderecoContratada', label: 'Cidade / Sede', placeholder: 'Cidade - UF' },
  { key: 'pixChave', label: 'Chave PIX', placeholder: 'CNPJ, CPF, e-mail ou telefone' },
  { key: 'pixTipoChave', label: 'Tipo da Chave PIX', placeholder: 'CNPJ' },
] as const

export function ConfigPage() {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})
  const [template, setTemplate] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => configService.get(),
    refetchOnWindowFocus: false,
  })

  const { data: templateData, isLoading: templateLoading } = useQuery({
    queryKey: ['config', 'contrato', 'template'],
    queryFn: () => configService.getTemplate(),
  })

  useEffect(() => {
    if (data) {
      setValues({
        valorUnitarioFotoExtra: String(data.valorUnitarioFotoExtra ?? '15.00'),
        valorUnitarioVideoExtra: String(data.valorUnitarioVideoExtra ?? '50.00'),
        percentualComissao: String(data.percentualComissao ?? '10.00'),
        percentualEntrada: String(data.percentualEntrada ?? '30.00'),
        taxaDeslocamentoPadrao: String(data.taxaDeslocamentoPadrao ?? '0.00'),
        nomeFotografo: String(data.nomeFotografo ?? ''),
        nomeContratada: String(data.nomeContratada ?? ''),
        cnpjContratada: String(data.cnpjContratada ?? ''),
        enderecoContratada: String(data.enderecoContratada ?? ''),
        pixChave: String(data.pixChave ?? ''),
        pixTipoChave: String(data.pixTipoChave ?? 'CNPJ'),
      })
    }
  }, [data])

  useEffect(() => {
    if (templateData !== undefined) {
      setTemplate(templateData)
    }
  }, [templateData])

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => configService.update(values),
    onSuccess: () => {
      setLastSavedAt(new Date())
      queryClient.invalidateQueries({ queryKey: ['config'] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PROPOSTAS, 'usuarios'] })
      toast.success('Configurações salvas com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao salvar configurações'))
    },
  })

  const { mutate: saveTemplate, isPending: templateSaving } = useMutation({
    mutationFn: () => configService.updateTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'contrato', 'template'] })
      toast.success('Template do contrato salvo com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao salvar template'))
    },
  })

  const { mutate: restaurarPadrao, isPending: restaurando } = useMutation({
    mutationFn: () => configService.restaurarTemplatePadrao(),
    onSuccess: (novoTemplate) => {
      setTemplate(novoTemplate)
      queryClient.invalidateQueries({ queryKey: ['config', 'contrato', 'template'] })
      toast.success('Template restaurado para o padrão')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao restaurar template'))
    },
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      if (content) setTemplate(content)
      toast.success('Arquivo carregado')
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <PageTitle
        title="Configurações"
        description="Valores globais do sistema e template do contrato"
        breadcrumbs={[{ label: 'Configurações' }]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {lastSavedAt && (
            <p className="text-xs text-muted-foreground">
              Última atualização:{' '}
              {lastSavedAt.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Dados da Contratada</h2>
            {CONTRATADA_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  placeholder={placeholder}
                  value={values[key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
            <Button onClick={() => save()} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar dados da contratada
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Fotógrafo Responsável</h2>
            <div className="space-y-2">
              <Label htmlFor="nomeFotografo">Nome do Fotógrafo</Label>
              <Input
                id="nomeFotografo"
                placeholder="Nome exibido como responsável e no contrato"
                value={values.nomeFotografo ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, nomeFotografo: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Ao salvar, este nome vira um fotógrafo selecionável na Nova Proposta e é exibido na
                linha &quot;Fotógrafo responsável&quot; do contrato.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold">Valores Financeiros</h2>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))
          ) : (
            <div className="space-y-4">
              {FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={placeholder}
                    value={values[key] ?? ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <Button onClick={() => save()} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar valores
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Template do Contrato
            </h2>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.html"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="mr-1 h-4 w-4" />
                Upload .txt
              </Button>
              <Button variant="outline" size="sm" onClick={() => restaurarPadrao()} disabled={restaurando}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Padrão
              </Button>
              <Button size="sm" onClick={() => saveTemplate()} disabled={templateSaving}>
                {templateSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Use <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{placeholder}}'}</code> para dados dinâmicos.
            Placeholders disponíveis:{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              clienteNome, clienteCPF, clienteTelefone, clienteEmail, clienteCidade, clienteEstado,
              dataEnsaio, horarioEnsaio, localEnsaio, fotografoResponsavel, profissionaisEnsaio, pacoteNome, precoFotoExtra,
              valorTotal, valorEntrada, percentualEntrada, valorRestante, contratadaNome, contratadaCnpj,
              contratadaCidade, pixChave, pixTipoChave, autorizaUsoImagem, taxaDeslocamento
            </code>
          </p>

          {templateLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={24}
              className="font-mono text-xs leading-relaxed"
              placeholder="Template do contrato..."
            />
          )}
        </div>
      </div>
    </>
  )
}
