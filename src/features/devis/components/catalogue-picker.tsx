import { useEffect, useRef, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { type Produit, getProduits } from '@/lib/db'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onSelect: (p: Produit) => void
}

export function CataloguePicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [produits, setProduits] = useState<Produit[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    if (open && !loaded.current) {
      setLoading(true)
      getProduits()
        .then((data) => { setProduits(data); loaded.current = true })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open])

  const filtered = produits.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.label.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    )
  })

  // Group by category for display
  const grouped = filtered.reduce<Record<string, Produit[]>>((acc, p) => {
    const cat = p.category ?? 'Sans catégorie'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const handleSelect = (p: Produit) => {
    onSelect(p)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          type='button'
          className='h-7 gap-1.5 text-xs text-muted-foreground'
          title='Choisir depuis le catalogue'
        >
          <BookOpen size={12} />
          Catalogue
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start' side='bottom'>
        <div className='flex items-center border-b px-3'>
          <Search size={13} className='text-muted-foreground shrink-0' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Rechercher...'
            className='border-0 shadow-none focus-visible:ring-0 text-sm h-9'
            autoFocus
          />
        </div>

        <div className='max-h-72 overflow-y-auto'>
          {loading ? (
            <p className='text-center text-xs text-muted-foreground py-6'>Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className='text-center text-xs text-muted-foreground py-6'>
              {produits.length === 0 ? 'Catalogue vide.' : 'Aucun résultat.'}
            </p>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className='px-3 py-1.5 text-[10px] font-semibold text-[#a2831f] uppercase tracking-wide bg-muted/50 border-b'>
                  {cat}
                </div>
                {items.map((p) => (
                  <button
                    key={p.id}
                    type='button'
                    className='w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center justify-between gap-3 border-b last:border-0'
                    onClick={() => handleSelect(p)}
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{p.label}</p>
                      {p.description && (
                        <p className='text-xs text-muted-foreground truncate'>
                          {p.description}
                        </p>
                      )}
                    </div>
                    <span className='text-xs font-semibold text-[#a2831f] shrink-0'>
                      {EUR(p.unit_price)}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
