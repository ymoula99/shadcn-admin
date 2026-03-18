import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowRight,
  CalendarDays,
  LogOut,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  type ChantierJour,
  type ChantierMaterial,
  type Transaction,
  MATERIAL_TYPES,
  getChantierJours,
  getChantierMaterials,
  getMoverChantiers,
} from '@/lib/db'
import { useAuthStore } from '@/stores/auth-store'

interface ChantierWithDetails extends Transaction {
  jours: ChantierJour[]
  materials: ChantierMaterial[]
}

export function MoverDashboard() {
  const { mover, signOut } = useAuthStore()
  const [chantiers, setChantiers] = useState<ChantierWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mover) return
    getMoverChantiers(mover.id)
      .then(async (txs) => {
        const withDetails = await Promise.all(
          txs.map(async (tx: Transaction) => {
            const [jours, materials] = await Promise.all([
              getChantierJours(tx.id),
              getChantierMaterials(tx.id),
            ])
            return { ...tx, jours, materials }
          })
        )
        setChantiers(withDetails)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [mover])

  if (!mover) return null

  return (
    <div className='min-h-svh bg-background'>
      <div className='mx-auto max-w-lg px-4 py-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-xl font-bold'>
              Bonjour, {mover.first_name} 👋
            </h1>
            <p className='text-sm text-muted-foreground'>
              {chantiers.length} chantier{chantiers.length !== 1 ? 's' : ''} assigné{chantiers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant='ghost' size='icon' onClick={() => signOut()}>
            <LogOut size={18} />
          </Button>
        </div>

        {loading ? (
          <p className='text-center text-muted-foreground py-12'>Chargement...</p>
        ) : chantiers.length === 0 ? (
          <Card>
            <CardContent className='py-12 text-center'>
              <p className='text-muted-foreground'>Aucun chantier assigné pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className='flex flex-col gap-6'>
            {chantiers.map((ch) => (
              <ChantierCard key={ch.id} chantier={ch} />
            ))}
          </div>
        )}

        <p className='text-center text-xs text-muted-foreground mt-8'>
          Griffon CRM · Espace déménageur
        </p>
      </div>
    </div>
  )
}

function ChantierCard({ chantier }: { chantier: ChantierWithDetails }) {
  const tx = chantier

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base flex items-center gap-2'>
            {tx.departure_city || '?'}
            <ArrowRight size={14} className='text-muted-foreground' />
            {tx.arrival_city || '?'}
          </CardTitle>
          {tx.volume_m3 && (
            <Badge variant='outline'>{tx.volume_m3} m³</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {/* Client */}
        {tx.contact && (
          <div className='flex flex-col gap-1 text-sm'>
            <p className='text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5'>
              <User size={12} />
              Client
            </p>
            <p className='font-medium'>
              {tx.contact.first_name} {tx.contact.last_name}
            </p>
            {tx.contact.phone && (
              <a
                href={`tel:${tx.contact.phone}`}
                className='flex items-center gap-1.5 text-blue-600'
              >
                <Phone size={12} />
                {tx.contact.phone}
              </a>
            )}
          </div>
        )}

        <Separator />

        {/* Adresses */}
        <div className='flex flex-col gap-3 text-sm'>
          <p className='text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5'>
            <MapPin size={12} />
            Adresses
          </p>
          <div className='flex flex-col gap-2'>
            <div>
              <p className='text-xs text-muted-foreground mb-0.5'>Départ</p>
              <p className='font-medium'>{tx.departure_address || '—'}</p>
              <p>{[tx.departure_postal_code, tx.departure_city].filter(Boolean).join(' ')}</p>
              <div className='flex gap-3 mt-0.5 text-xs text-muted-foreground'>
                {tx.departure_floor != null && <span>Étage {tx.departure_floor}</span>}
                {tx.departure_elevator && <span>Ascenseur</span>}
                {tx.departure_lift && <span>Monte-meubles</span>}
              </div>
            </div>
            <div>
              <p className='text-xs text-muted-foreground mb-0.5'>Arrivée</p>
              <p className='font-medium'>{tx.arrival_address || '—'}</p>
              <p>{[tx.arrival_postal_code, tx.arrival_city].filter(Boolean).join(' ')}</p>
              <div className='flex gap-3 mt-0.5 text-xs text-muted-foreground'>
                {tx.arrival_floor != null && <span>Étage {tx.arrival_floor}</span>}
                {tx.arrival_elevator && <span>Ascenseur</span>}
                {tx.arrival_lift && <span>Monte-meubles</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Volume */}
        {tx.volume_m3 && (
          <>
            <Separator />
            <div className='flex items-center gap-2 text-sm'>
              <Truck size={14} className='text-muted-foreground' />
              <span className='font-semibold'>{tx.volume_m3} m³</span>
            </div>
          </>
        )}

        {/* Planning jours */}
        {chantier.jours.length > 0 && (
          <>
            <Separator />
            <div className='flex flex-col gap-2 text-sm'>
              <p className='text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5'>
                <CalendarDays size={12} />
                Planning
              </p>
              {chantier.jours.map((jour, idx) => (
                <div key={jour.id} className='flex items-center gap-3'>
                  <span className='text-muted-foreground text-xs font-mono w-5 text-center'>
                    J{idx + 1}
                  </span>
                  <div>
                    <p className='font-medium'>{jour.label}</p>
                    <p className='text-xs text-muted-foreground'>
                      {format(new Date(jour.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notes */}
        {tx.notes && (
          <>
            <Separator />
            <div className='text-sm'>
              <p className='text-xs text-muted-foreground uppercase tracking-wide mb-1'>Notes</p>
              <p className='whitespace-pre-wrap'>{tx.notes}</p>
            </div>
          </>
        )}

        {/* Matériel */}
        {chantier.materials.length > 0 && (
          <>
            <Separator />
            <div className='flex flex-col gap-1.5 text-sm'>
              <p className='text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5'>
                <Package size={12} />
                Matériel à prévoir
              </p>
              {chantier.materials.map((m) => {
                const def = MATERIAL_TYPES.find((t) => t.key === m.material_key)
                return (
                  <div key={m.id} className='flex items-center justify-between'>
                    <span>{def?.label ?? m.material_key}</span>
                    <span className='font-medium'>{m.quantity}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
