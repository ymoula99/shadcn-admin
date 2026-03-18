import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Download, FileUp, GripVertical, Plus, Printer, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  type Devis,
  type DevisItem,
  type DevisStatus,
  type Produit,
  type Transaction,
  getNextDevisNumero,
  saveDevis,
  syncTransactionOnDevisAccepted,
} from '@/lib/db'
import {
  downloadMergedDevis,
  hasBrochure,
  uploadBrochure,
} from '@/lib/pdf-merge'
import { cn } from '@/lib/utils'
import { CataloguePicker } from './catalogue-picker'
import { DevisTemplate } from './devis-template'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'edition' | 'apercu'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  devis?: Devis | null
  transaction?: Transaction | null
  onSaved: (d: Devis) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function newItem(): DevisItem {
  return {
    id: crypto.randomUUID(),
    label: '',
    description: '',
    quantity: 1,
    unit_price: 0,
  }
}

function buildDefault(transaction?: Transaction | null): Partial<Devis> {
  if (!transaction) return {}
  const contact = transaction.contact
  const clientName = contact
    ? `${contact.first_name} ${contact.last_name}`.trim()
    : ''
  const moveFrom = [
    transaction.departure_address,
    transaction.departure_postal_code,
    transaction.departure_city,
  ]
    .filter(Boolean)
    .join(', ')
  const moveTo = [
    transaction.arrival_address,
    transaction.arrival_postal_code,
    transaction.arrival_city,
  ]
    .filter(Boolean)
    .join(', ')
  const moveDate = transaction.moving_date
    ? new Date(transaction.moving_date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  return {
    transaction_id: transaction.id,
    client_name: clientName,
    client_email: contact?.email ?? null,
    client_phone: contact?.phone ?? null,
    move_from: moveFrom || null,
    move_to: moveTo || null,
    move_date: moveDate,
    move_volume: transaction.volume_m3 ? `${transaction.volume_m3} m³` : null,
  }
}

function EUR(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

// ─── Sortable item row ────────────────────────────────────────────────────────

interface SortableItemProps {
  item: DevisItem
  onUpdate: (id: string, field: keyof DevisItem, value: string | number) => void
  onRemove: (id: string) => void
}

function SortableItem({ item, onUpdate, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='grid grid-cols-[20px_1fr_60px_100px_100px_32px] gap-2 items-start rounded-lg border bg-muted/20 p-3'
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className='mt-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none'
        tabIndex={-1}
        type='button'
      >
        <GripVertical size={14} />
      </button>

      <div className='flex flex-col gap-1.5'>
        <Input
          value={item.label}
          onChange={(e) => onUpdate(item.id, 'label', e.target.value)}
          placeholder='Ex: Déménagement complet'
          className='h-7 text-xs font-medium'
        />
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          placeholder='Description (optionnel)'
          className='h-7 text-xs text-muted-foreground'
        />
      </div>
      <Input
        type='number'
        min={1}
        value={item.quantity}
        onChange={(e) => onUpdate(item.id, 'quantity', Number(e.target.value))}
        className='h-7 text-xs text-center'
      />
      <Input
        type='number'
        min={0}
        step={0.01}
        value={item.unit_price}
        onChange={(e) => onUpdate(item.id, 'unit_price', Number(e.target.value))}
        className='h-7 text-xs text-right'
      />
      <div className='h-7 flex items-center justify-end text-xs font-semibold'>
        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
          item.quantity * item.unit_price
        )}
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='h-7 w-7 text-muted-foreground hover:text-destructive mt-0.5'
        onClick={() => onRemove(item.id)}
      >
        <X size={13} />
      </Button>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DevisEditorSheet({ open, onOpenChange, devis, transaction, onSaved }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const brochureInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('edition')
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [brochureExists, setBrochureExists] = useState(false)

  // Form state
  const [numero, setNumero] = useState(1)
  const [status, setStatus] = useState<DevisStatus>('brouillon')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [moveFrom, setMoveFrom] = useState('')
  const [moveTo, setMoveTo] = useState('')
  const [moveDate, setMoveDate] = useState('')
  const [moveVolume, setMoveVolume] = useState('')
  const [items, setItems] = useState<DevisItem[]>([newItem()])
  const [tvaPct, setTvaPct] = useState(20)
  const [notes, setNotes] = useState('')
  const [conditions, setConditions] = useState(
    "Devis valable 30 jours à compter de sa date d'émission. Acompte de 30% à la signature."
  )
  const [validUntil, setValidUntil] = useState('')

  // Check if brochure exists on open
  useEffect(() => {
    if (open) hasBrochure().then(setBrochureExists)
  }, [open])

  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadBrochure(file)
      setBrochureExists(true)
      toast.success('Plaquette mise à jour.')
    } catch (err) {
      toast.error(`Erreur upload : ${err instanceof Error ? err.message : 'Inconnue'}`)
    }
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  const handleDownload = async () => {
    if (!printRef.current) return
    setDownloading(true)
    try {
      await downloadMergedDevis({
        pricingElement: printRef.current,
        clientName: clientName || 'client',
        numero,
      })
    } catch (err) {
      toast.error(`Erreur PDF : ${err instanceof Error ? err.message : 'Inconnue'}`)
    } finally {
      setDownloading(false)
    }
  }

  const init = useCallback(async () => {
    if (devis) {
      setNumero(devis.numero)
      setStatus(devis.status)
      setClientName(devis.client_name)
      setClientEmail(devis.client_email ?? '')
      setClientPhone(devis.client_phone ?? '')
      setMoveFrom(devis.move_from ?? '')
      setMoveTo(devis.move_to ?? '')
      setMoveDate(devis.move_date ?? '')
      setMoveVolume(devis.move_volume ?? '')
      setItems(devis.items.length > 0 ? devis.items : [newItem()])
      setTvaPct(devis.tva_pct)
      setNotes(devis.notes ?? '')
      setConditions(devis.conditions ?? '')
      setValidUntil(devis.valid_until ?? '')
    } else {
      const defaults = buildDefault(transaction)
      const next = await getNextDevisNumero()
      setNumero(next)
      setStatus('brouillon')
      setClientName(defaults.client_name ?? '')
      setClientEmail(defaults.client_email ?? '')
      setClientPhone(defaults.client_phone ?? '')
      setMoveFrom(defaults.move_from ?? '')
      setMoveTo(defaults.move_to ?? '')
      setMoveDate(defaults.move_date ?? '')
      setMoveVolume(defaults.move_volume ?? '')
      setItems([newItem()])
      setTvaPct(20)
      setNotes('')
      setConditions("Devis valable 30 jours à compter de sa date d'émission. Acompte de 30% à la signature.")
      const d = new Date()
      d.setDate(d.getDate() + 30)
      setValidUntil(d.toISOString().slice(0, 10))
    }
    setTab('edition')
  }, [devis, transaction])

  useEffect(() => {
    if (open) init()
  }, [open, init])

  // Live devis object for preview
  const liveDevis: Devis = {
    id: devis?.id ?? '',
    numero,
    transaction_id: devis?.transaction_id ?? transaction?.id ?? null,
    client_name: clientName,
    client_email: clientEmail || null,
    client_phone: clientPhone || null,
    move_from: moveFrom || null,
    move_to: moveTo || null,
    move_date: moveDate || null,
    move_volume: moveVolume || null,
    items,
    tva_pct: tvaPct,
    notes: notes || null,
    conditions: conditions || null,
    valid_until: validUntil || null,
    status,
    created_at: devis?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const totalHT = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const totalTTC = totalHT * (1 + tvaPct / 100)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const addItem = () => setItems((prev) => [...prev, newItem()])

  const addFromCatalogue = (p: Produit) => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: p.label, description: p.description ?? '', quantity: 1, unit_price: p.unit_price },
    ])
  }

  const updateItem = (id: string, field: keyof DevisItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast.error('Le nom du client est requis.')
      return
    }
    setSaving(true)
    try {
      const saved = await saveDevis({
        ...(devis?.id ? { id: devis.id } : {}),
        numero,
        transaction_id: devis?.transaction_id ?? transaction?.id ?? null,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        move_from: moveFrom || null,
        move_to: moveTo || null,
        move_date: moveDate || null,
        move_volume: moveVolume || null,
        items,
        tva_pct: tvaPct,
        notes: notes || null,
        conditions: conditions || null,
        valid_until: validUntil || null,
        status,
      })
      if (status === 'accepte' && saved.transaction_id) {
        await syncTransactionOnDevisAccepted(saved.transaction_id)
      }
      toast.success(devis ? 'Devis mis à jour.' : 'Devis créé.')
      onSaved(saved)
      onOpenChange(false)
    } catch (e) {
      toast.error(`Erreur : ${e instanceof Error ? e.message : 'Inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return

    // Copy all <style> tags from the document (Tailwind v4 injects styles here)
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.outerHTML)
      .join('\n')

    const html = printRef.current.outerHTML

    const win = window.open('', '_blank', 'width=900,height=1200')
    if (!win) {
      toast.error('Autorisez les popups pour imprimer.')
      return
    }
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Devis DEV-${String(numero).padStart(4, '0')} — ${clientName}</title>
  ${styles}
  <style>
    @page { margin: 0; }
    body { margin: 0; padding: 0; background: white; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>${html}</body>
</html>`)
    win.document.close()
    setTimeout(() => {
      win.focus()
      win.print()
      win.close()
    }, 600)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='flex flex-col gap-0 p-0 sm:max-w-none w-full lg:w-[90vw] xl:w-[80vw]'
      >
        {/* ── Top bar ── */}
        <SheetHeader className='flex flex-row items-center justify-between px-6 py-4 border-b shrink-0'>
          <div className='flex items-center gap-3'>
            <SheetTitle className='text-base'>
              {devis ? `DEV-${String(devis.numero).padStart(4, '0')}` : 'Nouveau devis'}
            </SheetTitle>
            <Badge variant='outline' className={cn('text-xs', STATUS_CLASS[status])}>
              {STATUS_LABELS[status]}
            </Badge>
          </div>
          <div className='flex items-center gap-2'>
            {/* Tabs */}
            <div className='flex rounded-md border overflow-hidden text-xs'>
              {(['edition', 'apercu'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-3 py-1.5 font-medium transition-colors',
                    tab === t
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {t === 'edition' ? 'Édition' : 'Aperçu'}
                </button>
              ))}
            </div>

            {/* Hidden file input for brochure upload */}
            <input
              ref={brochureInputRef}
              type='file'
              accept='application/pdf'
              className='hidden'
              onChange={handleBrochureUpload}
            />
            <Button
              variant='ghost'
              size='sm'
              onClick={() => brochureInputRef.current?.click()}
              title={brochureExists ? 'Remplacer la plaquette commerciale' : 'Importer la plaquette commerciale'}
              className={cn('text-xs gap-1.5', brochureExists ? 'text-green-600' : 'text-muted-foreground')}
            >
              <FileUp size={13} />
              {brochureExists ? 'Plaquette ✓' : 'Plaquette'}
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={handleDownload}
              disabled={downloading}
              title={brochureExists ? 'Télécharger : plaquette + devis fusionnés' : 'Télécharger le devis (sans plaquette)'}
            >
              <Download size={14} />
              {downloading ? 'Génération...' : brochureExists ? 'Télécharger PDF' : 'Télécharger'}
            </Button>

            <Button variant='ghost' size='sm' onClick={handlePrint}>
              <Printer size={14} />
            </Button>

            <Button size='sm' onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </SheetHeader>

        <div className='flex flex-1 overflow-hidden'>
          {/* ── Edition tab ── */}
          {tab === 'edition' && (
            <div className='flex flex-1 gap-0 overflow-hidden'>
              {/* Left: form */}
              <div className='w-[420px] shrink-0 border-r overflow-y-auto p-6 flex flex-col gap-6'>
                {/* Meta */}
                <section className='flex flex-col gap-3'>
                  <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                    Informations
                  </h3>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <Label className='text-xs mb-1.5 block'>Numéro</Label>
                      <Input
                        value={`DEV-${String(numero).padStart(4, '0')}`}
                        readOnly
                        className='bg-muted text-xs h-8'
                      />
                    </div>
                    <div>
                      <Label className='text-xs mb-1.5 block'>Statut</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as DevisStatus)}>
                        <SelectTrigger className='h-8 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className='text-xs mb-1.5 block'>TVA (%)</Label>
                      <Input
                        type='number'
                        min={0}
                        max={100}
                        value={tvaPct}
                        onChange={(e) => setTvaPct(Number(e.target.value))}
                        className='h-8 text-xs'
                      />
                    </div>
                    <div>
                      <Label className='text-xs mb-1.5 block'>Valable jusqu'au</Label>
                      <Input
                        type='date'
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className='h-8 text-xs'
                      />
                    </div>
                  </div>
                </section>

                {/* Client */}
                <section className='flex flex-col gap-3'>
                  <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                    Client
                  </h3>
                  <div>
                    <Label className='text-xs mb-1.5 block'>Nom *</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder='Jean Dupont'
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <Label className='text-xs mb-1.5 block'>Email</Label>
                      <Input
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder='jean@email.com'
                        className='h-8 text-xs'
                      />
                    </div>
                    <div>
                      <Label className='text-xs mb-1.5 block'>Téléphone</Label>
                      <Input
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder='06 12 34 56 78'
                        className='h-8 text-xs'
                      />
                    </div>
                  </div>
                </section>

                {/* Move */}
                <section className='flex flex-col gap-3'>
                  <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                    Déménagement
                  </h3>
                  <div>
                    <Label className='text-xs mb-1.5 block'>Adresse de départ</Label>
                    <Input
                      value={moveFrom}
                      onChange={(e) => setMoveFrom(e.target.value)}
                      placeholder='15 rue de Paris, 69001 Lyon'
                      className='h-8 text-xs'
                    />
                  </div>
                  <div>
                    <Label className='text-xs mb-1.5 block'>Adresse d'arrivée</Label>
                    <Input
                      value={moveTo}
                      onChange={(e) => setMoveTo(e.target.value)}
                      placeholder="8 bd Victor Hugo, 75001 Paris"
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <Label className='text-xs mb-1.5 block'>Date</Label>
                      <Input
                        value={moveDate}
                        onChange={(e) => setMoveDate(e.target.value)}
                        placeholder='15 avril 2026'
                        className='h-8 text-xs'
                      />
                    </div>
                    <div>
                      <Label className='text-xs mb-1.5 block'>Volume</Label>
                      <Input
                        value={moveVolume}
                        onChange={(e) => setMoveVolume(e.target.value)}
                        placeholder='42 m³'
                        className='h-8 text-xs'
                      />
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <section className='flex flex-col gap-3'>
                  <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                    Notes & Conditions
                  </h3>
                  <div>
                    <Label className='text-xs mb-1.5 block'>Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder='Informations complémentaires...'
                      className='text-xs min-h-[60px] resize-none'
                    />
                  </div>
                  <div>
                    <Label className='text-xs mb-1.5 block'>Conditions</Label>
                    <Textarea
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                      className='text-xs min-h-[60px] resize-none'
                    />
                  </div>
                </section>
              </div>

              {/* Right: line items */}
              <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                    Prestations
                  </h3>
                  <div className='flex items-center gap-2'>
                    <CataloguePicker onSelect={addFromCatalogue} />
                    <Button variant='outline' size='sm' onClick={addItem}>
                      <Plus size={13} />
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Header row */}
                <div className='grid grid-cols-[20px_1fr_60px_100px_100px_32px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1'>
                  <span />
                  <span>Prestation</span>
                  <span className='text-center'>Qté</span>
                  <span className='text-right'>Prix HT</span>
                  <span className='text-right'>Total HT</span>
                  <span />
                </div>

                {/* Sortable item rows */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className='flex flex-col gap-2'>
                      {items.map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onUpdate={updateItem}
                          onRemove={removeItem}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Totals summary */}
                <div className='flex justify-end mt-4'>
                  <div className='w-64 border rounded-lg p-4 bg-card flex flex-col gap-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Total HT</span>
                      <span className='font-medium'>{EUR(totalHT)}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>TVA ({tvaPct}%)</span>
                      <span className='font-medium'>{EUR(totalHT * tvaPct / 100)}</span>
                    </div>
                    <div className='flex justify-between border-t pt-2 mt-1'>
                      <span className='font-bold'>Total TTC</span>
                      <span className='font-bold text-[#a2831f]'>{EUR(totalTTC)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Aperçu tab ── */}
          {tab === 'apercu' && (
            <div className='flex-1 overflow-auto bg-muted/30 p-8'>
              <div className='shadow-xl rounded-lg overflow-hidden'>
                <DevisTemplate devis={liveDevis} />
              </div>
            </div>
          )}
        </div>

        {/* Hidden template — always rendered so printRef & download work from any tab */}
        <div className='hidden'>
          <DevisTemplate ref={printRef} devis={liveDevis} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
