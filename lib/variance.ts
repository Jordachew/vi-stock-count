import { MasterItem, StockCountActual, VarianceLine } from '@/types'

const normSku = (s: string) => s.trim().toUpperCase()

/**
 * Build variance lines from master items + counted actuals (one or more sessions).
 * - SKU matching is case/whitespace-insensitive
 * - Description always comes from master data
 * - Size + color come from count entry (what was physically found); fall back to master
 * - Variance = counted_qty - system_qty (positive = over, negative = short)
 */
export function buildVarianceLines(
  masterItems: MasterItem[],
  actuals: StockCountActual[]
): VarianceLine[] {
  // Build master lookup by normalized SKU
  const masterBySku = new Map<string, MasterItem>()
  for (const item of masterItems) {
    masterBySku.set(normSku(item.sku), item)
  }

  // Aggregate counted qty + collect first actual per normalized SKU
  const counted = new Map<string, { qty: number; actual: StockCountActual }>()
  for (const a of actuals) {
    const key = normSku(a.sku)
    const existing = counted.get(key)
    if (existing) {
      existing.qty += a.qty_counted
    } else {
      counted.set(key, { qty: a.qty_counted, actual: a })
    }
  }

  const masterNormSkus = new Set(masterBySku.keys())
  const lines: VarianceLine[] = []

  // All master items
  for (const item of masterItems) {
    const key = normSku(item.sku)
    const countData = counted.get(key)
    const countedQty = countData?.qty ?? 0
    const countActual = countData?.actual

    const variance = countedQty - item.system_qty
    const variancePct =
      item.system_qty !== 0 ? (variance / item.system_qty) * 100 : null

    let status: VarianceLine['status']
    if (countedQty === 0 && item.system_qty > 0) status = 'missing'
    else if (variance < 0) status = 'short'
    else if (variance > 0) status = 'over'
    else status = 'matched'

    lines.push({
      sku: item.sku,
      description: item.description,                        // always master
      branch: item.branch,
      location: countActual?.location ?? item.location,
      size: countActual?.size ?? item.size,                 // count first, master fallback
      color: countActual?.color ?? item.color,              // count first, master fallback
      system_qty: item.system_qty,
      counted_qty: countedQty,
      variance,
      variance_pct: variancePct,
      status,
    })
  }

  // Items counted but NOT in master (after normalization)
  Array.from(counted.entries()).forEach(([key, { qty: countedQty, actual }]) => {
    if (!masterNormSkus.has(key)) {
      lines.push({
        sku: actual.sku,
        description: actual.description ?? null,
        branch: null,
        location: actual.location ?? null,
        size: actual.size ?? null,
        color: actual.color ?? null,
        system_qty: 0,
        counted_qty: countedQty,
        variance: countedQty,
        variance_pct: null,
        status: 'unrecognized',
      })
    }
  })

  return lines
}
