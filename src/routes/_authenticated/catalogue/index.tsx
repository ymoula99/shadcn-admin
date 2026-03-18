import { createFileRoute } from '@tanstack/react-router'
import { CataloguePage } from '@/features/catalogue'

export const Route = createFileRoute('/_authenticated/catalogue/')({
  component: CataloguePage,
})
