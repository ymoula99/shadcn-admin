import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Circle,
  CheckCircle,
  AlertCircle,
  Timer,
  CircleOff,
} from 'lucide-react'

export const labels = [
  { value: 'suivi', label: 'Suivi' },
  { value: 'admin', label: 'Admin' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'logistique', label: 'Logistique' },
]

export const statuses = [
  { label: 'À faire', value: 'a_faire' as const, icon: Circle },
  { label: 'En cours', value: 'en_cours' as const, icon: Timer },
  { label: 'Terminé', value: 'termine' as const, icon: CheckCircle },
  { label: 'Annulé', value: 'annule' as const, icon: CircleOff },
]

export const priorities = [
  { label: 'Basse', value: 'basse' as const, icon: ArrowDown },
  { label: 'Moyenne', value: 'moyenne' as const, icon: ArrowRight },
  { label: 'Haute', value: 'haute' as const, icon: ArrowUp },
  { label: 'Critique', value: 'critique' as const, icon: AlertCircle },
]
