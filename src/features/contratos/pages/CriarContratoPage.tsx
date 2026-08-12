import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Loader2, Percent, Search, User, X } from 'lucide-react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { ROUTES } from '@/shared/constants'
import { formatCurrency } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { criarContratoSchema, type CriarContratoFormValues } from '../schemas/contrato.schema'
import { useCriarContrato, usePacotesOptions, useUsuariosOptions, useIndicadoresSearch } from '../api/queries'

const defaultValues: CriarContratoFormValues = {
  pacoteId: '',
  data: '',
  hora: '',
  localEnsaio: '',
  enderecoCompleto: '',
  editorId: '',
  custoDeslocamento: 0,
  repassarDeslocamento: true,
  clienteId: '',
  observacoes: '',
}

export function CriarContratoPage() {
  const navigate = useNavigate()
  const criar = useCriarContrato()
  const { data: pacotes = [] } = usePacotesOptions()
  const { data: usuarios = [] } = useUsuariosOptions()
  const [pacoteSelecionado, setPacoteSelecionado] = useState<string>('')
  const [searchIndicador, setSearchIndicador] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndicadorId, setSelectedIndicadorId] = useState<string | null>(null)
  const [selectedPercentual, setSelectedPercentual] = useState<number | null>(null)
  const inputIndicadorRef = useRef<HTMLInputElement>(null)
  const dropdownIndicadorRef = useRef<HTMLDivElement>(null)
  const { data: indicadores = [] } = useIndicadoresSearch(searchIndicador)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownIndicadorRef.current &&
        !dropdownIndicadorRef.current.contains(event.target as Node) &&
        inputIndicadorRef.current &&
        !inputIndicadorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CriarContratoFormValues>({
    resolver: zodResolver(criarContratoSchema),
    defaultValues,
  })

  const repassar = watch('repassarDeslocamento')

  const indicadorNome = watch('indicadorNome')
  const indicadorTelefone = watch('indicadorTelefone')

  const hasIndicador = selectedIndicadorId || (!searchIndicador && indicadorNome && indicadorTelefone)

  function handleSelectIndicador(id: string, nome: string, telefone: string, percentualComissao: number | null) {
    setSelectedIndicadorId(id)
    setSelectedPercentual(percentualComissao)
    setValue('indicadorId', id)
    setValue('indicadorNome', nome)
    setValue('indicadorTelefone', telefone)
    setSearchIndicador('')
    setIsOpen(false)
  }

  function handleClearIndicador() {
    setSelectedIndicadorId(null)
    setSelectedPercentual(null)
    setValue('indicadorId', '')
    setValue('indicadorNome', '')
    setValue('indicadorTelefone', '')
    setSearchIndicador('')
    inputIndicadorRef.current?.focus()
  }

  const onSubmit = async (data: CriarContratoFormValues) => {
    try {
      const contrato = await criar.mutateAsync(data)
      navigate(ROUTES.CONTRATOS_NOVO.replace('/novo', `/${contrato.id}`))
    } catch {
      /* toast já tratado na mutation */
    }
  }

  return (
    <div className="p-6">
      <PageTitle
        title="Novo Contrato"
        description="Preencha os dados do ensaio para gerar o contrato"
        breadcrumbs={[
          { label: 'Contratos', href: ROUTES.CONTRATOS },
          { label: 'Novo contrato' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pacoteId">Pacote *</Label>
            <Select
              value={pacoteSelecionado}
              onValueChange={(value) => {
                setPacoteSelecionado(value)
                setValue('pacoteId', value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o pacote" />
              </SelectTrigger>
              <SelectContent>
                {pacotes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} — {formatCurrency(p.valorBase)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pacoteId && <p className="mt-1 text-sm text-destructive">{errors.pacoteId.message}</p>}
          </div>

          <div>
            <Label htmlFor="data">Data do ensaio *</Label>
            <Input id="data" type="date" {...register('data')} />
            {errors.data && <p className="mt-1 text-sm text-destructive">{errors.data.message}</p>}
          </div>

          <div>
            <Label htmlFor="hora">Horário *</Label>
            <Input id="hora" type="time" {...register('hora')} />
            {errors.hora && <p className="mt-1 text-sm text-destructive">{errors.hora.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="localEnsaio">Local do ensaio *</Label>
            <Input id="localEnsaio" {...register('localEnsaio')} placeholder="Praça, estúdio, etc." />
            {errors.localEnsaio && <p className="mt-1 text-sm text-destructive">{errors.localEnsaio.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="enderecoCompleto">Endereço completo</Label>
            <Input id="enderecoCompleto" {...register('enderecoCompleto')} placeholder="Rua, número, bairro" />
          </div>

          <div>
            <Label htmlFor="editorId">Editor responsável</Label>
            <Select
              onValueChange={(value) => setValue('editorId', value || '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="custoDeslocamento">
              Custo de deslocamento
            </Label>
            <Input
              id="custoDeslocamento"
              type="number"
              step="0.01"
              defaultValue={0}
              {...register('custoDeslocamento', { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="repassarDeslocamento"
              checked={repassar}
              onCheckedChange={(checked) => setValue('repassarDeslocamento', checked)}
            />
            <Label htmlFor="repassarDeslocamento">Repassar deslocamento ao cliente</Label>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register('observacoes')} rows={3} placeholder="Observações internas sobre o contrato" />
          </div>

          <div className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Indicação (opcional)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Busque por um indicador já cadastrado ou digite os dados manualmente.
                O indicador receberá uma comissão quando o pagamento for concluído.
              </p>
            </div>

            {selectedPercentual != null && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                <Percent className="h-4 w-4 text-primary" />
                <span>Comissão de <strong>{selectedPercentual}%</strong> para este indicador.</span>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputIndicadorRef}
                placeholder="Digite nome ou telefone do indicador..."
                className="pl-9 pr-8"
                value={searchIndicador}
                onChange={(e) => { setSearchIndicador(e.target.value); setIsOpen(true) }}
                onFocus={() => setIsOpen(true)}
              />
            </div>

            {isOpen && searchIndicador.length >= 2 && (
              <div ref={dropdownIndicadorRef} className="rounded-lg border bg-card shadow-lg max-h-60 overflow-y-auto">
                {indicadores.length > 0 ? indicadores.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors',
                      selectedIndicadorId === r.id && 'bg-muted/50',
                    )}
                    onClick={() => handleSelectIndicador(r.id, r.nome, r.telefone, r.percentualComissao)}
                  >
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.nome}</p>
                      <p className="text-xs text-muted-foreground">{r.telefone}</p>
                    </div>
                    {r.percentualComissao != null && (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {r.percentualComissao}%
                      </span>
                    )}
                  </button>
                )) : (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Nenhum indicador encontrado. Continue digitando para cadastrar um novo.
                  </p>
                )}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou digite manualmente</span></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="indicadorNome">Nome do Indicador</Label>
                <div className="relative">
                  <Input
                    id="indicadorNome"
                    placeholder="Quem indicou?"
                    disabled={!!selectedIndicadorId}
                    value={(indicadorNome as string) ?? ''}
                    onChange={(e) => {
                      setValue('indicadorNome', e.target.value)
                      if (selectedIndicadorId) {
                        setSelectedIndicadorId(null); setSelectedPercentual(null)
                        setValue('indicadorId', '')
                      }
                    }}
                  />
                  {hasIndicador && (
                    <button type="button" onClick={handleClearIndicador}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="indicadorTelefone">Telefone do Indicador</Label>
                <Input
                  id="indicadorTelefone"
                  placeholder="(11) 99999-9999"
                  disabled={!!selectedIndicadorId}
                  value={(indicadorTelefone as string) ?? ''}
                  onChange={(e) => {
                    setValue('indicadorTelefone', e.target.value)
                    if (selectedIndicadorId) {
                      setSelectedIndicadorId(null); setSelectedPercentual(null)
                      setValue('indicadorId', '')
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.CONTRATOS)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={criar.isPending}>
            {criar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar contrato
          </Button>
        </div>
      </form>
    </div>
  )
}