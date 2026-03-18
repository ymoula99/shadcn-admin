import { useEffect, useState } from 'react'
import { CheckCircle2, Mail, RefreshCw, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  type GmailConnection,
  buildGmailAuthUrl,
  disconnectGmail,
  exchangeGmailCode,
  getGmailConnection,
} from '@/lib/gmail'

// ─── Gmail OAuth callback handler ─────────────────────────────────────────────

function useGmailOAuthCallback(onConnected: () => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    // Clean the URL immediately so a page reload doesn't re-trigger
    window.history.replaceState({}, '', window.location.pathname)

    const redirectUri = `${window.location.origin}/settings/integrations`
    exchangeGmailCode(code, redirectUri)
      .then(() => {
        toast.success('Gmail connecté avec succès.')
        onConnected()
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Erreur de connexion Gmail.')
      })
  }, [onConnected])
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsIntegrations() {
  const [connection, setConnection] = useState<GmailConnection | null | 'loading'>('loading')
  const [disconnecting, setDisconnecting] = useState(false)

  const loadConnection = () => {
    setConnection('loading')
    getGmailConnection()
      .then(setConnection)
      .catch(() => setConnection(null))
  }

  useEffect(() => {
    loadConnection()
  }, [])

  useGmailOAuthCallback(loadConnection)

  const handleConnect = () => {
    const redirectUri = `${window.location.origin}/settings/integrations`
    const url = buildGmailAuthUrl(redirectUri)
    window.location.href = url
  }

  const handleDisconnect = async () => {
    if (!connection || connection === 'loading') return
    setDisconnecting(true)
    try {
      await disconnectGmail(connection.id)
      setConnection(null)
      toast.success('Gmail déconnecté.')
    } catch {
      toast.error('Erreur lors de la déconnexion.')
    } finally {
      setDisconnecting(false)
    }
  }

  const isConnected = connection !== 'loading' && connection !== null

  return (
    <div className='flex w-full flex-col gap-6'>
      <div>
        <h3 className='text-lg font-medium'>Intégrations</h3>
        <p className='text-sm text-muted-foreground'>
          Connectez vos outils externes pour enrichir votre CRM.
        </p>
      </div>

      {/* ── Gmail ── */}
      <Card>
        <CardHeader className='flex flex-row items-start justify-between gap-4 pb-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg border bg-white'>
              {/* Google Gmail "G" colors */}
              <svg viewBox='0 0 24 24' className='h-5 w-5' fill='none'>
                <path
                  d='M6 18V8.4L12 12.9l6-4.5V18H6z'
                  fill='#EA4335'
                />
                <path
                  d='M2 6.6C2 5.715 2.715 5 3.6 5H5l7 5.25L19 5h1.4c.885 0 1.6.715 1.6 1.6V18.4c0 .884-.715 1.6-1.6 1.6H3.6C2.716 20 2 19.284 2 18.4V6.6z'
                  fill='#4285F4'
                />
                <path d='M2 6.6 12 13.5l10-6.9V6.6L12 13.5 2 6.6z' fill='#34A853' />
                <path d='M12 13.5 2 6.6v.1L12 13.6l10-6.9v-.1L12 13.5z' fill='#FBBC05' />
              </svg>
            </div>
            <div>
              <CardTitle className='text-base'>Gmail</CardTitle>
              <CardDescription className='text-xs'>
                Envoyez des emails directement depuis le CRM via votre boîte Gmail.
              </CardDescription>
            </div>
          </div>
          {connection === 'loading' ? (
            <RefreshCw size={14} className='mt-1 animate-spin text-muted-foreground' />
          ) : isConnected ? (
            <Badge className='bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200'>
              <CheckCircle2 size={11} className='mr-1' />
              Connecté
            </Badge>
          ) : (
            <Badge variant='outline' className='text-muted-foreground'>
              Non connecté
            </Badge>
          )}
        </CardHeader>

        <CardContent className='flex flex-col gap-3'>
          {isConnected && connection !== 'loading' ? (
            <>
              <div className='flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2'>
                <Mail size={14} className='text-muted-foreground shrink-0' />
                <span className='text-sm font-medium'>{connection.email}</span>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-destructive hover:text-destructive'
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  <Unplug size={13} />
                  {disconnecting ? 'Déconnexion...' : 'Déconnecter'}
                </Button>
                <Button variant='outline' size='sm' onClick={handleConnect}>
                  Changer de compte
                </Button>
              </div>
            </>
          ) : (
            <div className='flex flex-col gap-3'>
              <p className='text-xs text-muted-foreground'>
                Autorisez l'accès à votre compte Gmail pour envoyer des devis, confirmations
                et relances directement depuis Griffon CRM.
              </p>
              <Button
                size='sm'
                className='w-fit'
                onClick={handleConnect}
                disabled={connection === 'loading'}
              >
                <Mail size={14} />
                Connecter Gmail
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Setup note ── */}
      {!isConnected && connection !== 'loading' && (
        <div className='rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-200'>
          <p className='font-medium mb-1'>Configuration requise</p>
          <p>
            Assurez-vous que la variable <code className='bg-amber-100 dark:bg-amber-900 px-1 rounded'>VITE_GMAIL_CLIENT_ID</code> est
            définie dans votre fichier <code className='bg-amber-100 dark:bg-amber-900 px-1 rounded'>.env</code>, et que les secrets{' '}
            <code className='bg-amber-100 dark:bg-amber-900 px-1 rounded'>GMAIL_CLIENT_ID</code> /{' '}
            <code className='bg-amber-100 dark:bg-amber-900 px-1 rounded'>GMAIL_CLIENT_SECRET</code> sont configurés dans Supabase
            Edge Functions.
          </p>
        </div>
      )}
    </div>
  )
}
