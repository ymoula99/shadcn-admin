import { createFileRoute } from '@tanstack/react-router'
import { DevisPage } from '@/features/devis'

export const Route = createFileRoute('/_authenticated/devis/')({
  component: DevisPage,
})
