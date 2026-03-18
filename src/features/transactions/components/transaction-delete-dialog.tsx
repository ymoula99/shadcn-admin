import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Transaction, deleteTransaction } from '@/lib/db'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Transaction
  onDeleted: (id: string) => void
}

export function TransactionDeleteDialog({
  open,
  onOpenChange,
  currentRow,
  onDeleted,
}: Props) {
  async function handleDelete() {
    try {
      await deleteTransaction(currentRow.id)
      toast.success('Transaction supprimée.')
      onDeleted(currentRow.id)
      onOpenChange(false)
    } catch {
      toast.error('Une erreur est survenue lors de la suppression.')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Supprimer la transaction
        </span>
      }
      desc={
        <p>
          Êtes-vous sûr de vouloir supprimer cette transaction (
          <span className='font-bold'>
            {currentRow.departure_city || '?'} →{' '}
            {currentRow.arrival_city || '?'}
          </span>
          ) ? Cette action est irréversible.
        </p>
      }
      confirmText='Supprimer'
      destructive
    />
  )
}
