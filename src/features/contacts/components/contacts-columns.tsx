import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Contact } from '@/lib/db'
import { ContactRowActions } from './contact-row-actions'

const sourceLabels: Record<string, string> = {
  dem24: 'Dem24',
  tel: 'Téléphone',
  email: 'Email',
  website: 'Site web',
  parrainage: 'Parrainage',
}

export const contactsColumns: ColumnDef<Contact>[] = [
  {
    id: 'fullName',
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nom' />
    ),
    cell: ({ row }) => {
      const { first_name, last_name } = row.original
      return (
        <LongText className='max-w-48 font-medium'>
          {first_name} {last_name}
        </LongText>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: 'company_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Entreprise' />
    ),
    cell: ({ row }) => (
      <div className='text-muted-foreground'>
        {row.getValue('company_name') || '—'}
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='text-nowrap'>{row.getValue('email') || '—'}</div>
    ),
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Téléphone' />
    ),
    cell: ({ row }) => <div>{row.getValue('phone') || '—'}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'source',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Source' />
    ),
    cell: ({ row }) => {
      const source = row.getValue('source') as string | null
      return (
        <div className='text-muted-foreground text-sm'>
          {source ? (sourceLabels[source] ?? source) : '—'}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Créé le' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string
      return (
        <div className={cn('text-muted-foreground text-sm text-nowrap')}>
          {format(new Date(date), 'dd MMM yyyy', { locale: fr })}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ContactRowActions,
  },
]
