import { type Contact } from '@/lib/db'
import { ContactActionSheet } from './contact-action-sheet'
import { ContactDeleteDialog } from './contact-delete-dialog'
import { ContactViewSheet } from './contact-view-sheet'
import { useContacts } from './contacts-provider'

type Props = {
  onSaved: (contact: Contact) => void
  onDeleted: (id: string) => void
}

export function ContactsDialogs({ onSaved, onDeleted }: Props) {
  const { open, setOpen, currentRow, setCurrentRow } = useContacts()

  const closeAndClear = (dialogType: typeof open) => {
    setOpen(dialogType)
    setTimeout(() => setCurrentRow(null), 500)
  }

  return (
    <>
      <ContactActionSheet
        key='contact-add'
        open={open === 'add'}
        onOpenChange={() => closeAndClear('add')}
        onSaved={onSaved}
      />

      {currentRow && (
        <>
          <ContactViewSheet
            key={`contact-view-${currentRow.id}`}
            open={open === 'view'}
            onOpenChange={() => closeAndClear('view')}
            contact={currentRow}
          />

          <ContactActionSheet
            key={`contact-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => closeAndClear('edit')}
            currentRow={currentRow}
            onSaved={onSaved}
          />

          <ContactDeleteDialog
            key={`contact-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => closeAndClear('delete')}
            currentRow={currentRow}
            onDeleted={onDeleted}
          />
        </>
      )}
    </>
  )
}
