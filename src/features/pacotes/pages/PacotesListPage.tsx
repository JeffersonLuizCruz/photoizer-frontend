import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { usePacotesList, useInativarPacote, useAtivarPacote } from '../api/queries'
import { PacoteList } from '../components/PacoteList'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import type { Pacote } from '../types'
import type { PacoteFormData } from '../schemas/pacote.schema'

export function PacotesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedPacote, setSelectedPacote] = useState<Pacote | null>(null)

  const { data, isLoading } = usePacotesList()
  const { mutate: inativarPacote, isPending: isInativando } = useInativarPacote()
  const { mutate: ativarPacote, isPending: isAtivandoMut } = useAtivarPacote()

  const isPending = isInativando || isAtivandoMut

  const handleToggleAtivo = useCallback((pacote: Pacote) => {
    setSelectedPacote(pacote)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!selectedPacote) return

    if (selectedPacote.ativo) {
      inativarPacote(selectedPacote.id, {
        onSuccess: () => setSelectedPacote(null),
      })
    } else {
      const payload: PacoteFormData = {
        nome: selectedPacote.nome,
        descricao: selectedPacote.descricao,
        quantidadeFotos: selectedPacote.quantidadeFotos,
        quantidadeVideos: selectedPacote.quantidadeVideos,
        valorBase: selectedPacote.valorBase,
        bloqueiaDiaInteiro: selectedPacote.bloqueiaDiaInteiro,
        duracaoEstimada: selectedPacote.duracaoEstimada ?? '',
        ativo: true,
        diasParaEntrega: selectedPacote.diasParaEntrega ?? undefined,
      }
      ativarPacote({ id: selectedPacote.id, payload }, {
        onSuccess: () => setSelectedPacote(null),
      })
    }
  }, [selectedPacote, inativarPacote, ativarPacote])

  const filteredData = data?.filter(
    (p) =>
      !search ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao.toLowerCase().includes(search.toLowerCase()),
  )

  const isAtivando = selectedPacote ? !selectedPacote.ativo : false

  return (
    <>
      <PageTitle
        title="Pacotes"
        description="Gerencie os pacotes de ensaio fotográfico"
        breadcrumbs={[{ label: 'Pacotes' }]}
        actions={
          <Button onClick={() => navigate(ROUTES.PACOTES_NOVO)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pacote
          </Button>
        }
      />

      <PacoteList
        data={filteredData ?? []}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        onToggleAtivo={handleToggleAtivo}
      />

      <ConfirmDialog
        open={!!selectedPacote}
        onOpenChange={(open) => { if (!open) setSelectedPacote(null) }}
        onConfirm={handleConfirm}
        isLoading={isPending}
        title={isAtivando ? 'Ativar Pacote' : 'Inativar Pacote'}
        description={
          selectedPacote
            ? isAtivando
              ? `Tem certeza que deseja ativar o pacote "${selectedPacote.nome}"? Ele ficará disponível para novos agendamentos.`
              : `Tem certeza que deseja inativar o pacote "${selectedPacote.nome}"? Ele não estará mais disponível para novos agendamentos.`
            : ''
        }
        confirmText={isAtivando ? 'Ativar' : 'Inativar'}
        variant={isAtivando ? 'default' : 'destructive'}
      />
    </>
  )
}
