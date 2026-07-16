import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useClientesList, useDeleteCliente } from '../api/queries'
import { ClienteList } from '../components/ClienteList'
import { ClienteDeleteDialog } from '../components/ClienteDeleteDialog'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { Cliente } from '../types'

export function ClientesListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useClientesList({
    page: page + 1,
    perPage: pageSize,
    search: debouncedSearch || undefined,
  })

  const { mutate: deleteCliente, isPending: isDeleting } = useDeleteCliente()

  const handleDelete = useCallback(() => {
    if (!clienteToDelete) return
    deleteCliente(clienteToDelete.id, {
      onSuccess: () => setClienteToDelete(null),
    })
  }, [clienteToDelete, deleteCliente])

  return (
    <>
      <PageTitle
        title="Clientes"
        description="Gerencie seus clientes cadastrados"
        breadcrumbs={[{ label: 'Clientes' }]}
        actions={
          <Button onClick={() => navigate(`${ROUTES.CLIENTES}/novo`)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      <ClienteList
        data={data?.data ?? []}
        isLoading={isLoading}
        pageCount={data?.totalPages ?? 1}
        pageIndex={page}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        onDelete={setClienteToDelete}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
      />

      <ClienteDeleteDialog
        cliente={clienteToDelete}
        open={!!clienteToDelete}
        onOpenChange={(open) => { if (!open) setClienteToDelete(null) }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
