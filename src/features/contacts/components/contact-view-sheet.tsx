import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from '@tanstack/react-router'
import { ExternalLink, Mail, Pencil, Trash2 } from 'lucide-react'
import { EmailComposeDialog } from '@/components/email-compose-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { type Contact, type Transaction, getTransactions } from '@/lib/db'
import { stageBadgeClass, stageLabel } from '@/features/transactions/stage-utils'
import { useContacts } from './contacts-provider'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
}

export function ContactViewSheet({ open, onOpenChange, contact }: Props) {
  const { setOpen } = useContacts()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  useEffect(() => {
    if (!open || !contact) return
    setLoading(true)
    getTransactions()
      .then((all) =>
        setTransactions(all.filter((t) => t.contact_id === contact.id))
      )
      .finally(() => setLoading(false))
  }, [open, contact])

  if (!contact) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex flex-col gap-0 overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {contact.first_name} {contact.last_name}
          </DialogTitle>
          <DialogDescription>
            {contact.type === 'entreprise' ? contact.company_name : 'Particulier'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4'>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Email
              </p>
              <p>{contact.email || '—'}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Téléphone
              </p>
              <p>{contact.phone || '—'}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Source
              </p>
              <p>{contact.source || '—'}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Créé le
              </p>
              <p>
                {format(new Date(contact.created_at), 'dd MMM yyyy', {
                  locale: fr,
                })}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className='text-sm font-medium mb-3'>
              Transactions ({transactions.length})
            </p>
            {loading ? (
              <p className='text-muted-foreground text-sm'>Chargement...</p>
            ) : transactions.length === 0 ? (
              <p className='text-muted-foreground text-sm'>
                Aucune transaction.
              </p>
            ) : (
              <div className='flex flex-col gap-2'>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
                  >
                    <div>
                      <p className='font-medium'>
                        {tx.departure_city || '?'} → {tx.arrival_city || '?'}
                      </p>
                      {tx.moving_date && (
                        <p className='text-muted-foreground text-xs'>
                          {format(new Date(tx.moving_date), 'dd MMM yyyy', {
                            locale: fr,
                          })}
                        </p>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className={stageBadgeClass(tx.stage)}
                      >
                        {stageLabel(tx.stage)}
                      </Badge>
                      <Link
                        to='/transactions'
                        className='text-muted-foreground hover:text-foreground'
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2 flex-wrap'>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setOpen('delete')}
          >
            <Trash2 size={14} />
            Supprimer
          </Button>
          <div className='flex gap-2 ml-auto'>
            {contact.email && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setEmailOpen(true)}
              >
                <Mail size={14} />
                Envoyer email
              </Button>
            )}
            <Button
              size='sm'
              onClick={() => setOpen('edit')}
            >
              <Pencil size={14} />
              Modifier
            </Button>
          </div>
        </DialogFooter>

        <EmailComposeDialog
          open={emailOpen}
          onOpenChange={setEmailOpen}
          defaultTo={contact.email ?? ''}
          defaultSubject={`Griffon Movers — ${contact.first_name} ${contact.last_name}`}
        />
      </DialogContent>
    </Dialog>
  )
}
