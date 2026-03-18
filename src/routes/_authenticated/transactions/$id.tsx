import { createFileRoute } from '@tanstack/react-router'
import { TransactionPage } from '@/features/transactions/transaction-page'

export const Route = createFileRoute('/_authenticated/transactions/$id')({
  component: TransactionPage,
})
