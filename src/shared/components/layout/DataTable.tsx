import { useState, useMemo, type ReactNode } from 'react'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { EmptyState } from './EmptyState'
import { cn } from '@/shared/lib/cn'

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  enablePagination?: boolean
  enableSorting?: boolean
  enableFiltering?: boolean
  emptyMessage?: string
  renderActions?: (row: TData) => ReactNode
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  enablePagination = true,
  enableSorting = true,
  enableFiltering = true,
  emptyMessage = 'Nenhum registro encontrado',
  renderActions,
  globalFilter,
  onGlobalFilterChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex, pageSize })

  const tableColumns = useMemo(() => {
    if (!renderActions) return columns
    return [
      ...columns,
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }: { row: { original: TData } }) => renderActions(row.original),
      } as ColumnDef<TData>,
    ]
  }, [columns, renderActions])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    onSortingChange: enableSorting ? setSorting : undefined,
    onPaginationChange: enablePagination
      ? (updater) => {
          const next = typeof updater === 'function' ? updater(pagination) : updater
          setPagination(next)
          onPageChange?.(next.pageIndex)
          onPageSizeChange?.(next.pageSize)
        }
      : undefined,
    state: {
      sorting: enableSorting ? sorting : undefined,
      pagination: enablePagination ? pagination : undefined,
    },
    pageCount: enablePagination ? pageCount : undefined,
    manualPagination: true,
    manualSorting: true,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {enableFiltering && <Skeleton className="h-9 w-64" />}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((_col, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
                {renderActions && (
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((__, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {renderActions && (
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (!data.length) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="space-y-4">
      {enableFiltering && (
        <Input
          placeholder="Pesquisar..."
          value={globalFilter ?? ''}
          onChange={(e) => onGlobalFilterChange?.(e.target.value)}
          className="max-w-64"
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={cn(
                          'flex items-center gap-1 select-none',
                          enableSorting && header.column.getCanSort() && 'cursor-pointer hover:text-foreground',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getCanSort() && (
                          <>
                            {header.column.getIsSorted() === 'asc' && <ChevronUp className="h-4 w-4" />}
                            {header.column.getIsSorted() === 'desc' && <ChevronDown className="h-4 w-4" />}
                            {!header.column.getIsSorted() && <ChevronsUpDown className="h-4 w-4 opacity-30" />}
                          </>
                        )}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {enablePagination && pageCount && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Linhas por página:</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => {
                const size = Number(value)
                setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))
                onPageSizeChange?.(size)
                onPageChange?.(0)
              }}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))
                onPageChange?.(pagination.pageIndex - 1)
              }}
              disabled={pagination.pageIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground">
              Página {pagination.pageIndex + 1} de {pageCount}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))
                onPageChange?.(pagination.pageIndex + 1)
              }}
              disabled={pagination.pageIndex >= pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
