import Papa from 'papaparse'
import { MasterItem, StockCountActual } from '@/types'

/**
 * Parse DD/MM/YYYY date string (Jamaican format) to ISO date string YYYY-MM-DD.
 * Falls back to raw value if parsing fails.
 */
export function parseJamaicanDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null
  const trimmed = raw.trim()
  // Try DD/MM/YYYY
  const parts = trimmed.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(date.getTime())) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  // Try ISO already
  const iso = new Date(trimmed)
  if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0]
  return null
}

function cleanSku(raw: string, rowIndex: number): string {
  if (!raw || !raw.trim()) return `UNKNOWN-${rowIndex + 1}`
  return raw.trim()
}

export interface MasterCSVResult {
  items: Omit<MasterItem, 'id' | 'created_at' | 'updated_at' | 'is_active'>[]
  errors: string[]
}

export function parseMasterCSV(file: File): Promise<MasterCSVResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const items: Omit<MasterItem, 'id' | 'created_at' | 'updated_at' | 'is_active'>[] = []

        results.data.forEach((row: any, i: number) => {
          const sku = cleanSku(row['SKU'] ?? row['sku'] ?? '', i)
          const description = (row['SKU: Description'] ?? row['description'] ?? '').trim()
          const systemQtyRaw = row['QTY Count'] ?? row['qty_count'] ?? row['system_qty'] ?? '0'
          const systemQty = parseInt(String(systemQtyRaw).trim(), 10) || 0
          const location = (row['In store location'] ?? row['location'] ?? '').trim() || null
          const branch = (row['Branch'] ?? row['branch'] ?? '').trim() || null
          const size = (row['Size'] ?? row['size'] ?? '').trim() || null
          const color = (row['Color'] ?? row['color'] ?? '').trim() || null

          if (!description) {
            errors.push(`Row ${i + 2}: Missing description for SKU "${sku}"`)
          }

          items.push({
            sku,
            description: description || sku,
            size,
            color,
            system_qty: systemQty,
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

export function parseActualsCSV(file: File, sessionId: string): Promise<ActualsCSVResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const actuals: Omit<StockCountActual, 'id' | 'session_id' | 'created_at' | 'updated_at'>[] = []

        results.data.forEach((row: any, i: number) => {
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

export function exportToCSV(data: Record<string, any>[], filename: string) {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
