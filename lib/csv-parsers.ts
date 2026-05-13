import Papa from 'papaparse'
import { MasterItem, StockCountActual } from '@/types'

/**
 * Parse DD/MM/YYYY date string (Jamaican / SharePoint format) to ISO YYYY-MM-DD.
 */
export function parseJamaicanDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null
  const trimmed = raw.trim()
  const parts = trimmed.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(date.getTime())) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  const iso = new Date(trimmed)
  if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0]
  return null
}

/**
 * Parse MM/DD/YYYY date string (QuickBooks / US format) to ISO YYYY-MM-DD.
 */
export function parseUSDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null
  const trimmed = raw.trim()
  const parts = trimmed.split('/')
  if (parts.length === 3) {
    const [m, d, y] = parts
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(date.getTime())) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  const iso = new Date(trimmed)
  if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0]
  return null
}

function cleanSku(raw: string, rowIndex: number): string {
  if (!raw || !raw.trim()) return `UNKNOWN-${rowIndex + 1}`
  return raw.trim()
}

/**
 * Extract size and color from a QuickBooks description field.
 *
 * QB format: "NNNN Product Name [SIZE] / COLOR"
 * Examples:
 *   "0018 Girdle Panties M / Black"     → { size: "M",   color: "Black" }
 *   "0024 Padded Lace Bras 42E / Black" → { size: "42E", color: "Black" }
 *   "0032 Plain Broad Body Bra 50 / Nude" → { size: "50", color: "Nude" }
 *   "0001 Full Brief Panties / White"   → { size: null,  color: "White" }
 */
export function extractSizeColor(description: string): { size: string | null; color: string | null } {
  const slashIdx = description.indexOf(' / ')
  const color = slashIdx !== -1 ? description.slice(slashIdx + 3).trim() || null : null
  const base = slashIdx !== -1 ? description.slice(0, slashIdx).trim() : description.trim()

  // The size is the last whitespace-separated token in base (if it looks like a size)
  const lastWord = base.split(/\s+/).pop() ?? ''
  const isBraSize    = /^\d{2,3}[A-Z]{1,3}$/i.test(lastWord)   // 38E, 42DD, 46D
  const isApparelSize = /^(XS|S|M|L|XL|XXL|[2-9]XL|Med)$/i.test(lastWord)  // S/M/L/XL/XXL/Med/etc
  const isNumericSize = /^\d{2,3}$/.test(lastWord)              // 50, 52, 56

  const size = (isBraSize || isApparelSize || isNumericSize) ? lastWord : null
  return { size, color }
}

export interface MasterCSVResult {
  items: Omit<MasterItem, 'id' | 'created_at' | 'updated_at' | 'is_active'>[]
  errors: string[]
}

/**
 * Detect whether a CSV row set looks like a QuickBooks export.
 * QB exports have "Sales Description" and/or "Quantity On Hand" columns.
 */
function isQBFormat(headers: string[]): boolean {
  return headers.some((h) => h === 'Sales Description' || h === 'Quantity On Hand')
}

export function parseMasterCSV(file: File): Promise<MasterCSVResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const items: Omit<MasterItem, 'id' | 'created_at' | 'updated_at' | 'is_active'>[] = []
        const rows = results.data as Record<string, string>[]
        const headers = results.meta.fields ?? []
        const qb = isQBFormat(headers)

        rows.forEach((row, i) => {
          let sku: string
          let description: string
          let systemQty: number
          let system_qty_date: string | null
          let size: string | null
          let color: string | null
          let location: string | null
          let branch: string | null

          if (qb) {
            // --- QuickBooks Online product/service export ---
            // SKU may be in "SKU" column; Name in "Name" column
            sku = cleanSku(row['SKU'] ?? row['Name'] ?? '', i)
            const rawDesc = (row['Sales Description'] ?? row['Description'] ?? '').trim()
            description = rawDesc

            // Try to extract size/color from description
            if (rawDesc) {
              const parsed = extractSizeColor(rawDesc)
              size = parsed.size
              color = parsed.color
            } else {
              size = null
              color = null
            }

            const qtyRaw = row['Quantity On Hand'] ?? row['QTY Count'] ?? '0'
            systemQty = parseFloat(String(qtyRaw).replace(/,/g, '').trim()) || 0

            const dateRaw = row['Quantity as-of Date'] ?? row['As Of'] ?? ''
            system_qty_date = parseUSDate(dateRaw)

            location = (row['In store location'] ?? row['location'] ?? '').trim() || null
            branch = (row['Branch'] ?? row['branch'] ?? '').trim() || null
          } else {
            // --- SharePoint / internal CSV format ---
            sku = cleanSku(row['SKU'] ?? row['sku'] ?? '', i)
            description = (row['SKU: Description'] ?? row['description'] ?? '').trim()

            // Explicit size/color columns take priority; fall back to parsing description
            const explicitSize = (row['Size'] ?? row['size'] ?? '').trim() || null
            const explicitColor = (row['Color'] ?? row['color'] ?? '').trim() || null
            if (!explicitSize && !explicitColor && description) {
              const parsed = extractSizeColor(description)
              size = parsed.size
              color = parsed.color
            } else {
              size = explicitSize
              color = explicitColor
            }

            const systemQtyRaw = row['QTY Count'] ?? row['qty_count'] ?? row['system_qty'] ?? '0'
            systemQty = parseInt(String(systemQtyRaw).trim(), 10) || 0

            const dateRaw = row['Qty Date'] ?? row['system_qty_date'] ?? ''
            system_qty_date = dateRaw ? parseJamaicanDate(dateRaw) : null

            location = (row['In store location'] ?? row['location'] ?? '').trim() || null
            branch = (row['Branch'] ?? row['branch'] ?? '').trim() || null
          }

          if (!description) {
            errors.push(`Row ${i + 2}: Missing description for SKU "${sku}"`)
          }

          items.push({
            sku,
            description: description || sku,
            size,
            color,
            system_qty: systemQty,
            system_qty_date,
            branch,
            location,
          })
        })

        resolve({ items, errors })
      },
      error: (err) => {
        resolve({ items: [], errors: [`CSV parse error: ${err.message}`] })
      },
    })
  })
}

export interface ActualsCSVResult {
  actuals: Omit<StockCountActual, 'id' | 'session_id' | 'created_at' | 'updated_at'>[]
  errors: string[]
}

export function parseActualsCSV(file: File): Promise<ActualsCSVResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const actuals: Omit<StockCountActual, 'id' | 'session_id' | 'created_at' | 'updated_at'>[] = []

        ;(results.data as Record<string, string>[]).forEach((row, i) => {
          const sku = cleanSku(row['SKU'] ?? row['sku'] ?? '', i)
          const description = (row['SKU: Description'] ?? row['description'] ?? '').trim() || null
          const qtyRaw = row['QTY Count'] ?? row['qty_count'] ?? row['qty_counted'] ?? '1'
          const qtyCounted = parseInt(String(qtyRaw).trim(), 10) || 1
          const location = (row['In store location'] ?? row['location'] ?? '').trim() || null
          const size = (row['Size'] ?? row['size'] ?? '').trim() || null
          const color = (row['Color'] ?? row['color'] ?? '').trim() || null
          const enteredBy = (row['Entered by:'] ?? row['entered_by'] ?? '').trim() || null
          const dateRaw = row['Date of count'] ?? row['date_of_count'] ?? ''
          const dateOfCount = parseJamaicanDate(dateRaw)

          actuals.push({
            sku,
            description,
            qty_counted: qtyCounted,
            location,
            size,
            color,
            entered_by: enteredBy,
            date_of_count: dateOfCount,
            notes: null,
            is_new_item: false,
          })
        })

        resolve({ actuals, errors })
      },
      error: (err) => {
        resolve({ actuals: [], errors: [`CSV parse error: ${err.message}`] })
      },
    })
  })
}

export function exportToCSV(data: Record<string, string | number | null | undefined>[], filename: string) {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
