import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, FileDown, MoreVertical, Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { ListToolbar, MobileListCard } from '@/shared/components/mobile'
import { useFotografosList, useToggleStatusFotografo, useRemoverFotografo } from '../api/queries'
import { fotografoService } from '../services/fotografo.service'
import { toast } from 'sonner'

export function FotografosListPage() {
  const navigate = useNavigate()
  const { data: fotografos = [], isLoading } = useFotografosList()
  const toggleStatus = useToggleStatusFotografo()
  const remover = useRemoverFotografo()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = fotografos.filter((f) =>
    f.nome.toLowerCase().includes(search.toLowerCase()),
  )

  const handleExportAll = async () => {
    toast.info('Exportando relatório de todos os fotógrafos...')
    for (const f of fotografos) {
      try {
        await fotografoService.exportarCsv(f.id)
      } catch {
        toast.error(`Erro ao exportar CSV de ${f.nome}`)
      }
    }
    toast.success('Exportação concluída')
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await remover.mutateAsync(deleteId)
    } catch {
      /* toast já tratado na mutation */
    }
    setDeleteId(null)
  }

  type FotografoItem = (typeof fotografos)[number]

  const renderAcoes = (f: FotografoItem) => (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          toggleStatus.mutate(f.id)
        }}
        aria-label={f.ativo ? `Desativar ${f.nome}` : `Ativar ${f.nome}`}
      >
        {f.ativo ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/fotografos/${f.id}/editar`)
        }}
        aria-label={`Editar ${f.nome}`}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          fotografoService.exportarCsv(f.id)
        }}
        aria-label={`Exportar CSV de ${f.nome}`}
      >
        <FileDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          setDeleteId(f.id)
        }}
        aria-label={`Remover ${f.nome}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Fotógrafos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as finanças e ensaios dos fotógrafos
          </p>
        </div>
        <div className="flex gap-2">
          {fotografos.length > 0 && (
            <Button variant="outline" onClick={handleExportAll}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar todos
            </Button>
          )}
          <Button onClick={() => navigate('/fotografos/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fotógrafo
          </Button>
        </div>
      </div>

      <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar fotógrafo..." />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12">
          <Camera className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            {search ? 'Nenhum fotógrafo encontrado' : 'Nenhum fotógrafo cadastrado'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-md border md:block">
            <Table className="min-w-[480px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id} className="cursor-pointer" onClick={() => navigate(`/fotografos/${f.id}`)}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell>{f.email}</TableCell>
                    <TableCell>
                      <Badge variant={f.ativo ? 'success' : 'destructive'}>
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{renderAcoes(f)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((f) => (
              <MobileListCard
                key={f.id}
                onClick={() => navigate(`/fotografos/${f.id}`)}
                title={f.nome}
                subtitle={f.email}
                trailing={
                  <Badge variant={f.ativo ? 'success' : 'destructive'}>
                    {f.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                }
                actions={
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleStatus.mutate(f.id)}
                      aria-label={f.ativo ? `Desativar ${f.nome}` : `Ativar ${f.nome}`}
                    >
                      {f.ativo ? <ToggleLeft className="h-5 w-5" aria-hidden="true" /> : <ToggleRight className="h-5 w-5" aria-hidden="true" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/fotografos/${f.id}/editar`)}
                      aria-label={`Editar ${f.nome}`}
                    >
                      <Pencil className="h-5 w-5" aria-hidden="true" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Mais ações para ${f.nome}`}>
                          <MoreVertical className="h-5 w-5" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => fotografoService.exportarCsv(f.id)}>
                          <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
                          Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(f.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              />
            ))}
          </div>
        </>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Fotógrafo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este fotógrafo? Esta ação só é permitida se não houver
              ensaios vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
