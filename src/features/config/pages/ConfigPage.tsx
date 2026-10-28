import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Loader2, FileUp, RotateCcw, FileSignature, Trash2, RefreshCw } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
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
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoVersion, setLogoVersion] = useState(0)
  const [confirmarMarcaDagua, setConfirmarMarcaDagua] = useState(false)
  const [regerandoMarcaDagua, setRegerandoMarcaDagua] = useState(false)
  const [progressoMarcaDagua, setProgressoMarcaDagua] = useState<{ atual: number; total: number } | null>(null)
  const [resultadoMarcaDagua, setResultadoMarcaDagua] = useState<{ atualizadas: number; falhas: number } | null>(null)

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
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PROPOSTAS, 'fotografos', 'opcoes'] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.AGENDA, 'avulso', 'opcoes'] })
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

  const { mutate: enviarLogo, isPending: logoEnviando } = useMutation({
    mutationFn: (arquivo: File) => configService.uploadLogo(arquivo),
    onSuccess: () => {
      setLogoVersion((valor) => valor + 1)
      queryClient.invalidateQueries({ queryKey: ['config'] })
      toast.success('Logo atualizada com sucesso')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao enviar logo'))
    },
  })

  const { mutate: removerLogo, isPending: logoRemovendo } = useMutation({
    mutationFn: () => configService.removerLogo(),
    onSuccess: () => {
      setLogoVersion((valor) => valor + 1)
      queryClient.invalidateQueries({ queryKey: ['config'] })
      toast.success('Logo removida. A proposta voltará a usar a arte padrão')
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error, 'Erro ao remover logo'))
    },
  })

  const nomeContratadaSalvo = String(data?.nomeContratada ?? '').trim()
  const nomeFotografoSalvo = String(data?.nomeFotografo ?? '').trim()
  const marcaDaguaTexto = `© ${nomeContratadaSalvo || nomeFotografoSalvo || 'Estúdio'}`
  const formularioCarregado = values.nomeContratada !== undefined && values.nomeFotografo !== undefined
  const nomesAlterados = formularioCarregado && (
    nomeContratadaSalvo !== String(values.nomeContratada ?? '').trim()
    || nomeFotografoSalvo !== String(values.nomeFotografo ?? '').trim()
  )

  const atualizarMarcaDagua = async () => {
    setConfirmarMarcaDagua(false)
    setRegerandoMarcaDagua(true)
    setProgressoMarcaDagua(null)
    setResultadoMarcaDagua(null)
    try {
      const fotos = await configService.listarFotosMarcaDagua()
      if (fotos.length === 0) {
        toast.info('Nenhuma foto encontrada para atualizar.')
        return
      }

      setProgressoMarcaDagua({ atual: 0, total: fotos.length })
      let falhas = 0
      for (let indice = 0; indice < fotos.length; indice++) {
        try {
          await configService.regerarMarcaDagua(fotos[indice].fotoId)
        } catch {
          falhas += 1
        }
        setProgressoMarcaDagua({ atual: indice + 1, total: fotos.length })
      }

      const atualizadas = fotos.length - falhas
      setResultadoMarcaDagua({ atualizadas, falhas })
      if (falhas === 0) {
        toast.success(`${atualizadas} foto(s) atualizada(s) com a nova marca d'água.`)
      } else {
        toast.warning(`${atualizadas} foto(s) atualizada(s); ${falhas} falharam.`)
      }

      void queryClient.invalidateQueries({ queryKey: ['fotos'] })
      void queryClient.invalidateQueries({ queryKey: ['galeria-ensaio'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-ecommerce'] })
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Erro ao atualizar a marca d\'água'))
    } finally {
      setRegerandoMarcaDagua(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    enviarLogo(file)
    e.target.value = ''
  }

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

            <div className="rounded-xl border bg-card p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-h-[76px] w-full items-center justify-center rounded-2xl bg-white p-3 shadow-sm ring-1 ring-cyan-100 sm:w-auto sm:min-w-[160px]">
                  <img
                    key={logoVersion}
                    src={`/api/v1/config/logo?v=${logoVersion}`}
                    alt="Logo da contratada"
                    className="h-12 w-auto max-w-[200px] object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoEnviando || logoRemovendo}
                  >
                    {logoEnviando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileUp className="mr-1 h-4 w-4" />}
                    Enviar logo
                  </Button>
                  {data?.logoContratada ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removerLogo()}
                      disabled={logoEnviando || logoRemovendo}
                      className="text-destructive hover:text-destructive"
                    >
                      {logoRemovendo ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                      Remover
                    </Button>
                  ) : (
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-700 ring-1 ring-cyan-100">
                      Usando a arte padrão
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                PNG com fundo transparente, até 3 MB. A imagem é exibida na proposta pública do
                cliente, harmonizada com as cores da proposta. Formatos aceitos: PNG, JPG ou WEBP.
              </p>
            </div>

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
            <Button onClick={() => save()} disabled={isPending} className="w-full sm:w-auto">
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

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Marca d'água das fotos</h2>
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : data ? (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Texto atual</p>
                <p className="mt-1 text-sm font-semibold">{marcaDaguaTexto}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Fotos já enviadas mantêm a marca do momento do upload. Atualize para aplicar
                  o nome atual a todas as fotos das galerias. Os arquivos originais e os
                  downloads finais não são alterados.
                </p>

                {nomesAlterados && (
                  <p className="mt-2 text-xs font-medium text-amber-600">
                    Salve os dados da contratada/fotógrafo antes de atualizar a marca d'água.
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setConfirmarMarcaDagua(true)}
                  disabled={regerandoMarcaDagua || nomesAlterados}
                >
                  {regerandoMarcaDagua
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <RefreshCw className="mr-2 h-4 w-4" />}
                  Atualizar marca d'água
                </Button>

                {regerandoMarcaDagua && progressoMarcaDagua && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Atualizando {progressoMarcaDagua.atual} de {progressoMarcaDagua.total}...
                      </span>
                      <span className="font-medium tabular-nums">
                        {Math.round((progressoMarcaDagua.atual / progressoMarcaDagua.total) * 100)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(progressoMarcaDagua.atual / progressoMarcaDagua.total) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Mantenha esta página aberta até a conclusão.
                    </p>
                  </div>
                )}

                {resultadoMarcaDagua && !regerandoMarcaDagua && (
                  <p className={`mt-3 text-xs font-medium ${
                    resultadoMarcaDagua.falhas > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {resultadoMarcaDagua.atualizadas} foto(s) atualizada(s)
                    {resultadoMarcaDagua.falhas > 0
                      ? `; ${resultadoMarcaDagua.falhas} falharam.`
                      : '.'}
                  </p>
                )}
              </div>
            ) : null}
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
              <Button onClick={() => save()} disabled={isPending} className="w-full sm:w-auto">
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
              dataEnsaio, horarioEnsaio, duracaoEnsaio, localEnsaio, fotografoResponsavel, profissionaisEnsaio, pacoteNome, pacoteDescricao, precoFotoExtra,
              valorTotal, valorEntrada, statusReserva, percentualEntrada, valorRestante, contratadaNome, contratadaCnpj,
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

      <ConfirmDialog
        open={confirmarMarcaDagua}
        onOpenChange={setConfirmarMarcaDagua}
        onConfirm={() => void atualizarMarcaDagua()}
        title="Atualizar marca d'água das fotos?"
        description={`Todas as fotos das galerias serão reprocessadas com "${marcaDaguaTexto}". Isso pode levar alguns minutos; os arquivos originais não serão alterados.`}
        confirmText="Atualizar marca d'água"
        isLoading={regerandoMarcaDagua}
      />
    </>
  )
}
