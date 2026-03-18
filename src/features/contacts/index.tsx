import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { type Contact, getContacts } from '@/lib/db'
import { ContactsDialogs } from './components/contacts-dialogs'
import { ContactsProvider, useContacts } from './components/contacts-provider'
import { ContactsTable } from './components/contacts-table'

function ContactsContent() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const { setOpen } = useContacts()

  useEffect(() => {
    getContacts()
      .then(setContacts)
      .catch(() => toast.error('Impossible de charger les contacts.'))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(contact: Contact) {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === contact.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = contact
        return updated
      }
      return [contact, ...prev]
    })
  }

  function handleDeleted(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
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
            <h2 className='text-2xl font-bold tracking-tight'>Contacts</h2>
            <p className='text-muted-foreground'>
              Gérez vos contacts et prospects.
            </p>
          </div>
          <Button onClick={() => setOpen('add')}>
            <Plus size={16} />
            Nouveau contact
          </Button>
        </div>

        {loading ? (
          <div className='text-muted-foreground py-12 text-center'>
            Chargement...
          </div>
        ) : (
          <ContactsTable data={contacts} />
        )}
      </Main>

      <ContactsDialogs onSaved={handleSaved} onDeleted={handleDeleted} />
    </>
  )
}

export function Contacts() {
  return (
    <ContactsProvider>
      <ContactsContent />
    </ContactsProvider>
  )
}
