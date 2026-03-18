import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Contact } from '@/lib/db'

type ContactsDialogType = 'add' | 'edit' | 'delete' | 'view'

type ContactsContextType = {
  open: ContactsDialogType | null
  setOpen: (str: ContactsDialogType | null) => void
  currentRow: Contact | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Contact | null>>
}

const ContactsContext = React.createContext<ContactsContextType | null>(null)

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ContactsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Contact | null>(null)

  return (
    <ContactsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ContactsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useContacts = () => {
  const ctx = React.useContext(ContactsContext)
  if (!ctx) throw new Error('useContacts must be used within <ContactsProvider>')
  return ctx
}
