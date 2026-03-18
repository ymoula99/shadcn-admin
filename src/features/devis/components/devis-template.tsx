import { forwardRef } from 'react'
import { type Devis, type DevisItem } from '@/lib/db'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const pad = (n: number) => String(n).padStart(4, '0')

function rowTotal(item: DevisItem) {
  return item.quantity * item.unit_price
}

// ─── Styles (inline — garantis en impression) ─────────────────────────────────

const S = {
  page: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    backgroundColor: '#ffffff',
    color: '#111827',
    padding: '48px 56px',
    maxWidth: '860px',
    margin: '0 auto',
    fontSize: '13px',
    lineHeight: '1.5',
  } as React.CSSProperties,

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
    paddingBottom: '32px',
    borderBottom: '3px solid #a2831f',
  } as React.CSSProperties,
  logoName: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#a2831f',
    letterSpacing: '-0.5px',
    margin: 0,
  } as React.CSSProperties,
  logoTagline: {
    fontSize: '11px',
    color: '#6b7280',
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
    marginTop: '4px',
  } as React.CSSProperties,
  docTitle: {
    textAlign: 'right' as const,
  },
  docTitleText: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#111827',
    letterSpacing: '-0.5px',
    margin: 0,
  } as React.CSSProperties,
  docNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#a2831f',
    marginTop: '2px',
  } as React.CSSProperties,
  docMeta: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  } as React.CSSProperties,

  // Info boxes
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '36px',
  } as React.CSSProperties,
  infoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  } as React.CSSProperties,
  infoBoxLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#a2831f',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    marginBottom: '10px',
  } as React.CSSProperties,
  infoName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '4px',
  } as React.CSSProperties,
  infoLine: {
    fontSize: '12px',
    color: '#4b5563',
    marginBottom: '3px',
  } as React.CSSProperties,
  infoRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '3px',
    fontSize: '12px',
  } as React.CSSProperties,
  infoRowLabel: {
    color: '#9ca3af',
    minWidth: '52px',
  } as React.CSSProperties,
  infoRowValue: {
    color: '#111827',
    fontWeight: '500',
  } as React.CSSProperties,

  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '28px',
  } as React.CSSProperties,
  thead: {
    backgroundColor: '#a2831f',
  } as React.CSSProperties,
  th: {
    padding: '12px 14px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  thRight: {
    padding: '12px 14px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    textAlign: 'right' as const,
  } as React.CSSProperties,
  thCenter: {
    padding: '12px 14px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  tdEven: {
    padding: '12px 14px',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: '#ffffff',
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  tdOdd: {
    padding: '12px 14px',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: '#fafafa',
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  tdCenter: {
    textAlign: 'center' as const,
  } as React.CSSProperties,
  tdRight: {
    textAlign: 'right' as const,
  } as React.CSSProperties,
  itemLabel: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: '2px',
  } as React.CSSProperties,
  itemDesc: {
    fontSize: '11px',
    color: '#6b7280',
  } as React.CSSProperties,

  // Totals
  totalsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '36px',
  } as React.CSSProperties,
  totalsBox: {
    width: '280px',
  } as React.CSSProperties,
  totalLine: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '13px',
    borderBottom: '1px solid #f3f4f6',
  } as React.CSSProperties,
  totalLineLabel: {
    color: '#6b7280',
  } as React.CSSProperties,
  totalLineValue: {
    fontWeight: '500',
  } as React.CSSProperties,
  totalTTCLine: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0',
    marginTop: '4px',
    borderTop: '2px solid #111827',
  } as React.CSSProperties,
  totalTTCLabel: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#111827',
  } as React.CSSProperties,
  totalTTCValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#a2831f',
  } as React.CSSProperties,

  // Footer
  footer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    paddingTop: '28px',
    borderTop: '1px solid #e5e7eb',
  } as React.CSSProperties,
  footerLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#a2831f',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    marginBottom: '10px',
  } as React.CSSProperties,
  footerText: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.6',
  } as React.CSSProperties,
  signatureBox: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    height: '100px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  signatureHint: {
    fontSize: '11px',
    color: '#d1d5db',
  } as React.CSSProperties,
} as const

// ─── Component ────────────────────────────────────────────────────────────────

interface DevisTemplateProps {
  devis: Devis
}

export const DevisTemplate = forwardRef<HTMLDivElement, DevisTemplateProps>(
  ({ devis }, ref) => {
    const totalHT = devis.items.reduce((s, i) => s + rowTotal(i), 0)
    const tvaAmount = totalHT * (devis.tva_pct / 100)
    const totalTTC = totalHT + tvaAmount

    const emittedDate = new Date(devis.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    const validDate = devis.valid_until
      ? new Date(devis.valid_until).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null

    return (
      <div ref={ref} style={S.page}>
        {/* ── Header ── */}
        <div style={S.header}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <img
              src='/images/griffon-logo.png'
              alt='Griffon Movers'
              style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                const t = e.currentTarget
                t.style.display = 'none'
                const fallback = t.nextElementSibling as HTMLElement | null
                if (fallback) fallback.style.display = 'block'
              }}
            />
            <div style={{ display: 'none' }}>
              <p style={S.logoName}>GRIFFON MOVERS</p>
              <p style={S.logoTagline}>MOVE YOUR LIFE.</p>
            </div>
          </div>
          <div style={S.docTitle}>
            <p style={S.docTitleText}>DEVIS</p>
            <p style={S.docNumber}>N° DEV-{pad(devis.numero)}</p>
            <p style={S.docMeta}>Émis le {emittedDate}</p>
            {validDate && (
              <p style={S.docMeta}>Valable jusqu'au {validDate}</p>
            )}
          </div>
        </div>

        {/* ── Client + Move ── */}
        <div style={S.infoGrid}>
          <div style={S.infoBox}>
            <p style={S.infoBoxLabel}>Client</p>
            <p style={S.infoName}>{devis.client_name || '—'}</p>
            {devis.client_email && <p style={S.infoLine}>{devis.client_email}</p>}
            {devis.client_phone && <p style={S.infoLine}>{devis.client_phone}</p>}
          </div>
          <div style={S.infoBox}>
            <p style={S.infoBoxLabel}>Déménagement</p>
            {devis.move_from && (
              <div style={S.infoRow}>
                <span style={S.infoRowLabel}>Départ</span>
                <span style={S.infoRowValue}>{devis.move_from}</span>
              </div>
            )}
            {devis.move_to && (
              <div style={S.infoRow}>
                <span style={S.infoRowLabel}>Arrivée</span>
                <span style={S.infoRowValue}>{devis.move_to}</span>
              </div>
            )}
            {devis.move_date && (
              <div style={S.infoRow}>
                <span style={S.infoRowLabel}>Date</span>
                <span style={S.infoRowValue}>{devis.move_date}</span>
              </div>
            )}
            {devis.move_volume && (
              <div style={S.infoRow}>
                <span style={S.infoRowLabel}>Volume</span>
                <span style={S.infoRowValue}>{devis.move_volume}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Items table ── */}
        <table style={S.table}>
          <thead style={S.thead}>
            <tr>
              <th style={{ ...S.th, textAlign: 'left', width: '45%' }}>Prestation</th>
              <th style={S.thCenter}>Qté</th>
              <th style={S.thRight}>Prix unit. HT</th>
              <th style={S.thRight}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {devis.items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ ...S.tdEven, textAlign: 'center', color: '#9ca3af', padding: '24px' }}
                >
                  Aucune prestation ajoutée
                </td>
              </tr>
            ) : (
              devis.items.map((item, i) => {
                const td = i % 2 === 0 ? S.tdEven : S.tdOdd
                return (
                  <tr key={item.id}>
                    <td style={td}>
                      <p style={S.itemLabel}>{item.label}</p>
                      {item.description && <p style={S.itemDesc}>{item.description}</p>}
                    </td>
                    <td style={{ ...td, ...S.tdCenter }}>{item.quantity}</td>
                    <td style={{ ...td, ...S.tdRight }}>{EUR(item.unit_price)}</td>
                    <td style={{ ...td, ...S.tdRight, fontWeight: '600' }}>
                      {EUR(rowTotal(item))}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* ── Totals ── */}
        <div style={S.totalsRow}>
          <div style={S.totalsBox}>
            <div style={S.totalLine}>
              <span style={S.totalLineLabel}>Total HT</span>
              <span style={S.totalLineValue}>{EUR(totalHT)}</span>
            </div>
            <div style={S.totalLine}>
              <span style={S.totalLineLabel}>TVA ({devis.tva_pct}%)</span>
              <span style={S.totalLineValue}>{EUR(tvaAmount)}</span>
            </div>
            <div style={S.totalTTCLine}>
              <span style={S.totalTTCLabel}>Total TTC</span>
              <span style={S.totalTTCValue}>{EUR(totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* ── Footer : conditions + signature ── */}
        <div style={S.footer}>
          <div>
            {devis.notes && (
              <div style={{ marginBottom: '16px' }}>
                <p style={S.footerLabel}>Notes</p>
                <p style={{ ...S.footerText, whiteSpace: 'pre-wrap' }}>{devis.notes}</p>
              </div>
            )}
            {devis.conditions && (
              <div>
                <p style={S.footerLabel}>Conditions</p>
                <p style={S.footerText}>{devis.conditions}</p>
              </div>
            )}
          </div>
          <div>
            <p style={S.footerLabel}>Signature client</p>
            <p style={{ ...S.footerText, marginBottom: '8px' }}>Bon pour accord</p>
            <div style={S.signatureBox}>
              <p style={S.signatureHint}>Signature + date</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

DevisTemplate.displayName = 'DevisTemplate'
