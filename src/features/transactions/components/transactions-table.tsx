import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { type Transaction } from '@/lib/db'
import { ALL_STAGES, stageBadgeClass, stageLabel } from '../stage-utils'
import { transactionsColumns as columns } from './transactions-columns'
import { useTransactions } from './transactions-provider'

type Props = {
  data: Transaction[]
}

export function TransactionsTable({ data }: Props) {
  const { setOpen, setCurrentRow } = useTransactions()
  const navigate = useNavigate()
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  useEffect(() => {
    table.setPageIndex(0)
  }, [globalFilter, columnFilters, table])

  const activeStageFilter = (
    columnFilters.find((f) => f.id === 'stage')?.value as string[] | undefined
  ) ?? []

  function toggleStageFilter(stage: string) {
    const current = activeStageFilter
    const next = current.includes(stage)
      ? current.filter((s) => s !== stage)
      : [...current, stage]
    if (next.length === 0) {
      setColumnFilters((prev) => prev.filter((f) => f.id !== 'stage'))
    } else {
      setColumnFilters((prev) => {
        const without = prev.filter((f) => f.id !== 'stage')
        return [...without, { id: 'stage', value: next }]
      })
    }
  }

  function clearStageFilter() {
    setColumnFilters((prev) => prev.filter((f) => f.id !== 'stage'))
  }

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex flex-col gap-3'>
        <Input
          placeholder='Rechercher une transaction...'
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className='max-w-sm'
        />
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-muted-foreground text-xs'>Filtrer par étape:</span>
          {ALL_STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => toggleStageFilter(stage)}
              className='cursor-pointer'
            >
              <Badge
                variant='outline'
                className={cn(
                  'transition-opacity',
                  activeStageFilter.includes(stage)
                    ? stageBadgeClass(stage)
                    : 'opacity-40',
                  activeStageFilter.length === 0 && 'opacity-100'
                )}
              >
                {stageLabel(stage)}
              </Badge>
            </button>
          ))}
          {activeStageFilter.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearStageFilter}
              className='h-6 px-2 text-xs text-muted-foreground'
            >
              <X size={12} />
              Effacer
            </Button>
          )}
        </div>
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'bg-background',
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row cursor-pointer'
                  onClick={() => navigate({ to: '/transactions/$id', params: { id: row.original.id } })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                      onClick={
                        cell.column.id === 'actions'
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Aucune transaction trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
