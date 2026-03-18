import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Eye, FilePlus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  type Devis,
  type DevisStatus,
  deleteDevis,
  getDevis,
  syncTransactionOnDevisAccepted,
  updateDevisStatus,
} from '@/lib/db'
import { cn } from '@/lib/utils'
import { DevisEditorSheet } from './components/devis-editor-sheet'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<DevisStatus, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
}
const STATUS_CLASS: Record<DevisStatus, string> = {
  brouillon: 'text-muted-foreground border-border',
  envoye: 'text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:text-blue-300',
  accepte: 'text-green-700 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-300',
  refuse: 'text-red-700 border-red-200 bg-red-50 dark:bg-red-950 dark:text-red-300',
}

const EUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

function totalTTC(devis: Devis) {
  const ht = devis.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  return ht * (1 + devis.tva_pct / 100)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DevisPage() {
  const [devisList, setDevisList] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingDevis, setEditingDevis] = useState<Devis | null>(null)
  const [deletingDevis, setDeletingDevis] = useState<Devis | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await getDevis()
      setDevisList(data)
    } catch {
      toast.error('Impossible de charger les devis.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = devisList.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.client_name.toLowerCase().includes(q) ||
      String(d.numero).includes(q) ||
      d.move_from?.toLowerCase().includes(q) ||
      d.move_to?.toLowerCase().includes(q)
    )
  })

  const handleStatusCycle = async (d: Devis) => {
    const order: DevisStatus[] = ['brouillon', 'envoye', 'accepte', 'refuse']
    const next = order[(order.indexOf(d.status) + 1) % order.length]
    try {
      await updateDevisStatus(d.id, next)
      setDevisList((prev) =>
        prev.map((x) => (x.id === d.id ? { ...x, status: next } : x))
      )
      if (next === 'accepte' && d.transaction_id) {
        await syncTransactionOnDevisAccepted(d.transaction_id)
      }
    } catch {
      toast.error('Erreur lors du changement de statut.')
    }
  }

  const handleDelete = async () => {
    if (!deletingDevis) return
    try {
      await deleteDevis(deletingDevis.id)
      setDevisList((prev) => prev.filter((d) => d.id !== deletingDevis.id))
      toast.success('Devis supprimé.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    } finally {
      setDeletingDevis(null)
    }
  }

  const openNew = () => {
    setEditingDevis(null)
    setEditorOpen(true)
  }

  const openEdit = (d: Devis) => {
    setEditingDevis(d)
    setEditorOpen(true)
  }

  const handleSaved = (d: Devis) => {
    setDevisList((prev) => {
      const exists = prev.find((x) => x.id === d.id)
      return exists ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev]
    })
  }

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Devis</h2>
            <p className='text-muted-foreground'>
              Créez et gérez vos devis de déménagement.
            </p>
          </div>
          <Button onClick={openNew}>
            <FilePlus size={15} />
            Nouveau devis
          </Button>
        </div>

        <div className='flex items-center gap-3'>
          <Input
            placeholder='Rechercher (client, numéro, ville...)'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-sm'
          />
          <span className='text-sm text-muted-foreground'>
            {filtered.length} devis
          </span>
        </div>

        <div className='rounded-lg border bg-card overflow-hidden'>
          {loading ? (
            <div className='text-muted-foreground py-12 text-center text-sm'>
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center text-sm'>
              {search ? 'Aucun résultat.' : 'Aucun devis pour le moment. Créez le premier !'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-28'>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className='w-28 text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className='group'>
                    <TableCell className='font-mono text-sm font-semibold text-muted-foreground'>
                      DEV-{String(d.numero).padStart(4, '0')}
                    </TableCell>
                    <TableCell className='font-medium'>{d.client_name}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {d.move_from && d.move_to
                        ? `${d.move_from} → ${d.move_to}`
                        : d.move_from || d.move_to || '—'}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {format(new Date(d.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className='font-semibold'>
                      {EUR(totalTTC(d))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={cn(
                          'text-xs cursor-pointer select-none',
                          STATUS_CLASS[d.status]
                        )}
                        onClick={() => handleStatusCycle(d)}
                        title='Cliquer pour changer le statut'
                      >
                        {STATUS_LABELS[d.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7'
                          onClick={() => openEdit(d)}
                          title='Modifier'
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 text-destructive hover:text-destructive'
                          onClick={() => setDeletingDevis(d)}
                          title='Supprimer'
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Main>

      {/* Editor */}
      <DevisEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        devis={editingDevis}
        onSaved={handleSaved}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deletingDevis} onOpenChange={(v) => !v && setDeletingDevis(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              DEV-{String(deletingDevis?.numero).padStart(4, '0')} —{' '}
              {deletingDevis?.client_name}. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
