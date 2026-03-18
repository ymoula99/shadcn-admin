import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Transaction } from '@/lib/db'
import { stageBadgeClass, stageLabel } from '../stage-utils'
import { TransactionRowActions } from './transaction-row-actions'

export const transactionsColumns: ColumnDef<Transaction>[] = [
  {
    id: 'contact',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Contact' />
    ),
    cell: ({ row }) => {
      const c = row.original.contact
      if (!c)
        return <span className='text-muted-foreground text-sm'>—</span>
      return (
        <div>
          <p className='font-medium text-sm'>
            {c.first_name} {c.last_name}
          </p>
          {c.company_name && (
            <p className='text-muted-foreground text-xs'>{c.company_name}</p>
          )}
        </div>
      )
    },
    enableHiding: false,
  },
  {
    id: 'trajet',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Trajet' />
    ),
    cell: ({ row }) => {
      const { departure_city, arrival_city } = row.original
      return (
        <div className='text-sm text-nowrap'>
          {departure_city || '?'} → {arrival_city || '?'}
        </div>
      )
    },
  },
  {
    accessorKey: 'moving_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date déménagement' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('moving_date') as string | null
      if (!date)
        return <span className='text-muted-foreground text-sm'>—</span>
      return (
        <div className={cn('text-sm text-nowrap')}>
          {format(new Date(date), 'dd MMM yyyy', { locale: fr })}
        </div>
      )
    },
  },
  {
    accessorKey: 'stage',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Étape' />
    ),
    cell: ({ row }) => {
      const stage = row.getValue('stage') as Transaction['stage']
      return (
        <Badge variant='outline' className={stageBadgeClass(stage)}>
          {stageLabel(stage)}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableSorting: false,
  },
  {
    accessorKey: 'assigned_to',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Assigné à' />
    ),
    cell: ({ row }) => (
      <div className='text-muted-foreground text-sm'>
        {row.getValue('assigned_to') || '—'}
      </div>
    ),
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: TransactionRowActions,
  },
]
