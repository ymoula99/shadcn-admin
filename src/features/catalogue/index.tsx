import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
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
  type Produit,
  deleteProduit,
  getProduits,
  saveProduit,
} from '@/lib/db'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

function groupByCategory(produits: Produit[]): Map<string, Produit[]> {
  const map = new Map<string, Produit[]>()
  for (const p of produits) {
    const cat = p.category ?? 'Sans catégorie'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(p)
  }
  return map
}

// ─── Form sheet ───────────────────────────────────────────────────────────────

interface FormSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  produit: Produit | null
  onSaved: (p: Produit) => void
}

function ProduitFormSheet({ open, onOpenChange, produit, onSaved }: FormSheetProps) {
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [unitPrice, setUnitPrice] = useState(0)
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setLabel(produit?.label ?? '')
      setDescription(produit?.description ?? '')
      setUnitPrice(produit?.unit_price ?? 0)
      setCategory(produit?.category ?? '')
    }
  }, [open, produit])

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error('Le nom du produit est requis.')
      return
    }
    setSaving(true)
    try {
      const saved = await saveProduit({
        ...(produit?.id ? { id: produit.id } : {}),
        label: label.trim(),
        description: description.trim() || null,
        unit_price: unitPrice,
        category: category.trim() || null,
      })
      toast.success(produit ? 'Produit mis à jour.' : 'Produit créé.')
      onSaved(saved)
      onOpenChange(false)
    } catch (e) {
      toast.error(`Erreur : ${e instanceof Error ? e.message : 'Inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex flex-col gap-0 p-0 sm:max-w-md'>
        <SheetHeader className='px-6 py-4 border-b'>
          <SheetTitle>{produit ? 'Modifier le produit' : 'Nouveau produit'}</SheetTitle>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-5'>
          <div>
            <Label className='text-xs mb-1.5 block'>Nom *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='Ex: Déménagement complet'
              autoFocus
            />
          </div>

          <div>
            <Label className='text-xs mb-1.5 block'>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Détails de la prestation...'
              className='resize-none min-h-[80px]'
            />
          </div>

          <div>
            <Label className='text-xs mb-1.5 block'>Prix unitaire HT (€)</Label>
            <Input
              type='number'
              min={0}
              step={0.01}
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </div>

          <div>
            <Label className='text-xs mb-1.5 block'>Catégorie</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder='Ex: Transport, Manutention, Emballage...'
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Saisissez une catégorie existante ou créez-en une nouvelle.
            </p>
          </div>
        </div>

        <SheetFooter className='px-6 py-4 border-t'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CataloguePage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Produit | null>(null)
  const [deleting, setDeleting] = useState<Produit | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await getProduits()
      setProduits(data)
    } catch {
      toast.error('Impossible de charger le catalogue.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = produits.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.label.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    )
  })

  const grouped = groupByCategory(filtered)

  const handleSaved = (p: Produit) => {
    setProduits((prev) => {
      const exists = prev.find((x) => x.id === p.id)
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]
    })
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteProduit(deleting.id)
      setProduits((prev) => prev.filter((p) => p.id !== deleting.id))
      toast.success('Produit supprimé.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    } finally {
      setDeleting(null)
    }
  }

  const openNew = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (p: Produit) => { setEditing(p); setFormOpen(true) }

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
            <h2 className='text-2xl font-bold tracking-tight'>Catalogue produits</h2>
            <p className='text-muted-foreground'>
              Gérez vos prestations et tarifs pour accélérer la création de devis.
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus size={15} />
            Nouveau produit
          </Button>
        </div>

        <div className='flex items-center gap-3'>
          <Input
            placeholder='Rechercher (nom, catégorie...)'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-sm'
          />
          <span className='text-sm text-muted-foreground'>
            {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className='text-muted-foreground py-16 text-center text-sm'>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className='text-muted-foreground py-16 text-center text-sm'>
            {search ? 'Aucun résultat.' : 'Aucun produit. Créez le premier !'}
          </div>
        ) : (
          <div className='flex flex-col gap-6'>
            {Array.from(grouped.entries()).map(([cat, items]) => (
              <div key={cat} className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <Tag size={13} className='text-[#a2831f]' />
                  <h3 className='text-sm font-semibold text-[#7a6218] dark:text-[#a2831f]'>
                    {cat}
                  </h3>
                  <span className='text-xs text-muted-foreground'>
                    ({items.length})
                  </span>
                </div>

                <div className='rounded-lg border bg-card overflow-hidden'>
                  {items.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-4 py-3 group hover:bg-muted/40 transition-colors ${i > 0 ? 'border-t' : ''}`}
                    >
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm truncate'>{p.label}</p>
                        {p.description && (
                          <p className='text-xs text-muted-foreground truncate mt-0.5'>
                            {p.description}
                          </p>
                        )}
                      </div>
                      <div className='flex items-center gap-4 ml-4 shrink-0'>
                        <Badge variant='outline' className='font-mono text-xs font-semibold text-[#7a6218] border-[#d4b96a] bg-[#fdf8ee] dark:bg-[#2a2008] dark:text-[#c9a84c]'>
                          {EUR(p.unit_price)}
                        </Badge>
                        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7'
                            onClick={() => openEdit(p)}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-destructive hover:text-destructive'
                            onClick={() => setDeleting(p)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Main>

      <ProduitFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        produit={editing}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleting?.label} » sera définitivement supprimé du catalogue.
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
