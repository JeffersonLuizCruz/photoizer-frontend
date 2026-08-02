import { useState, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Search, X, User, Loader2, Percent } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/cn'
import { indicadorService } from '@/features/comissoes/services/indicador.service'
import type { WizardFormValues } from '../schemas/agendamento.schema'

export function StepIndicacao() {
  const { setValue, watch } = useFormContext<WizardFormValues>()
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedPercentual, setSelectedPercentual] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const indicadorNome = watch('indicadorNome')
  const indicadorTelefone = watch('indicadorTelefone')

  const { data: resultados, isFetching } = useQuery({
    queryKey: ['indicadores', 'search', search],
    queryFn: () => indicadorService.listar(search),
    enabled: search.length >= 2,
    staleTime: 1000 * 30,
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(id: string, nome: string, telefone: string, percentualComissao: number | null) {
    setSelectedId(id)
    setSelectedPercentual(percentualComissao)
    setValue('indicadorId', id, { shouldValidate: true })
    setValue('indicadorNome', nome, { shouldValidate: true })
    setValue('indicadorTelefone', telefone, { shouldValidate: true })
    setSearch('')
    setIsOpen(false)
  }

  function handleClear() {
    setSelectedId(null)
    setSelectedPercentual(null)
    setValue('indicadorId', '', { shouldValidate: true })
    setValue('indicadorNome', '', { shouldValidate: true })
    setValue('indicadorTelefone', '', { shouldValidate: true })
    setSearch('')
    inputRef.current?.focus()
  }

  const hasSelection = selectedId || (!search && indicadorNome && indicadorTelefone)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium">Indicação (opcional)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Busque por um indicador já cadastrado ou digite os dados manualmente.
          O indicador receberá uma comissão quando o pagamento for concluído.
        </p>
      </div>

      {selectedPercentual != null && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <Percent className="h-4 w-4 text-primary" />
          <span>
            Comissão de <strong>{selectedPercentual}%</strong> para este indicador.
          </span>
        </div>
      )}

      <div className="space-y-3">
        <Label>Buscar Indicador</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Digite nome ou telefone do indicador..."
            className="pl-9 pr-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {isOpen && search.length >= 2 && (
          <div
            ref={dropdownRef}
            className="rounded-lg border bg-card shadow-lg max-h-60 overflow-y-auto"
          >
            {resultados && resultados.length > 0 ? (
              resultados.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors',
                    selectedId === r.id && 'bg-muted/50',
                  )}
                  onClick={() => handleSelect(r.id, r.nome, r.telefone, r.percentualComissao)}
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
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                Nenhum indicador encontrado. Continue digitando para cadastrar um novo.
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou digite manualmente</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="indicadorNome">Nome do Indicador</Label>
            <div className="relative">
              <Input
                id="indicadorNome"
                placeholder="Quem indicou?"
                disabled={!!selectedId}
                value={indicadorNome ?? ''}
                onChange={(e) => {
                  setValue('indicadorNome', e.target.value, { shouldValidate: true })
                  if (selectedId) {
                    setSelectedId(null)
                    setSelectedPercentual(null)
                    setValue('indicadorId', '', { shouldValidate: true })
                  }
                }}
              />
              {hasSelection && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
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
              disabled={!!selectedId}
              value={indicadorTelefone ?? ''}
              onChange={(e) => {
                setValue('indicadorTelefone', e.target.value, { shouldValidate: true })
                if (selectedId) {
                  setSelectedId(null)
                  setSelectedPercentual(null)
                  setValue('indicadorId', '', { shouldValidate: true })
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
