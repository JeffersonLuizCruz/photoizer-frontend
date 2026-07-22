import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { useAddFotoExtra, useAddVideoExtra, useConfig } from '../api/queries'
import { indicadorService } from '@/features/comissoes/services/indicador.service'
import type { Agendamento } from '../types'

interface AdicionarExtrasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento
}

type TipoExtra = 'FOTO' | 'VIDEO'

export function AdicionarExtrasDialog({ open, onOpenChange, agendamento }: AdicionarExtrasDialogProps) {
  const [tipo, setTipo] = useState<TipoExtra>('FOTO')
  const [quantidade, setQuantidade] = useState(1)
  const [comissaoAtiva, setComissaoAtiva] = useState(false)
  const [indicadorSearch, setIndicadorSearch] = useState('')
  const [selectedIndicador, setSelectedIndicador] = useState<{ id: string; nome: string; telefone: string } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { mutate: addFoto, isPending: fotoPending } = useAddFotoExtra()
  const { mutate: addVideo, isPending: videoPending } = useAddVideoExtra()
  const { data: config, isLoading: configLoading } = useConfig()

  const { data: indicadores } = useQuery({
    queryKey: ['indicadores', 'search', indicadorSearch],
    queryFn: () => indicadorService.listar(indicadorSearch || undefined),
    enabled: comissaoAtiva && indicadorSearch.length >= 0,
  })

  const valorUnitario = tipo === 'FOTO'
    ? (config?.valorUnitarioFotoExtra ?? 0)
    : (config?.valorUnitarioVideoExtra ?? 0)
  const valorTotal = quantidade * valorUnitario
  const isPending = fotoPending || videoPending

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) {
      setTipo('FOTO')
      setQuantidade(1)
      setComissaoAtiva(false)
      setIndicadorSearch('')
      setSelectedIndicador(null)
    }
  }, [open])

  const handleSubmit = () => {
    if (quantidade < 1 || !config) return

    const indicadorPayload = selectedIndicador
      ? { indicadorId: selectedIndicador.id, indicadorNome: selectedIndicador.nome, indicadorTelefone: selectedIndicador.telefone }
      : comissaoAtiva && indicadorSearch.trim()
        ? { indicadorNome: indicadorSearch.trim(), indicadorTelefone: indicadorSearch.trim() }
        : {}

    const payload = {
      agendamentoId: agendamento.id,
      quantidade,
      valorUnitario,
      ...indicadorPayload,
    }

    if (tipo === 'FOTO') {
      addFoto(payload, {
        onSuccess: () => { onOpenChange(false); setQuantidade(1) },
      })
    } else {
      addVideo(payload, {
        onSuccess: () => { onOpenChange(false); setQuantidade(1) },
      })
    }
  }

  const filteredIndicadores = indicadores?.filter(
    (i) => !selectedIndicador || i.id !== selectedIndicador.id,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Extras</DialogTitle>
          {!configLoading && config && (
            <DialogDescription>
              Adicione fotos ou vídeos extras ao agendamento.
            </DialogDescription>
          )}
        </DialogHeader>

        {configLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : config ? (
          <div className="space-y-4">
            <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoExtra)}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="FOTO">Foto Extra</TabsTrigger>
                <TabsTrigger value="VIDEO">Vídeo Extra</TabsTrigger>
              </TabsList>
            </Tabs>

            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div className="rounded-lg bg-muted p-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor unitário</span>
                  <span>R$ {valorUnitario.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span>{quantidade}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>Valor total</span>
                  <span>R$ {valorTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="comissaoAtiva"
                  checked={comissaoAtiva}
                  onChange={(e) => setComissaoAtiva(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="comissaoAtiva" className="text-sm cursor-pointer">
                  Atribuir comissão de {config?.percentualComissao ?? 10}% a um indicador
                </Label>
              </div>

              {comissaoAtiva && (
                <div ref={searchRef} className="relative">
                  <Label>Indicador</Label>
                  {selectedIndicador ? (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>{selectedIndicador.nome} — {selectedIndicador.telefone}</span>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedIndicador(null); setIndicadorSearch('') }}>
                        Trocar
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Digite nome ou telefone..."
                        value={indicadorSearch}
                        onChange={(e) => { setIndicadorSearch(e.target.value); setShowDropdown(true) }}
                        onFocus={() => setShowDropdown(true)}
                      />
                      {showDropdown && filteredIndicadores && filteredIndicadores.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-auto">
                          {filteredIndicadores.map((ind) => (
                            <button
                              key={ind.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                              onClick={() => {
                                setSelectedIndicador({ id: ind.id, nome: ind.nome, telefone: ind.telefone })
                                setIndicadorSearch(ind.nome)
                                setShowDropdown(false)
                              }}
                            >
                              <span className="font-medium">{ind.nome}</span>
                              <span className="text-muted-foreground ml-2">{ind.telefone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Se o indicador não estiver na lista, cadastre-o antes em <strong>Comissões</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || quantidade < 1 || !config}>
            {isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
