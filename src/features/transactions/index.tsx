import { useEffect, useState } from 'react'
import { KanbanSquare, List, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { type Transaction, getTransactions } from '@/lib/db'
import { TransactionsDialogs } from './components/transactions-dialogs'
import {
  TransactionsProvider,
  useTransactions,
} from './components/transactions-provider'
import { TransactionsKanban } from './components/transactions-kanban'
import { TransactionsTable } from './components/transactions-table'

type View = 'list' | 'kanban'

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const { setOpen } = useTransactions()

  useEffect(() => {
    getTransactions()
      .then(setTransactions)
      .catch(() => toast.error('Impossible de charger les transactions.'))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(tx: Transaction) {
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === tx.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = tx
        return updated
      }
      return [tx, ...prev]
    })
  }

  function handleDeleted(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
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
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Transactions</h2>
            <p className='text-muted-foreground'>
              Gérez vos dossiers de déménagement.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center rounded-md border p-0.5'>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors ${
                  view === 'list'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List size={15} />
                Liste
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors ${
                  view === 'kanban'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <KanbanSquare size={15} />
                Kanban
              </button>
            </div>
            <Button onClick={() => setOpen('add')}>
              <Plus size={16} />
              Nouvelle transaction
            </Button>
          </div>
        </div>

        {loading ? (
          <div className='text-muted-foreground py-12 text-center'>
            Chargement...
          </div>
        ) : view === 'list' ? (
          <TransactionsTable data={transactions} />
        ) : (
          <TransactionsKanban data={transactions} />
        )}
      </Main>

      <TransactionsDialogs onSaved={handleSaved} onDeleted={handleDeleted} />
    </>
  )
}

export function Transactions() {
  return (
    <TransactionsProvider>
      <TransactionsContent />
    </TransactionsProvider>
  )
}
