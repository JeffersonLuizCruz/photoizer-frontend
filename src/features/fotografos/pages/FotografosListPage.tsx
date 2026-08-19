import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, FileDown, Pencil, Plus, Search, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
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
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar fotógrafo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 w-full bg-muted rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 flex flex-col items-center justify-center">
          <Camera className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            {search ? 'Nenhum fotógrafo encontrado' : 'Nenhum fotógrafo cadastrado'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStatus.mutate(f.id)
                        }}
                        title={f.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {f.ativo ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/fotografos/${f.id}/editar`)
                        }}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          fotografoService.exportarCsv(f.id)
                        }}
                        title="Exportar CSV"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(f.id)
                            }}
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Fotógrafo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover <strong>{f.nome}</strong>?
                              Esta ação só é permitida se o fotógrafo não tiver ensaios vinculados.
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}