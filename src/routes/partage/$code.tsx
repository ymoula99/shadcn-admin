import { createFileRoute } from '@tanstack/react-router'
import { ShareView } from '@/features/share'

export const Route = createFileRoute('/partage/$code')({
  component: () => {
    const { code } = Route.useParams()
    return <ShareView code={code} />
  },
})
