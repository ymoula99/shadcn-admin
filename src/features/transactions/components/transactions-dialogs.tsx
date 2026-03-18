import { type Transaction } from '@/lib/db'
import { TransactionActionSheet } from './transaction-action-sheet'
import { TransactionDeleteDialog } from './transaction-delete-dialog'
import { TransactionViewDialog } from './transaction-view-dialog'
import { useTransactions } from './transactions-provider'

type Props = {
  onSaved: (tx: Transaction) => void
  onDeleted: (id: string) => void
}

export function TransactionsDialogs({ onSaved, onDeleted }: Props) {
  const { open, setOpen, currentRow, setCurrentRow } = useTransactions()

  const closeAndClear = (dialogType: typeof open) => {
    setOpen(dialogType)
    setTimeout(() => setCurrentRow(null), 500)
  }

  return (
    <>
      <TransactionActionSheet
        key='transaction-add'
        open={open === 'add'}
        onOpenChange={() => closeAndClear('add')}
        onSaved={onSaved}
      />

      {currentRow && (
        <>
          <TransactionViewDialog
            key={`transaction-view-${currentRow.id}`}
            open={open === 'view'}
            onOpenChange={() => closeAndClear('view')}
            transaction={currentRow}
          />

          <TransactionActionSheet
            key={`transaction-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => closeAndClear('edit')}
            currentRow={currentRow}
            onSaved={onSaved}
          />

          <TransactionDeleteDialog
            key={`transaction-delete-${currentRow.id}`}
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
