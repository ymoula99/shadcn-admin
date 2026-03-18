import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { deleteTasks } from '@/lib/db'
import type { Task } from '@/lib/db'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTasks } from './tasks-provider'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<Task>
}

const CONFIRM_WORD = 'SUPPRIMER'

export function TasksMultiDeleteDialog({ open, onOpenChange, table }: Props) {
  const [value, setValue] = useState('')
  const { refreshData } = useTasks()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = async () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Veuillez taper « ${CONFIRM_WORD} » pour confirmer.`)
      return
    }
    try {
      const ids = selectedRows.map((row) => (row.original as Task).id)
      await deleteTasks(ids)
      await refreshData()
      setValue('')
      table.resetRowSelection()
      onOpenChange(false)
      toast.success(`${ids.length} tâche(s) supprimée(s).`)
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Supprimer {selectedRows.length} tâche(s)
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Êtes-vous sûr de vouloir supprimer les tâches sélectionnées ?{' '}
            <br />
            Cette action est irréversible.
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span>Tapez « {CONFIRM_WORD} » pour confirmer :</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Tapez « ${CONFIRM_WORD} »`}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Attention !</AlertTitle>
            <AlertDescription>
              Cette opération ne peut pas être annulée.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Supprimer'
      destructive
    />
  )
}
