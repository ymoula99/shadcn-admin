import { supabase } from './supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContactType = 'particulier' | 'entreprise'
export type ContactSource = 'dem24' | 'tel' | 'email' | 'website' | 'parrainage'

export interface Contact {
  id: string
  type: ContactType
  first_name: string
  last_name: string
  company_name: string | null
  email: string | null
  phone: string | null
  source: ContactSource | null
  created_at: string
  updated_at: string
}

export type TransactionStage =
  | 'prospect'
  | 'visite_planifiee'
  | 'visite_effectuee'
  | 'devis_envoye'
  | 'relance'
  | 'signe'
  | 'perdu'

export interface Transaction {
  id: string
  contact_id: string
  stage: TransactionStage
  lost_reason: string | null
  departure_address: string | null
  departure_city: string | null
  departure_postal_code: string | null
  departure_floor: number | null
  departure_elevator: boolean | null
  departure_lift: boolean | null
  arrival_address: string | null
  arrival_city: string | null
  arrival_postal_code: string | null
  arrival_floor: number | null
  arrival_elevator: boolean | null
  arrival_lift: boolean | null
  moving_date: string | null
  volume_m3: number | null
  assigned_to: string | null
  pandadoc_doc_id: string | null
  pandadoc_status: string | null
  notes: string | null
  created_at: string
  updated_at: string
  contact?: Contact
}

export type ActivityType = 'note' | 'call' | 'email' | 'stage_change'

export interface Activity {
  id: string
  transaction_id: string
  type: ActivityType
  body: string | null
  created_by: string | null
  created_at: string
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function getContacts({ search }: { search?: string } = {}) {
  let query = supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data as Contact[]
}

export async function getContact(id: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Contact
}

export async function saveContact(
  contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'> & { id?: string }
) {
  if (contact.id) {
    const { id, ...rest } = contact
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Contact
  } else {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single()
    if (error) throw error
    return data as Contact
  }
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions({
  stage,
  search,
}: { stage?: TransactionStage; search?: string } = {}) {
  let query = supabase
    .from('transactions')
    .select('*, contact:contacts(*)')
    .order('created_at', { ascending: false })

  if (stage) {
    query = query.eq('stage', stage)
  }

  if (search) {
    query = query.or(
      `departure_city.ilike.%${search}%,arrival_city.ilike.%${search}%,assigned_to.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data as Transaction[]
}

export async function getTransaction(id: string): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, contact:contacts(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Transaction
}

export async function saveTransaction(
  tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'contact'> & {
    id?: string
  }
) {
  if (tx.id) {
    const { id, ...rest } = tx
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, contact:contacts(*)')
      .single()
    if (error) throw error
    return data as Transaction
  } else {
    const { data, error } = await supabase
      .from('transactions')
      .insert(tx)
      .select('*, contact:contacts(*)')
      .single()
    if (error) throw error
    return data as Transaction
  }
}

export async function updateTransactionStage(
  id: string,
  stage: TransactionStage,
  lost_reason?: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      stage,
      lost_reason: lost_reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, contact:contacts(*)')
    .single()
  if (error) throw error
  return data as Transaction
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

// ─── Exploitation : Déménageurs ───────────────────────────────────────────────

export interface Mover {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getMovers() {
  const { data, error } = await supabase
    .from('movers')
    .select('*')
    .order('last_name', { ascending: true })
  if (error) throw error
  return data as Mover[]
}

export async function saveMover(
  mover: Omit<Mover, 'id' | 'created_at' | 'updated_at'> & { id?: string }
) {
  if (mover.id) {
    const { id, ...rest } = mover
    const { data, error } = await supabase
      .from('movers')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Mover
  } else {
    const { data, error } = await supabase
      .from('movers')
      .insert(mover)
      .select()
      .single()
    if (error) throw error
    return data as Mover
  }
}

export async function deleteMover(id: string) {
  const { error } = await supabase.from('movers').delete().eq('id', id)
  if (error) throw error
}

// ─── Exploitation : Jours de chantier ─────────────────────────────────────────

export interface ChantierJour {
  id: string
  transaction_id: string
  date: string
  label: string
  notes: string | null
  position: number
  created_at: string
  updated_at: string
}

export async function getChantierJours(transactionId: string) {
  const { data, error } = await supabase
    .from('chantier_jours')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('position', { ascending: true })
  if (error) throw error
  return data as ChantierJour[]
}

export async function getAllChantierJours() {
  const { data, error } = await supabase
    .from('chantier_jours')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error
  return data as ChantierJour[]
}

export async function saveChantierJour(
  jour: Omit<ChantierJour, 'id' | 'created_at' | 'updated_at'> & { id?: string }
) {
  if (jour.id) {
    const { id, ...rest } = jour
    const { data, error } = await supabase
      .from('chantier_jours')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as ChantierJour
  } else {
    const { data, error } = await supabase
      .from('chantier_jours')
      .insert(jour)
      .select()
      .single()
    if (error) throw error
    return data as ChantierJour
  }
}

export async function deleteChantierJour(id: string) {
  const { error } = await supabase.from('chantier_jours').delete().eq('id', id)
  if (error) throw error
}

// ─── Exploitation : Chantier Items ────────────────────────────────────────────

export type ChantierItemType =
  | 'cartons'
  | 'stationnement_depart'
  | 'stationnement_arrivee'
  | 'visite'
  | 'monte_meubles'
  | 'inventaire'

export type ChantierItemStatus = 'a_faire' | 'planifie' | 'fait'

export interface ChantierItem {
  id: string
  transaction_id: string
  type: ChantierItemType
  status: ChantierItemStatus
  scheduled_date: string | null
  notes: string | null
  data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export async function getChantierItems(transactionId: string) {
  const { data, error } = await supabase
    .from('chantier_items')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as ChantierItem[]
}

export async function getAllChantierItems() {
  const { data, error } = await supabase
    .from('chantier_items')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as ChantierItem[]
}

export async function upsertChantierItem(
  item: Omit<ChantierItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }
) {
  if (item.id) {
    const { id, ...rest } = item
    const { data, error } = await supabase
      .from('chantier_items')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as ChantierItem
  } else {
    const { data, error } = await supabase
      .from('chantier_items')
      .insert(item)
      .select()
      .single()
    if (error) throw error
    return data as ChantierItem
  }
}

export async function deleteChantierItem(id: string) {
  const { error } = await supabase.from('chantier_items').delete().eq('id', id)
  if (error) throw error
}

// ─── Exploitation : Transaction Movers ────────────────────────────────────────

export interface TransactionMover {
  id: string
  transaction_id: string
  mover_id: string
  created_at: string
  mover?: Mover
}

export async function getTransactionMovers(transactionId: string) {
  const { data, error } = await supabase
    .from('transaction_movers')
    .select('*, mover:movers(*)')
    .eq('transaction_id', transactionId)
  if (error) throw error
  return data as TransactionMover[]
}

export async function addTransactionMover(transactionId: string, moverId: string) {
  const { data, error } = await supabase
    .from('transaction_movers')
    .insert({ transaction_id: transactionId, mover_id: moverId })
    .select('*, mover:movers(*)')
    .single()
  if (error) throw error
  return data as TransactionMover
}

export async function removeTransactionMover(transactionId: string, moverId: string) {
  const { error } = await supabase
    .from('transaction_movers')
    .delete()
    .eq('transaction_id', transactionId)
    .eq('mover_id', moverId)
  if (error) throw error
}

// ─── Exploitation : Chantier Jour Movers ──────────────────────────────────────

export interface ChantierJourMover {
  id: string
  chantier_jour_id: string
  mover_id: string
  created_at: string
  mover?: Mover
}

export async function getChantierJourMovers(jourIds: string[]) {
  if (jourIds.length === 0) return [] as ChantierJourMover[]
  const { data, error } = await supabase
    .from('chantier_jour_movers')
    .select('*, mover:movers(*)')
    .in('chantier_jour_id', jourIds)
  if (error) throw error
  return data as ChantierJourMover[]
}

export async function addChantierJourMover(jourId: string, moverId: string) {
  const { data, error } = await supabase
    .from('chantier_jour_movers')
    .insert({ chantier_jour_id: jourId, mover_id: moverId })
    .select('*, mover:movers(*)')
    .single()
  if (error) throw error
  return data as ChantierJourMover
}

export async function removeChantierJourMover(id: string) {
  const { error } = await supabase
    .from('chantier_jour_movers')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function getActivities(transactionId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Activity[]
}

export async function addActivity(
  transactionId: string,
  type: ActivityType,
  body: string
) {
  const { data, error } = await supabase
    .from('activities')
    .insert({ transaction_id: transactionId, type, body })
    .select()
    .single()
  if (error) throw error
  return data as Activity
}

// ─── Exploitation : Codes de partage ──────────────────────────────────────────

export const MATERIAL_TYPES = [
  { key: 'cartons_standard', label: 'Cartons standard' },
  { key: 'cartons_livres', label: 'Cartons livres' },
  { key: 'papier_bulle', label: 'Papier bulle' },
  { key: 'bullkraft', label: 'BullKraft' },
  { key: 'penderies', label: 'Penderies' },
  { key: 'housses_matelas', label: 'Housses de matelas' },
  { key: 'materiel_fixation', label: 'Matériels de fixation' },
] as const

export type MaterialKey = (typeof MATERIAL_TYPES)[number]['key']

export interface ChantierMaterial {
  id: string
  transaction_id: string
  material_key: MaterialKey
  quantity: number
  created_at: string
}

export async function getChantierMaterials(transactionId: string) {
  const { data, error } = await supabase
    .from('chantier_materials')
    .select('*')
    .eq('transaction_id', transactionId)
  if (error) throw error
  return data as ChantierMaterial[]
}

export async function upsertChantierMaterial(
  transactionId: string,
  materialKey: MaterialKey,
  quantity: number
) {
  if (quantity <= 0) {
    const { error } = await supabase
      .from('chantier_materials')
      .delete()
      .eq('transaction_id', transactionId)
      .eq('material_key', materialKey)
    if (error) throw error
    return null
  }
  const { data, error } = await supabase
    .from('chantier_materials')
    .upsert(
      { transaction_id: transactionId, material_key: materialKey, quantity },
      { onConflict: 'transaction_id,material_key' }
    )
    .select()
    .single()
  if (error) throw error
  return data as ChantierMaterial
}

// ─── Exploitation : Mover Auth ────────────────────────────────────────────────

export async function getMoverByUserId(userId: string): Promise<Mover | null> {
  const { data, error } = await supabase
    .from('movers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as Mover | null
}

export async function getMoverChantiers(moverId: string) {
  // Get all transactions where this mover is assigned (via transaction_movers)
  const { data, error } = await supabase
    .from('transaction_movers')
    .select('*, transaction:transactions(*, contact:contacts(*))')
    .eq('mover_id', moverId)
  if (error) throw error
  return (data ?? []).map((tm: { transaction: Transaction }) => tm.transaction)
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'a_faire' | 'en_cours' | 'termine' | 'annule'
export type TaskPriority = 'basse' | 'moyenne' | 'haute' | 'critique'
export type TaskLabel = 'suivi' | 'admin' | 'commercial' | 'logistique'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  label: TaskLabel
  priority: TaskPriority
  assigned_to: string | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Task[]
}

export async function saveTask(
  task: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string }
) {
  if (task.id) {
    const { id, ...rest } = task
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Task
  } else {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()
    if (error) throw error
    return data as Task
  }
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function deleteTasks(ids: string[]) {
  const { error } = await supabase.from('tasks').delete().in('id', ids)
  if (error) throw error
}

export async function bulkUpdateTasks(ids: string[], updates: Partial<Task>) {
  const { error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', ids)
  if (error) throw error
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface CAMonth {
  month: string // 'YYYY-MM'
  label: string // 'Jan', 'Fév', etc.
  caTotal: number
  caRealise: number
}

export interface DashboardStats {
  // Pipeline
  pipelineByStage: Partial<Record<TransactionStage, number>>
  activeCount: number
  signedThisMonth: number
  lostCount: number

  // Devis
  devisByStatus: Partial<Record<DevisStatus, { count: number; totalTTC: number }>>
  devisEnAttente: number
  caPotentiel: number // sum TTC of devis acceptés

  // CA
  caTotal: number       // sum TTC of all accepted devis
  caRealise: number     // sum TTC of accepted devis where moving_date <= today
  caByMonth: CAMonth[]  // last 6 months breakdown

  // Contacts
  totalContacts: number
  newContactsThisMonth: number
  contactsBySource: Record<string, number>

  // Ops
  chantiersToday: number

  // Recent
  recentTransactions: Transaction[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const todayStr = new Date().toISOString().slice(0, 10)

  const [txRes, devisRes, caDevisRes, contactsRes, joursRes, recentRes] = await Promise.all([
    supabase.from('transactions').select('stage, created_at').order('created_at', { ascending: false }),
    supabase.from('devis').select('status, tva_pct, items'),
    supabase
      .from('devis')
      .select('tva_pct, items, transactions(moving_date)')
      .eq('status', 'accepte'),
    supabase.from('contacts').select('source, created_at'),
    supabase.from('chantier_jours').select('date').eq('date', todayStr),
    supabase
      .from('transactions')
      .select('*, contact:contacts(*)')
      .order('updated_at', { ascending: false })
      .limit(6),
  ])

  // Pipeline by stage
  const pipelineByStage: Partial<Record<TransactionStage, number>> = {}
  let activeCount = 0
  let signedThisMonth = 0
  let lostCount = 0

  for (const tx of txRes.data ?? []) {
    pipelineByStage[tx.stage as TransactionStage] = (pipelineByStage[tx.stage as TransactionStage] ?? 0) + 1
    if (tx.stage !== 'perdu') activeCount++
    else lostCount++
    if (tx.stage === 'signe' && new Date(tx.created_at) >= startOfMonth) signedThisMonth++
  }

  // Devis by status + CA potentiel
  const devisByStatus: Partial<Record<DevisStatus, { count: number; totalTTC: number }>> = {}
  let caPotentiel = 0

  for (const d of devisRes.data ?? []) {
    const items = (d.items as { quantity: number; unit_price: number }[]) ?? []
    const ht = items.reduce((s: number, i) => s + i.quantity * i.unit_price, 0)
    const ttc = ht * (1 + (d.tva_pct ?? 20) / 100)
    const s = d.status as DevisStatus
    if (!devisByStatus[s]) devisByStatus[s] = { count: 0, totalTTC: 0 }
    devisByStatus[s]!.count++
    devisByStatus[s]!.totalTTC += ttc
    if (s === 'accepte') caPotentiel += ttc
  }

  const devisEnAttente = devisByStatus['envoye']?.count ?? 0

  // CA global + réalisé + by month (last 6 months)
  const todayDate = new Date(todayStr)
  let caTotal = 0
  let caRealise = 0

  // Build last-6-months buckets
  const monthBuckets: Record<string, CAMonth> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'short' })
    monthBuckets[key] = { month: key, label, caTotal: 0, caRealise: 0 }
  }

  for (const d of caDevisRes.data ?? []) {
    const items = (d.items as { quantity: number; unit_price: number }[]) ?? []
    const ht = items.reduce((s: number, i) => s + i.quantity * i.unit_price, 0)
    const ttc = ht * (1 + (d.tva_pct ?? 20) / 100)
    caTotal += ttc

    const tx = Array.isArray(d.transactions) ? d.transactions[0] : d.transactions
    const movingDate = tx?.moving_date ? new Date(tx.moving_date) : null
    const isRealise = movingDate !== null && movingDate <= todayDate
    if (isRealise) caRealise += ttc

    // Attribute to the month of moving_date (if within last 6 months)
    if (movingDate) {
      const key = `${movingDate.getFullYear()}-${String(movingDate.getMonth() + 1).padStart(2, '0')}`
      if (monthBuckets[key]) {
        monthBuckets[key].caTotal += ttc
        if (isRealise) monthBuckets[key].caRealise += ttc
      }
    }
  }

  const caByMonth = Object.values(monthBuckets)

  // Contacts
  const totalContacts = (contactsRes.data ?? []).length
  let newContactsThisMonth = 0
  const contactsBySource: Record<string, number> = {}
  for (const c of contactsRes.data ?? []) {
    if (new Date(c.created_at) >= startOfMonth) newContactsThisMonth++
    const src = c.source ?? 'autre'
    contactsBySource[src] = (contactsBySource[src] ?? 0) + 1
  }

  return {
    pipelineByStage,
    activeCount,
    signedThisMonth,
    lostCount,
    devisByStatus,
    devisEnAttente,
    caPotentiel,
    caTotal,
    caRealise,
    caByMonth,
    totalContacts,
    newContactsThisMonth,
    contactsBySource,
    chantiersToday: (joursRes.data ?? []).length,
    recentTransactions: (recentRes.data ?? []) as Transaction[],
  }
}

// ─── Catalogue produits ───────────────────────────────────────────────────────

export interface Produit {
  id: string
  label: string
  description: string | null
  unit_price: number
  category: string | null
  created_at: string
  updated_at: string
}

export async function getProduits(): Promise<Produit[]> {
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .order('category', { ascending: true, nullsFirst: false })
    .order('label', { ascending: true })
  if (error) throw error
  return (data ?? []) as Produit[]
}

export async function saveProduit(
  produit: Omit<Produit, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<Produit> {
  const { id, ...fields } = produit
  const payload = { ...fields, updated_at: new Date().toISOString() }

  if (id) {
    const { data, error } = await supabase
      .from('produits')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Produit
  } else {
    const { data, error } = await supabase
      .from('produits')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as Produit
  }
}

export async function deleteProduit(id: string): Promise<void> {
  const { error } = await supabase.from('produits').delete().eq('id', id)
  if (error) throw error
}

// ─── Devis ───────────────────────────────────────────────────────────────────

export type DevisStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse'

export interface DevisItem {
  id: string
  label: string
  description: string
  quantity: number
  unit_price: number
}

export interface Devis {
  id: string
  numero: number
  transaction_id: string | null
  client_name: string
  client_email: string | null
  client_phone: string | null
  move_from: string | null
  move_to: string | null
  move_date: string | null
  move_volume: string | null
  items: DevisItem[]
  tva_pct: number
  notes: string | null
  conditions: string | null
  valid_until: string | null
  status: DevisStatus
  created_at: string
  updated_at: string
}

export async function getDevis(): Promise<Devis[]> {
  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .order('numero', { ascending: false })
  if (error) throw error
  return (data ?? []) as Devis[]
}

export async function getDevisForTransaction(transactionId: string): Promise<Devis[]> {
  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('numero', { ascending: false })
  if (error) throw error
  return (data ?? []) as Devis[]
}

export async function getNextDevisNumero(): Promise<number> {
  const { data, error } = await supabase
    .from('devis')
    .select('numero')
    .order('numero', { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return ((data?.numero as number) ?? 0) + 1
}

export async function saveDevis(
  devis: Omit<Devis, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<Devis> {
  if (devis.id) {
    const { id, ...rest } = devis
    const { data, error } = await supabase
      .from('devis')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Devis
  }
  const { data, error } = await supabase
    .from('devis')
    .insert(devis)
    .select()
    .single()
  if (error) throw error
  return data as Devis
}

export async function updateDevisStatus(id: string, status: DevisStatus): Promise<void> {
  const { error } = await supabase
    .from('devis')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/**
 * When a transaction is signed, mark all its linked devis as 'accepte'.
 */
export async function syncDevisOnTransactionSigned(transactionId: string): Promise<void> {
  const { error } = await supabase
    .from('devis')
    .update({ status: 'accepte', updated_at: new Date().toISOString() })
    .eq('transaction_id', transactionId)
    .neq('status', 'accepte')
  if (error) throw error
}

/**
 * When a devis is accepted, move its linked transaction to 'signe'.
 */
export async function syncTransactionOnDevisAccepted(transactionId: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ stage: 'signe', updated_at: new Date().toISOString() })
    .eq('id', transactionId)
    .neq('stage', 'signe')
  if (error) throw error
}

export async function deleteDevis(id: string): Promise<void> {
  const { error } = await supabase.from('devis').delete().eq('id', id)
  if (error) throw error
}

// ─── PandaDoc ─────────────────────────────────────────────────────────────────

export interface PandaDocResult {
  doc_id: string
  status: string
  url: string
}

export async function createPandaDocDocument(transactionId: string): Promise<PandaDocResult> {
  const { data, error } = await supabase.functions.invoke('pandadoc', {
    body: { transaction_id: transactionId },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data as PandaDocResult
}

export async function refreshPandaDocStatus(
  docId: string,
  transactionId: string
): Promise<{ status: string; url: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/pandadoc?action=status&doc_id=${encodeURIComponent(docId)}&transaction_id=${encodeURIComponent(transactionId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
    }
  )
  if (!res.ok) throw new Error('Erreur lors du rafraîchissement du statut')
  const result = await res.json()
  if (result.error) throw new Error(result.error)
  return result as { status: string; url: string }
}
