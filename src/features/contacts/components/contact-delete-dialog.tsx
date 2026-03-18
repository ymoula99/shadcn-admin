import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Contact, deleteContact } from '@/lib/db'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Contact
  onDeleted: (id: string) => void
}

export function ContactDeleteDialog({
  open,
  onOpenChange,
  currentRow,
  onDeleted,
}: Props) {
  async function handleDelete() {
    try {
      await deleteContact(currentRow.id)
      toast.success('Contact supprimé.')
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
          Supprimer le contact
        </span>
      }
      desc={
        <p>
          Êtes-vous sûr de vouloir supprimer{' '}
          <span className='font-bold'>
            {currentRow.first_name} {currentRow.last_name}
          </span>
          ? Cette action est irréversible.
        </p>
      }
      confirmText='Supprimer'
      destructive
    />
  )
}
