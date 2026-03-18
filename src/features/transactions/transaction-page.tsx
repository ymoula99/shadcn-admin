import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  FilePlus,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Save,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { RichTextEditor } from '@/components/rich-text-editor'
import {
  type Devis,
  type Transaction,
  type TransactionStage,
  deleteTransaction,
  getDevisForTransaction,
  getTransaction,
  saveTransaction,
  syncDevisOnTransactionSigned,
} from '@/lib/db'
import { DevisEditorSheet } from '@/features/devis/components/devis-editor-sheet'
import { ALL_STAGES, stageBadgeClass, stageLabel } from './stage-utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function totalTTC(d: Devis) {
  const ht = d.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  return ht * (1 + d.tva_pct / 100)
}

const DEVIS_STATUS_CLASS: Record<string, string> = {
  brouillon: 'text-muted-foreground border-border',
  envoye: 'text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:text-blue-300',
  accepte: 'text-green-700 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-300',
  refuse: 'text-red-700 border-red-200 bg-red-50 dark:bg-red-950 dark:text-red-300',
}
const DEVIS_STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé',
}

// ─── Boolean toggle field ──────────────────────────────────────────────────────

function BoolField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  return (
    <div className='flex items-center justify-between'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <div className='flex items-center gap-1'>
        <button
          type='button'
          onClick={() => onChange(value === true ? null : true)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
            value === true
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:text-green-300'
              : 'border-border text-muted-foreground hover:border-green-300'
          }`}
        >
          <CheckCircle2 size={11} /> Oui
        </button>
        <button
          type='button'
          onClick={() => onChange(value === false ? null : false)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
            value === false
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:text-red-300'
              : 'border-border text-muted-foreground hover:border-red-300'
          }`}
        >
          <CircleOff size={11} /> Non
        </button>
      </div>
    </div>
  )
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className='flex items-center gap-2 mb-3'>
      <div className='rounded-md bg-[#a2831f]/10 p-1.5'>
        <Icon size={13} className='text-[#a2831f]' />
      </div>
      <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {children}
      </span>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function TransactionPage() {
  const { id } = useParams({ from: '/_authenticated/transactions/$id' })
  const navigate = useNavigate()

  const [tx, setTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [devisList, setDevisList] = useState<Devis[]>([])
  const [devisOpen, setDevisOpen] = useState(false)
  const [editingDevis, setEditingDevis] = useState<Devis | null>(null)

  // Form state (mirrors tx fields)
  const [stage, setStage] = useState<TransactionStage>('prospect')
  const [depAddress, setDepAddress] = useState('')
  const [depPostal, setDepPostal] = useState('')
  const [depCity, setDepCity] = useState('')
  const [depFloor, setDepFloor] = useState<string>('')
  const [depElevator, setDepElevator] = useState<boolean | null>(null)
  const [depLift, setDepLift] = useState<boolean | null>(null)
  const [arrAddress, setArrAddress] = useState('')
  const [arrPostal, setArrPostal] = useState('')
  const [arrCity, setArrCity] = useState('')
  const [arrFloor, setArrFloor] = useState<string>('')
  const [arrElevator, setArrElevator] = useState<boolean | null>(null)
  const [arrLift, setArrLift] = useState<boolean | null>(null)
  const [movingDate, setMovingDate] = useState('')
  const [volume, setVolume] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const populate = useCallback((t: Transaction) => {
    setStage(t.stage)
    setDepAddress(t.departure_address ?? '')
    setDepPostal(t.departure_postal_code ?? '')
    setDepCity(t.departure_city ?? '')
    setDepFloor(t.departure_floor != null ? String(t.departure_floor) : '')
    setDepElevator(t.departure_elevator ?? null)
    setDepLift(t.departure_lift ?? null)
    setArrAddress(t.arrival_address ?? '')
    setArrPostal(t.arrival_postal_code ?? '')
    setArrCity(t.arrival_city ?? '')
    setArrFloor(t.arrival_floor != null ? String(t.arrival_floor) : '')
    setArrElevator(t.arrival_elevator ?? null)
    setArrLift(t.arrival_lift ?? null)
    setMovingDate(t.moving_date ? t.moving_date.slice(0, 10) : '')
    setVolume(t.volume_m3 != null ? String(t.volume_m3) : '')
    setAssignedTo(t.assigned_to ?? '')
    setNotes(t.notes ?? '')
    setIsDirty(false)
  }, [])

  useEffect(() => {
    Promise.all([
      getTransaction(id),
      getDevisForTransaction(id),
    ]).then(([t, d]) => {
      setTx(t)
      populate(t)
      setDevisList(d)
    }).catch(() => toast.error('Transaction introuvable.'))
      .finally(() => setLoading(false))
  }, [id, populate])

  // Mark dirty on any change
  const mark = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setIsDirty(true) }

  const handleSave = async () => {
    if (!tx) return
    setSaving(true)
    try {
      const updated = await saveTransaction({
        id: tx.id,
        contact_id: tx.contact_id,
        stage,
        departure_address: depAddress || null,
        departure_postal_code: depPostal || null,
        departure_city: depCity || null,
        departure_floor: depFloor !== '' ? Number(depFloor) : null,
        departure_elevator: depElevator,
        departure_lift: depLift,
        arrival_address: arrAddress || null,
        arrival_postal_code: arrPostal || null,
        arrival_city: arrCity || null,
        arrival_floor: arrFloor !== '' ? Number(arrFloor) : null,
        arrival_elevator: arrElevator,
        arrival_lift: arrLift,
        moving_date: movingDate || null,
        volume_m3: volume !== '' ? Number(volume) : null,
        assigned_to: assignedTo || null,
        notes: notes || null,
        lost_reason: tx.lost_reason,
        pandadoc_doc_id: tx.pandadoc_doc_id,
        pandadoc_status: tx.pandadoc_status,
      })
      setTx(updated)
      setIsDirty(false)
      if (stage === 'signe') {
        await syncDevisOnTransactionSigned(tx.id)
        setDevisList((prev) => prev.map((d) => d.status !== 'accepte' ? { ...d, status: 'accepte' } : d))
      }
      toast.success('Transaction mise à jour.')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!tx) return
    try {
      await deleteTransaction(tx.id)
      toast.success('Transaction supprimée.')
      navigate({ to: '/transactions' })
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  const handleDevisSaved = (d: Devis) => {
    setDevisList((prev) => {
      const exists = prev.find((x) => x.id === d.id)
      return exists ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev]
    })
  }

  const contact = tx?.contact
  const contactName = contact
    ? `${contact.first_name} ${contact.last_name}`
    : '—'

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon' onClick={() => navigate({ to: '/transactions' })}>
            <ArrowLeft size={16} />
          </Button>
          <Separator orientation='vertical' className='h-5' />
          {tx && (
            <>
              <span className='font-semibold text-sm truncate max-w-[200px]'>{contactName}</span>
              <Badge variant='outline' className={stageBadgeClass(stage)}>
                {stageLabel(stage)}
              </Badge>
            </>
          )}
        </div>
        <div className='ms-auto flex items-center gap-2'>
          {isDirty && (
            <Button size='sm' onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className='animate-spin' /> : <Save size={14} />}
              Enregistrer
            </Button>
          )}
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed fluid className='p-0 overflow-hidden'>
        {loading ? (
          <div className='flex flex-1 items-center justify-center text-muted-foreground'>
            Chargement...
          </div>
        ) : !tx ? (
          <div className='flex flex-1 items-center justify-center text-muted-foreground'>
            Transaction introuvable.
          </div>
        ) : (
          <ResizablePanelGroup direction='horizontal' className='h-full'>

            {/* ── Left panel: info ── */}
            <ResizablePanel defaultSize='38%' minSize='280px' maxSize='55%'>
              <ScrollArea className='h-full'>
                <div className='p-6 flex flex-col gap-6'>

                  {/* Stage + actions */}
                  <div className='flex flex-col gap-3'>
                    <SectionTitle icon={User}>Étape pipeline</SectionTitle>
                    <Select value={stage} onValueChange={(v) => { mark(setStage)(v as TransactionStage) }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>{stageLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <span>Client :</span>
                      <span className='font-medium text-foreground'>{contactName}</span>
                      {contact?.email && <span className='text-muted-foreground'>· {contact.email}</span>}
                    </div>
                  </div>

                  <Separator />

                  {/* Départ */}
                  <div>
                    <SectionTitle icon={MapPin}>Adresse de départ</SectionTitle>
                    <div className='flex flex-col gap-3'>
                      <div>
                        <Label className='text-xs mb-1 block'>Adresse</Label>
                        <Input value={depAddress} onChange={(e) => mark(setDepAddress)(e.target.value)} placeholder='12 rue de la Paix' className='h-8 text-sm' />
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <Label className='text-xs mb-1 block'>Code postal</Label>
                          <Input value={depPostal} onChange={(e) => mark(setDepPostal)(e.target.value)} placeholder='75001' className='h-8 text-sm' />
                        </div>
                        <div>
                          <Label className='text-xs mb-1 block'>Ville</Label>
                          <Input value={depCity} onChange={(e) => mark(setDepCity)(e.target.value)} placeholder='Paris' className='h-8 text-sm' />
                        </div>
                      </div>
                      <div>
                        <Label className='text-xs mb-1 block'>Étage</Label>
                        <Input type='number' min={0} value={depFloor} onChange={(e) => mark(setDepFloor)(e.target.value)} placeholder='0 = RDC' className='h-8 text-sm w-24' />
                      </div>
                      <BoolField label='Ascenseur disponible' value={depElevator} onChange={mark(setDepElevator)} />
                      <BoolField label='Monte-meubles à prévoir' value={depLift} onChange={mark(setDepLift)} />
                    </div>
                  </div>

                  <Separator />

                  {/* Arrivée */}
                  <div>
                    <SectionTitle icon={Building2}>Adresse d'arrivée</SectionTitle>
                    <div className='flex flex-col gap-3'>
                      <div>
                        <Label className='text-xs mb-1 block'>Adresse</Label>
                        <Input value={arrAddress} onChange={(e) => mark(setArrAddress)(e.target.value)} placeholder='5 avenue Foch' className='h-8 text-sm' />
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <Label className='text-xs mb-1 block'>Code postal</Label>
                          <Input value={arrPostal} onChange={(e) => mark(setArrPostal)(e.target.value)} placeholder='69001' className='h-8 text-sm' />
                        </div>
                        <div>
                          <Label className='text-xs mb-1 block'>Ville</Label>
                          <Input value={arrCity} onChange={(e) => mark(setArrCity)(e.target.value)} placeholder='Lyon' className='h-8 text-sm' />
                        </div>
                      </div>
                      <div>
                        <Label className='text-xs mb-1 block'>Étage</Label>
                        <Input type='number' min={0} value={arrFloor} onChange={(e) => mark(setArrFloor)(e.target.value)} placeholder='0 = RDC' className='h-8 text-sm w-24' />
                      </div>
                      <BoolField label='Ascenseur disponible' value={arrElevator} onChange={mark(setArrElevator)} />
                      <BoolField label='Monte-meubles à prévoir' value={arrLift} onChange={mark(setArrLift)} />
                    </div>
                  </div>

                  <Separator />

                  {/* Détails */}
                  <div>
                    <SectionTitle icon={Package}>Détails</SectionTitle>
                    <div className='flex flex-col gap-3'>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <Label className='text-xs mb-1 block'>Date déménagement</Label>
                          <Input type='date' value={movingDate} onChange={(e) => mark(setMovingDate)(e.target.value)} className='h-8 text-sm' />
                        </div>
                        <div>
                          <Label className='text-xs mb-1 block'>Volume (m³)</Label>
                          <Input type='number' min={0} value={volume} onChange={(e) => mark(setVolume)(e.target.value)} placeholder='25' className='h-8 text-sm' />
                        </div>
                      </div>
                      <div>
                        <Label className='text-xs mb-1 block'>Assigné à</Label>
                        <Input value={assignedTo} onChange={(e) => mark(setAssignedTo)(e.target.value)} placeholder='Nom du responsable' className='h-8 text-sm' />
                      </div>
                      <div className='text-xs text-muted-foreground flex items-center gap-1 pt-1'>
                        <CalendarDays size={11} />
                        Créée le {format(new Date(tx.created_at), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Danger zone */}
                  <div className='flex gap-2 pb-2'>
                    <Button
                      variant='destructive'
                      size='sm'
                      className='w-full'
                      onClick={() => setDeleting(true)}
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* ── Right panel: tabs ── */}
            <ResizablePanel defaultSize='62%' minSize='40%'>
              <Tabs defaultValue='notes' className='flex flex-col h-full'>
                <div className='px-6 pt-4 border-b shrink-0'>
                  <TabsList className='h-8'>
                    <TabsTrigger value='notes' className='text-xs'>Notes</TabsTrigger>
                    <TabsTrigger value='devis' className='text-xs'>
                      Devis {devisList.length > 0 && `(${devisList.length})`}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Notes */}
                <TabsContent value='notes' className='flex-1 overflow-hidden m-0'>
                  <ScrollArea className='h-full'>
                    <div className='p-6'>
                      <RichTextEditor
                        value={notes}
                        onChange={(html) => { setNotes(html); setIsDirty(true) }}
                        placeholder='Rédigez vos notes sur cette transaction... (gras, listes, titres supportés)'
                        className='min-h-[400px]'
                      />
                      {isDirty && (
                        <p className='text-xs text-muted-foreground mt-2'>
                          Modifications non sauvegardées — cliquez sur « Enregistrer » en haut.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Devis */}
                <TabsContent value='devis' className='flex-1 overflow-hidden m-0'>
                  <ScrollArea className='h-full'>
                    <div className='p-6 flex flex-col gap-4'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium'>Devis liés à cette transaction</p>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => { setEditingDevis(null); setDevisOpen(true) }}
                        >
                          <FilePlus size={13} />
                          Nouveau devis
                        </Button>
                      </div>

                      {devisList.length === 0 ? (
                        <div className='rounded-lg border border-dashed p-10 text-center text-muted-foreground text-sm'>
                          Aucun devis pour cette transaction.
                        </div>
                      ) : (
                        devisList.map((d) => (
                          <div
                            key={d.id}
                            className='flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors'
                          >
                            <div>
                              <p className='font-mono text-sm font-semibold text-muted-foreground'>
                                DEV-{String(d.numero).padStart(4, '0')}
                              </p>
                              <p className='text-sm font-medium'>{d.client_name}</p>
                              <p className='text-xs text-muted-foreground mt-0.5'>
                                {EUR(totalTTC(d))} TTC ·{' '}
                                {format(new Date(d.created_at), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Badge
                                variant='outline'
                                className={`text-xs ${DEVIS_STATUS_CLASS[d.status]}`}
                              >
                                {DEVIS_STATUS_LABELS[d.status]}
                              </Badge>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7'
                                onClick={() => { setEditingDevis(d); setDevisOpen(true) }}
                              >
                                <Pencil size={12} />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </Main>

      {/* Devis editor */}
      {tx && (
        <DevisEditorSheet
          open={devisOpen}
          onOpenChange={setDevisOpen}
          devis={editingDevis}
          transaction={tx}
          onSaved={handleDevisSaved}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette transaction ?</AlertDialogTitle>
            <AlertDialogDescription>
              {contactName} — {tx?.departure_city || '?'} → {tx?.arrival_city || '?'}. Cette action est irréversible.
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
