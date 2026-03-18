import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { type Transaction } from '@/lib/db'
import { ALL_STAGES, stageBadgeClass, stageLabel } from '../stage-utils'

type Props = {
  data: Transaction[]
}

export function TransactionsKanban({ data }: Props) {
  const navigate = useNavigate()

  return (
    <div className='flex gap-3 overflow-x-auto pb-4'>
      {ALL_STAGES.map((stage) => {
        const cards = data.filter((tx) => tx.stage === stage)
        return (
          <div key={stage} className='flex flex-col gap-2 min-w-[220px] w-[220px]'>
            <div className='flex items-center justify-between px-1'>
              <Badge variant='outline' className={cn('text-xs', stageBadgeClass(stage))}>
                {stageLabel(stage)}
              </Badge>
              <span className='text-muted-foreground text-xs'>{cards.length}</span>
            </div>

            <div className='flex flex-col gap-2'>
              {cards.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => navigate({ to: '/transactions/$id', params: { id: tx.id } })}
                  className='text-left rounded-lg border bg-card p-3 shadow-xs hover:shadow-sm hover:border-foreground/20 transition-all cursor-pointer'
                >
                  <p className='text-sm font-medium leading-snug'>
                    {tx.contact
                      ? `${tx.contact.first_name} ${tx.contact.last_name}`
                      : '—'}
                  </p>
                  {tx.contact?.company_name && (
                    <p className='text-muted-foreground text-xs mt-0.5'>
                      {tx.contact.company_name}
                    </p>
                  )}
                  <p className='text-muted-foreground text-xs mt-2'>
                    {tx.departure_city || '?'} → {tx.arrival_city || '?'}
                  </p>
                  <div className='flex items-center justify-between mt-2'>
                    {tx.moving_date ? (
                      <span className='text-xs text-muted-foreground'>
                        {format(new Date(tx.moving_date), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    ) : (
                      <span />
                    )}
                    {tx.volume_m3 && (
                      <span className='text-xs text-muted-foreground'>
                        {tx.volume_m3} m³
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {cards.length === 0 && (
                <div className='rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground'>
                  Aucune
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
