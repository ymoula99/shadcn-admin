# Griffon CRM

CRM métier pour **Griffon Movers** — société de déménagement.

## Fonctionnalités

- **Dashboard** — KPIs en temps réel : pipeline, CA global/réalisé, devis en attente, chantiers du jour
- **Contacts** — gestion des prospects et clients, sources, historique transactions
- **Transactions** — pipeline commercial (kanban + tableau), vue pleine page avec notes rich-text
- **Devis** — création, envoi, catalogue produits, génération PDF + fusion brochure commerciale
- **Exploitation** — chantiers, déménageurs, checklist, calendrier
- **Gmail** — envoi d'emails directement depuis l'app via OAuth2

## Stack technique

| Couche | Technologie |
|---|---|
| UI | React 19 + Vite + Tailwind CSS v4 |
| Composants | shadcn/ui (Radix UI) |
| Routing | TanStack Router (file-based) |
| Backend / DB | Supabase (PostgreSQL + RLS + Edge Functions) |
| Auth | Supabase Auth |
| PDF | pdf-lib + html2canvas |
| Rich text | Tiptap |
| Drag & drop | @dnd-kit |
| Charts | Recharts |

## Démarrage

### Prérequis

- Node.js 18+
- Un projet Supabase actif

### Installation

```bash
npm install
```

### Variables d'environnement

Copiez `.env.example` en `.env.local` et renseignez les valeurs :

```bash
cp .env.example .env.local
```

### Lancer en développement

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Intégration Gmail

1. Créez un projet Google Cloud et activez l'API Gmail
2. Créez des identifiants OAuth 2.0 (type "Application Web") avec l'URI de redirection : `https://votre-domaine.com/settings/integrations`
3. Ajoutez `VITE_GMAIL_CLIENT_ID` dans `.env.local`
4. Configurez les secrets Supabase Edge Functions :
   ```bash
   supabase secrets set GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=...
   ```
5. Connectez votre compte dans **Paramètres › Intégrations**

## Variables d'environnement

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `VITE_GMAIL_CLIENT_ID` | Client ID Google OAuth (facultatif) |
