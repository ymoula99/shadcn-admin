import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Euro,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { type DashboardStats, type TransactionStage, type CAMonth, getDashboardStats } from '@/lib/db'
import { stageBadgeClass, stageLabel } from '../transactions/stage-utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const STAGE_ORDER: TransactionStage[] = [
  'prospect',
  'visite_planifiee',
  'visite_effectuee',
  'devis_envoye',
  'relance',
  'signe',
  'perdu',
]

const STAGE_COLORS: Record<TransactionStage, string> = {
  prospect: '#94a3b8',
  visite_planifiee: '#60a5fa',
  visite_effectuee: '#818cf8',
  devis_envoye: '#f59e0b',
  relance: '#fb923c',
  signe: '#22c55e',
  perdu: '#f87171',
}

const SOURCE_LABELS: Record<string, string> = {
  dem24: 'Dem24',
  tel: 'Téléphone',
  email: 'Email',
  website: 'Site web',
  parrainage: 'Parrainage',
  autre: 'Autre',
}

const DEVIS_STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
}

const DEVIS_STATUS_COLORS: Record<string, string> = {
  brouillon: '#94a3b8',
  envoye: '#60a5fa',
  accepte: '#22c55e',
  refuse: '#f87171',
}

// ─── CA Widget ────────────────────────────────────────────────────────────────

function CAWidget({ caTotal, caRealise, caByMonth }: { caTotal: number; caRealise: number; caByMonth: CAMonth[] }) {
  const pct = caTotal > 0 ? Math.round((caRealise / caTotal) * 100) : 0
  return (
    <Card className='lg:col-span-7'>
      <CardHeader className='pb-2 flex flex-row items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='rounded-md p-1.5 bg-[#a2831f]/10'>
            <Euro size={15} className='text-[#a2831f]' />
          </div>
          <CardTitle className='text-base'>Chiffre d'affaires</CardTitle>
        </div>
        <div className='flex items-center gap-6 text-right'>
          <div>
            <p className='text-xs text-muted-foreground'>CA global (devis acceptés)</p>
            <p className='text-xl font-bold tracking-tight'>{EUR(caTotal)}</p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>CA réalisé (chantiers passés)</p>
            <p className='text-xl font-bold tracking-tight text-[#a2831f]'>{EUR(caRealise)}</p>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <p className='text-xs text-muted-foreground'>{pct}% réalisé</p>
            <div className='w-24 h-1.5 rounded-full bg-muted overflow-hidden'>
              <div className='h-full rounded-full bg-[#a2831f]' style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={140}>
          <AreaChart data={caByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id='caTotal' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#a2831f' stopOpacity={0.15} />
                <stop offset='95%' stopColor='#a2831f' stopOpacity={0} />
              </linearGradient>
              <linearGradient id='caRealise' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#22c55e' stopOpacity={0.2} />
                <stop offset='95%' stopColor='#22c55e' stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey='label' tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={36} />
            <Tooltip
              formatter={(v, name) => [
                EUR(Number(v)),
                name === 'caTotal' ? 'CA global' : 'CA réalisé',
              ]}
              contentStyle={{ fontSize: 12 }}
            />
            <Area
              type='monotone'
              dataKey='caTotal'
              stroke='#a2831f'
              strokeWidth={2}
              fill='url(#caTotal)'
              dot={false}
            />
            <Area
              type='monotone'
              dataKey='caRealise'
              stroke='#22c55e'
              strokeWidth={2}
              fill='url(#caRealise)'
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <div className={`rounded-md p-1.5 ${accent ? 'bg-[#a2831f]/10' : 'bg-muted'}`}>
          <Icon size={15} className={accent ? 'text-[#a2831f]' : 'text-muted-foreground'} />
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-2xl font-bold tracking-tight'>{value}</p>
        {sub && <p className='text-xs text-muted-foreground mt-1'>{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Pipeline chart data
  const pipelineData = STAGE_ORDER.map((stage) => ({
    name: stageLabel(stage),
    count: stats?.pipelineByStage[stage] ?? 0,
    color: STAGE_COLORS[stage],
  })).filter((d) => d.count > 0)

  // Devis chart data
  const devisData = Object.entries(stats?.devisByStatus ?? {}).map(([status, val]) => ({
    name: DEVIS_STATUS_LABELS[status] ?? status,
    count: val.count,
    color: DEVIS_STATUS_COLORS[status] ?? '#94a3b8',
  }))

  // Sources chart data
  const sourcesData = Object.entries(stats?.contactsBySource ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      name: SOURCE_LABELS[source] ?? source,
      count,
    }))

  const conversionRate = stats
    ? Math.round(
        ((stats.pipelineByStage['signe'] ?? 0) /
          Math.max(1, Object.values(stats.pipelineByStage).reduce((a, b) => a + b, 0))) *
          100
      )
    : 0

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fluid className='flex flex-col gap-6'>
        {/* ── Title ── */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Tableau de bord</h1>
            <p className='text-muted-foreground text-sm capitalize'>
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <Button variant='outline' size='sm' asChild>
            <Link to='/exploitation/calendrier'>
              <CalendarCheck size={14} />
              Voir le calendrier
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className='text-muted-foreground text-center py-24'>Chargement...</div>
        ) : (
          <>
            {/* ── KPI Row ── */}
            <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
              <KpiCard
                title='Pipeline actif'
                value={stats?.activeCount ?? 0}
                sub={`${conversionRate}% taux de conversion`}
                icon={TrendingUp}
                accent
              />
              <KpiCard
                title='Signées ce mois'
                value={stats?.signedThisMonth ?? 0}
                sub={`${stats?.lostCount ?? 0} perdu${(stats?.lostCount ?? 0) > 1 ? 's' : ''} au total`}
                icon={ArrowUpRight}
              />
              <KpiCard
                title='Devis en attente'
                value={stats?.devisEnAttente ?? 0}
                sub={`CA potentiel : ${EUR(stats?.caPotentiel ?? 0)}`}
                icon={FileText}
              />
              <KpiCard
                title='Contacts'
                value={stats?.totalContacts ?? 0}
                sub={`+${stats?.newContactsThisMonth ?? 0} ce mois`}
                icon={Users}
              />
            </div>

            {/* ── CA Widget ── */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <CAWidget
                caTotal={stats?.caTotal ?? 0}
                caRealise={stats?.caRealise ?? 0}
                caByMonth={stats?.caByMonth ?? []}
              />
            </div>

            {/* ── Charts row ── */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              {/* Pipeline chart */}
              <Card className='lg:col-span-4'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>Pipeline par étape</CardTitle>
                </CardHeader>
                <CardContent>
                  {pipelineData.length === 0 ? (
                    <p className='text-sm text-muted-foreground py-8 text-center'>Aucune transaction.</p>
                  ) : (
                    <ResponsiveContainer width='100%' height={240}>
                      <BarChart
                        data={pipelineData}
                        layout='vertical'
                        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                      >
                        <XAxis type='number' tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis
                          type='category'
                          dataKey='name'
                          width={130}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(v) => [`${v} transaction${Number(v) > 1 ? 's' : ''}`, '']}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey='count' radius={[0, 4, 4, 0]}>
                          {pipelineData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Right column: devis + sources */}
              <div className='lg:col-span-3 flex flex-col gap-4'>
                {/* Devis statuts */}
                <Card className='flex-1'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>Devis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {devisData.length === 0 ? (
                      <p className='text-sm text-muted-foreground py-4 text-center'>Aucun devis.</p>
                    ) : (
                      <ResponsiveContainer width='100%' height={110}>
                        <BarChart data={devisData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                          <XAxis dataKey='name' tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip
                            formatter={(v) => [`${v} devis`, '']}
                            contentStyle={{ fontSize: 12 }}
                          />
                          <Bar dataKey='count' radius={[4, 4, 0, 0]}>
                            {devisData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Sources */}
                <Card className='flex-1'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>Sources prospects</CardTitle>
                  </CardHeader>
                  <CardContent className='flex flex-col gap-2'>
                    {sourcesData.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>Aucun contact.</p>
                    ) : (
                      sourcesData.map(({ name, count }) => {
                        const pct = Math.round((count / (stats?.totalContacts || 1)) * 100)
                        return (
                          <div key={name} className='flex items-center gap-3'>
                            <span className='text-xs text-muted-foreground w-20 shrink-0'>{name}</span>
                            <div className='flex-1 h-1.5 rounded-full bg-muted overflow-hidden'>
                              <div
                                className='h-full rounded-full bg-[#a2831f]'
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className='text-xs font-medium w-6 text-right'>{count}</span>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Bottom row ── */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {/* Recent transactions */}
              <Card>
                <CardHeader className='pb-2 flex flex-row items-center justify-between'>
                  <CardTitle className='text-base'>Dernières transactions</CardTitle>
                  <Button variant='ghost' size='sm' className='h-7 text-xs gap-1' asChild>
                    <Link to='/transactions'>
                      Voir tout <ArrowRight size={12} />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className='flex flex-col gap-0'>
                  {(stats?.recentTransactions ?? []).length === 0 ? (
                    <p className='text-sm text-muted-foreground py-4 text-center'>Aucune transaction.</p>
                  ) : (
                    stats!.recentTransactions.map((tx) => {
                      const contact = tx.contact
                      const name = contact
                        ? `${contact.first_name} ${contact.last_name}`
                        : 'Contact inconnu'
                      const trajet = [tx.departure_city, tx.arrival_city]
                        .filter(Boolean)
                        .join(' → ') || '—'
                      return (
                        <div
                          key={tx.id}
                          className='flex items-center justify-between py-3 border-b last:border-0'
                        >
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium truncate'>{name}</p>
                            <p className='text-xs text-muted-foreground truncate'>{trajet}</p>
                          </div>
                          <Badge
                            variant='outline'
                            className={`text-xs ml-3 shrink-0 ${stageBadgeClass(tx.stage)}`}
                          >
                            {stageLabel(tx.stage)}
                          </Badge>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              {/* Chantiers aujourd'hui + devis en attente */}
              <div className='flex flex-col gap-4'>
                <Card className='flex-1'>
                  <CardHeader className='pb-2 flex flex-row items-center justify-between'>
                    <CardTitle className='text-base'>Aujourd'hui</CardTitle>
                    <Button variant='ghost' size='sm' className='h-7 text-xs gap-1' asChild>
                      <Link to='/exploitation/calendrier'>
                        Calendrier <ArrowRight size={12} />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {(stats?.chantiersToday ?? 0) === 0 ? (
                      <div className='py-6 text-center'>
                        <CalendarCheck size={28} className='mx-auto text-muted-foreground/30 mb-2' />
                        <p className='text-sm text-muted-foreground'>Aucun chantier aujourd'hui.</p>
                      </div>
                    ) : (
                      <div className='flex items-center gap-3 py-2'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[#a2831f]/10'>
                          <span className='text-xl font-bold text-[#a2831f]'>
                            {stats!.chantiersToday}
                          </span>
                        </div>
                        <div>
                          <p className='font-semibold'>
                            {stats!.chantiersToday} chantier{stats!.chantiersToday > 1 ? 's' : ''}
                          </p>
                          <p className='text-xs text-muted-foreground'>planifié{stats!.chantiersToday > 1 ? 's' : ''} ce jour</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className='flex-1'>
                  <CardHeader className='pb-2 flex flex-row items-center justify-between'>
                    <CardTitle className='text-base'>Devis en attente de réponse</CardTitle>
                    <Button variant='ghost' size='sm' className='h-7 text-xs gap-1' asChild>
                      <Link to='/devis'>
                        Voir <ArrowRight size={12} />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {(stats?.devisEnAttente ?? 0) === 0 ? (
                      <div className='py-6 text-center'>
                        <FileText size={28} className='mx-auto text-muted-foreground/30 mb-2' />
                        <p className='text-sm text-muted-foreground'>Tous les devis ont été traités.</p>
                      </div>
                    ) : (
                      <div className='flex items-center gap-3 py-2'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950'>
                          <span className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                            {stats!.devisEnAttente}
                          </span>
                        </div>
                        <div>
                          <p className='font-semibold'>
                            {stats!.devisEnAttente} devis envoyé{stats!.devisEnAttente > 1 ? 's' : ''}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            sans réponse client
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </Main>
    </>
  )
}
