import { useEffect, useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type GmailConnection, getGmailConnection, sendGmail } from '@/lib/gmail'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
}: Props) {
  const [connection, setConnection] = useState<GmailConnection | null | 'loading'>('loading')
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) {
      setTo(defaultTo)
      setSubject(defaultSubject)
      setBody(defaultBody)
      getGmailConnection()
        .then(setConnection)
        .catch(() => setConnection(null))
    }
  }, [open, defaultTo, defaultSubject, defaultBody])

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast.error('Veuillez remplir tous les champs.')
      return
    }
    setSending(true)
    try {
      await sendGmail({ to, subject, body })
      toast.success('Email envoyé avec succès.')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Mail size={16} />
            Nouveau message
          </DialogTitle>
        </DialogHeader>

        {connection === 'loading' ? (
          <p className='text-sm text-muted-foreground py-4 text-center'>Chargement...</p>
        ) : !connection ? (
          <div className='flex flex-col items-center gap-3 py-6 text-center'>
            <Mail size={32} className='text-muted-foreground/40' />
            <p className='text-sm font-medium'>Gmail non connecté</p>
            <p className='text-xs text-muted-foreground'>
              Connectez votre compte Gmail dans{' '}
              <a href='/settings/integrations' className='underline text-[#a2831f]'>
                Paramètres › Intégrations
              </a>{' '}
              pour envoyer des emails.
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            <p className='text-xs text-muted-foreground'>
              Depuis : <span className='font-medium text-foreground'>{connection.email}</span>
            </p>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='email-to'>À</Label>
              <Input
                id='email-to'
                type='email'
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder='destinataire@email.com'
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='email-subject'>Objet</Label>
              <Input
                id='email-subject'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder='Objet du message'
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='email-body'>Message</Label>
              <Textarea
                id='email-body'
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='Votre message...'
                rows={8}
                className='resize-none'
              />
            </div>

            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                <Send size={14} />
                {sending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
