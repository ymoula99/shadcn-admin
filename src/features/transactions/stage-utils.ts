import { type TransactionStage } from '@/lib/db'

export const STAGE_LABELS: Record<TransactionStage, string> = {
  prospect: 'Prospect',
  visite_planifiee: 'Visite planifiée',
  visite_effectuee: 'Visite effectuée',
  devis_envoye: 'Devis envoyé',
  relance: 'Relance',
  signe: 'Signé',
  perdu: 'Perdu',
}

export const STAGE_BADGE_CLASS: Record<TransactionStage, string> = {
  prospect: 'text-muted-foreground border-border',
  visite_planifiee: 'text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  visite_effectuee: 'text-yellow-700 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  devis_envoye: 'text-orange-700 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  relance: 'text-purple-700 border-purple-200 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  signe: 'text-green-700 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  perdu: 'text-red-700 border-red-200 bg-red-50 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
}

export function stageLabel(stage: TransactionStage): string {
  return STAGE_LABELS[stage] ?? stage
}

export function stageBadgeClass(stage: TransactionStage): string {
  return STAGE_BADGE_CLASS[stage] ?? ''
}

export const ALL_STAGES: TransactionStage[] = [
  'prospect',
  'visite_planifiee',
  'visite_effectuee',
  'devis_envoye',
  'relance',
  'signe',
  'perdu',
]
