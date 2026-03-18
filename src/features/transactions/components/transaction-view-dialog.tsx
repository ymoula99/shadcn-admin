import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ExternalLink,
  FilePlus,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
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
import {
  type Devis,
  type Transaction,
  createPandaDocDocument,
  getDevisForTransaction,
  refreshPandaDocStatus,
} from '@/lib/db'
import { DevisEditorSheet } from '@/features/devis/components/devis-editor-sheet'
import { stageBadgeClass, stageLabel } from '../stage-utils'
import { useTransactions } from './transactions-provider'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  onUpdated?: (tx: Transaction) => void
}

const PANDADOC_STATUS_LABELS: Record<string, string> = {
  'document.draft': 'Brouillon',
  'document.sent': 'Envoyé',
  'document.viewed': 'Consulté',
  'document.waiting_approval': 'En attente',
  'document.approved': 'Approuvé',
  'document.rejected': 'Refusé',
  'document.completed': 'Signé',
  'document.voided': 'Annulé',
  'document.expired': 'Expiré',
}

const PANDADOC_STATUS_CLASS: Record<string, string> = {
  'document.draft': 'text-muted-foreground border-border',
  'document.sent': 'text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:text-blue-300',
  'document.viewed': 'text-indigo-700 border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300',
  'document.waiting_approval': 'text-yellow-700 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300',
  'document.approved': 'text-teal-700 border-teal-200 bg-teal-50 dark:bg-teal-950 dark:text-teal-300',
  'document.completed': 'text-green-700 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-300',
  'document.voided': 'text-red-700 border-red-200 bg-red-50 dark:bg-red-950 dark:text-red-300',
  'document.rejected': 'text-red-700 border-red-200 bg-red-50 dark:bg-red-950 dark:text-red-300',
  'document.expired': 'text-orange-700 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:text-orange-300',
}

export function TransactionViewDialog({ open, onOpenChange, transaction, onUpdated }: Props) {
  const { setOpen } = useTransactions()
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [localTx, setLocalTx] = useState<Transaction | null>(null)
  const [devisOpen, setDevisOpen] = useState(false)
  const [editingDevis, setEditingDevis] = useState<Devis | null>(null)
  const [devisList, setDevisList] = useState<Devis[]>([])

  const tx = localTx ?? transaction

  useEffect(() => {
    if (open && tx?.id) {
      getDevisForTransaction(tx.id)
        .then(setDevisList)
        .catch(() => {})
    }
    if (!open) setDevisList([])
  }, [open, tx?.id])

  if (!tx) return null

  const contact = tx.contact
  const pandaStatus = tx.pandadoc_status
  const pandaDocId = tx.pandadoc_doc_id
  const pandaUrl = pandaDocId
    ? `https://app.pandadoc.com/a/#/documents/${pandaDocId}`
    : null

  const handleCreate = async () => {
    setCreating(true)
    try {
      const result = await createPandaDocDocument(tx.id)
      const updated = {
        ...tx,
        pandadoc_doc_id: result.doc_id,
        pandadoc_status: result.status,
      }
      setLocalTx(updated)
      onUpdated?.(updated)
      toast.success('Document créé dans PandaDoc.')
    } catch (e) {
      toast.error(`Erreur : ${e instanceof Error ? e.message : 'Inconnue'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleRefresh = async () => {
    if (!pandaDocId) return
    setRefreshing(true)
    try {
      const result = await refreshPandaDocStatus(pandaDocId, tx.id)
      const updated = { ...tx, pandadoc_status: result.status }
      setLocalTx(updated)
      onUpdated?.(updated)
      toast.success('Statut mis à jour.')
    } catch {
      toast.error('Impossible de rafraîchir le statut.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDevisSaved = (d: Devis) => {
    setDevisList((prev) => {
      const exists = prev.find((x) => x.id === d.id)
      return exists ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev]
    })
  }

  return (
    <>
      <DevisEditorSheet
        open={devisOpen}
        onOpenChange={setDevisOpen}
        devis={editingDevis}
        transaction={tx}
        onSaved={handleDevisSaved}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='flex flex-col gap-0 overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {tx.departure_city || '?'} → {tx.arrival_city || '?'}
          </DialogTitle>
          <DialogDescription>
            {contact
              ? `${contact.first_name} ${contact.last_name}`
              : 'Contact inconnu'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className={stageBadgeClass(tx.stage)}
            >
              {stageLabel(tx.stage)}
            </Badge>
          </div>

          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Date déménagement
              </p>
              <p>
                {tx.moving_date
                  ? format(new Date(tx.moving_date), 'dd MMM yyyy', { locale: fr })
                  : '—'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Volume
              </p>
              <p>{tx.volume_m3 ? `${tx.volume_m3} m³` : '—'}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Adresse départ
              </p>
              <p>
                {[tx.departure_address, tx.departure_postal_code, tx.departure_city]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Adresse arrivée
              </p>
              <p>
                {[tx.arrival_address, tx.arrival_postal_code, tx.arrival_city]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Assigné à
              </p>
              <p>{tx.assigned_to || '—'}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                Créé le
              </p>
              <p>
                {format(new Date(tx.created_at), 'dd MMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {tx.notes && (
            <>
              <Separator />
              <div>
                <p className='text-muted-foreground text-xs uppercase tracking-wide mb-1'>
                  Notes
                </p>
                <p className='text-sm whitespace-pre-wrap'>{tx.notes}</p>
              </div>
            </>
          )}

          {/* ── Devis section ── */}
          <Separator />
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <p className='text-muted-foreground text-xs uppercase tracking-wide'>
                Devis
              </p>
              <Button
                variant='outline'
                size='sm'
                className='h-7 text-xs gap-1.5'
                onClick={() => { setEditingDevis(null); setDevisOpen(true) }}
              >
                <FilePlus size={12} />
                Nouveau devis
              </Button>
            </div>

            {devisList.length === 0 ? (
              <p className='text-xs text-muted-foreground italic'>Aucun devis pour cette transaction.</p>
            ) : (
              <div className='flex flex-col gap-1.5'>
                {devisList.map((d) => (
                  <div
                    key={d.id}
                    className='flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2'
                  >
                    <div className='flex items-center gap-2'>
                      <FileText size={13} className='text-muted-foreground' />
                      <span className='text-sm font-mono font-semibold text-muted-foreground'>
                        DEV-{String(d.numero).padStart(4, '0')}
                      </span>
                      <span className='text-sm'>{d.client_name}</span>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7'
                      title='Modifier ce devis'
                      onClick={() => { setEditingDevis(d); setDevisOpen(true) }}
                    >
                      <Pencil size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PandaDoc section ── */}
          <Separator />
          <div className='flex flex-col gap-2'>
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>
              Document PandaDoc
            </p>

            {pandaDocId ? (
              <div className='flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2'>
                <div className='flex items-center gap-2'>
                  <FileText size={14} className='text-muted-foreground' />
                  <Badge
                    variant='outline'
                    className={PANDADOC_STATUS_CLASS[pandaStatus ?? ''] ?? 'text-muted-foreground border-border'}
                  >
                    {PANDADOC_STATUS_LABELS[pandaStatus ?? ''] ?? pandaStatus ?? 'Inconnu'}
                  </Badge>
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7'
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title='Rafraîchir le statut'
                  >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7'
                    asChild
                    title='Ouvrir dans PandaDoc'
                  >
                    <a href={pandaUrl!} target='_blank' rel='noopener noreferrer'>
                      <ExternalLink size={13} />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant='outline'
                size='sm'
                onClick={handleCreate}
                disabled={creating}
                className='w-fit'
              >
                {creating ? (
                  <Loader2 size={14} className='animate-spin' />
                ) : (
                  <FileText size={14} />
                )}
                {creating ? 'Création en cours...' : 'Créer le devis PandaDoc'}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setOpen('delete')}
          >
            <Trash2 size={14} />
            Supprimer
          </Button>
          <Button
            size='sm'
            onClick={() => setOpen('edit')}
          >
            <Pencil size={14} />
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
