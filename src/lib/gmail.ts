import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

export interface GmailConnection {
  id: string
  email: string
  token_expiry: string
}

export async function getGmailConnection(): Promise<GmailConnection | null> {
  const { data, error } = await supabase
    .from('gmail_connections')
    .select('id, email, token_expiry')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as GmailConnection | null
}

export async function disconnectGmail(id: string): Promise<void> {
  const { error } = await supabase
    .from('gmail_connections')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export function buildGmailAuthUrl(redirectUri: string): string {
  const clientId = import.meta.env.VITE_GMAIL_CLIENT_ID as string
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGmailCode(code: string, redirectUri: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/gmail-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Échec de la connexion Gmail')
  return data.email as string
}

export async function sendGmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/gmail-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ to, subject, body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Échec de l'envoi')
}
