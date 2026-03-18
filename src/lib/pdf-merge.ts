import html2canvas from 'html2canvas'
import { PDFDocument } from 'pdf-lib'
import { supabase } from './supabase'

// ─── Storage helpers ──────────────────────────────────────────────────────────

const BUCKET = 'brochures'
const BROCHURE_PATH = 'plaquette-commerciale.pdf'

export async function uploadBrochure(file: File): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(BROCHURE_PATH, file, { upsert: true, contentType: 'application/pdf' })
  if (error) throw new Error(error.message)
}

export async function getBrochureUrl(): Promise<string | null> {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(BROCHURE_PATH)
  // Check if it actually exists by trying a HEAD request
  try {
    const res = await fetch(data.publicUrl, { method: 'HEAD' })
    return res.ok ? data.publicUrl : null
  } catch {
    return null
  }
}

export async function hasBrochure(): Promise<boolean> {
  const url = await getBrochureUrl()
  return url !== null
}

// ─── PDF generation ───────────────────────────────────────────────────────────

/**
 * Renders an HTML element to a PDF page (as an image) using html2canvas + pdf-lib.
 */
async function elementToPdfBytes(element: HTMLElement): Promise<Uint8Array> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (_win, clonedEl) => {
      // Remove all stylesheets from the cloned document so html2canvas never
      // tries to parse oklch() colors (Tailwind v4). DevisTemplate is safe
      // because it uses 100% inline styles with hex/rgb values only.
      clonedEl.ownerDocument
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach((el) => el.remove())
    },
  })

  const imgData = canvas.toDataURL('image/png')
  const imgBytes = await fetch(imgData).then((r) => r.arrayBuffer())

  const pricingPdf = await PDFDocument.create()
  const pngImage = await pricingPdf.embedPng(imgBytes)

  // A4 in pts: 595.28 × 841.89
  const pageWidth = 595.28
  const pageHeight = 841.89

  // Scale the canvas so it fits A4 width, preserving aspect ratio
  const imgAspect = canvas.height / canvas.width
  const renderedHeight = Math.min(pageWidth * imgAspect, pageHeight)

  const page = pricingPdf.addPage([pageWidth, pageHeight])
  page.drawImage(pngImage, {
    x: 0,
    y: pageHeight - renderedHeight,
    width: pageWidth,
    height: renderedHeight,
  })

  return pricingPdf.save()
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface MergeOptions {
  /** The HTML element containing the pricing page (DevisTemplate) */
  pricingElement: HTMLElement
  /** Client name for the filename */
  clientName: string
  /** Devis numero */
  numero: number
}

/**
 * Downloads a merged PDF: brochure pages first, then the pricing page.
 * Falls back to pricing-only if no brochure is uploaded.
 */
export async function downloadMergedDevis({
  pricingElement,
  clientName,
  numero,
}: MergeOptions): Promise<void> {
  const brochureUrl = await getBrochureUrl()

  // Generate the pricing page PDF
  const pricingBytes = await elementToPdfBytes(pricingElement)

  let finalBytes: Uint8Array

  if (brochureUrl) {
    // Merge: brochure + pricing page
    const brochureResponse = await fetch(brochureUrl)
    if (!brochureResponse.ok) throw new Error('Impossible de charger la plaquette.')
    const brochureBytes = await brochureResponse.arrayBuffer()

    const merged = await PDFDocument.create()
    const brochurePdf = await PDFDocument.load(brochureBytes)
    const pricingPdf = await PDFDocument.load(pricingBytes)

    const brochurePageIndices = brochurePdf.getPageIndices()
    const copiedBrochurePages = await merged.copyPages(brochurePdf, brochurePageIndices)
    copiedBrochurePages.forEach((p) => merged.addPage(p))

    const pricingPageIndices = pricingPdf.getPageIndices()
    const copiedPricingPages = await merged.copyPages(pricingPdf, pricingPageIndices)
    copiedPricingPages.forEach((p) => merged.addPage(p))

    finalBytes = await merged.save()
  } else {
    // No brochure — just the pricing page
    finalBytes = pricingBytes
  }

  // Trigger download
  const blob = new Blob([finalBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const num = String(numero).padStart(4, '0')
  a.href = url
  a.download = `DEV-${num}_${clientName.replace(/\s+/g, '_')}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
