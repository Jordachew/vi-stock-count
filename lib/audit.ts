import { supabase } from './supabase'

export interface AuditChange {
  field: string
  oldValue: string | null
  newValue: string | null
}

export async function logMasterItemChanges(params: {
  itemId: string
  sku: string
  changedBy: string | null
  source: 'count_entry' | 'master_data_edit' | 'csv_upload'
  changes: AuditChange[]
}) {
  if (params.changes.length === 0) return
  const rows = params.changes.map((c) => ({
    item_id: params.itemId,
    sku: params.sku,
    changed_by: params.changedBy,
    source: params.source,
    field_name: c.field,
    old_value: c.oldValue,
    new_value: c.newValue,
  }))
  await supabase.from('master_item_audit_log').insert(rows)
}

/** Build a diff between old and new values for auditable fields */
export function diffFields(
  oldObj: Record<string, string | null | undefined>,
  newObj: Record<string, string | null | undefined>,
  fields: string[]
): AuditChange[] {
  return fields.flatMap((f) => {
    const oldVal = oldObj[f] ?? null
    const newVal = newObj[f] ?? null
    if (oldVal === newVal) return []
    return [{ field: f, oldValue: oldVal, newValue: newVal }]
  })
}
