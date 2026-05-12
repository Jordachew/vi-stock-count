import { MasterItem, StockCountActual, VarianceLine } from '@/types'

/**
 * Build variance lines from master items + counted actuals for a single session.
 * Variance = counted_qty - system_qty  (positive=over, negative=short)
 */
export function buildVarianceLines(
  masterItems: MasterItem[],
  actuals: StockCountActual[]
): VarianceLine[] {
  // Aggregate counted qty by SKU
  const counted = actuals.reduce<Record<string, number>>((acc, a) => {
    acc[a.sku] = (acc[a.sku] ?? 0) + a.qty_counted
    return acc
  }, {})

  const masterSkus = new Set(masterItems.map((m) => m.sku))
  const lines: VarianceLine[] = []

  // All master items
  for (const item of masterItems) {
    const countedQty = counted[item.sku] ?? 0
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
      description: item.description,
      branch: item.branch,
      location: item.location,
      size: item.size,
      color: item.color,
      system_qty: item.system_qty,
      counted_qty: countedQty,
      variance,
      variance_pct: variancePct,
      status,
    })
  }

  // Items counted but NOT in master
  for (const [sku, countedQty] of Object.entries(counted)) {
    if (!masterSkus.has(sku)) {
      const actual = actuals.find((a) => a.sku === sku)
      lines.push({
        sku,
        description: actual?.description ?? null,
        branch: null,
        location: actual?.location ?? null,
        size: actual?.size ?? null,
        color: actual?.color ?? null,
        system_qty: 0,
        counted_qty: countedQty,
        variance: countedQty,
        variance_pct: null,
        status: 'unrecognized',
      })
    }
  }

  return lines
}
