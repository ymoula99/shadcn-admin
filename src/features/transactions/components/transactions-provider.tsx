import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Transaction } from '@/lib/db'

type TransactionsDialogType = 'add' | 'view' | 'edit' | 'delete'

type TransactionsContextType = {
  open: TransactionsDialogType | null
  setOpen: (str: TransactionsDialogType | null) => void
  currentRow: Transaction | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Transaction | null>>
}

const TransactionsContext =
  React.createContext<TransactionsContextType | null>(null)

export function TransactionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<TransactionsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Transaction | null>(null)

  return (
    <TransactionsContext
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </TransactionsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTransactions = () => {
  const ctx = React.useContext(TransactionsContext)
  if (!ctx)
    throw new Error(
      'useTransactions must be used within <TransactionsProvider>'
    )
  return ctx
}
