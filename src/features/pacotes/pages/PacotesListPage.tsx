import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { usePacotesList, useDeletePacote } from '../api/queries'
import { PacoteList } from '../components/PacoteList'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import type { Pacote } from '../types'

export function PacotesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pacoteToDelete, setPacoteToDelete] = useState<Pacote | null>(null)

  const { data, isLoading } = usePacotesList()
  const { mutate: deletePacote, isPending: isDeleting } = useDeletePacote()

  const handleDelete = useCallback(() => {
    if (!pacoteToDelete) return
    deletePacote(pacoteToDelete.id, {
      onSuccess: () => setPacoteToDelete(null),
    })
  }, [pacoteToDelete, deletePacote])

  const filteredData = data?.filter(
    (p) =>
      !search ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao.toLowerCase().includes(search.toLowerCase()),
  )

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
        onDelete={setPacoteToDelete}
      />

      <ConfirmDialog
        open={!!pacoteToDelete}
        onOpenChange={(open) => { if (!open) setPacoteToDelete(null) }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir Pacote"
        description={
          pacoteToDelete
            ? `Tem certeza que deseja excluir o pacote "${pacoteToDelete.nome}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmText="Excluir"
        variant="destructive"
      />
    </>
  )
}
