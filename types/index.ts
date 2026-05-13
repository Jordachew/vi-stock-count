export type Branch = 'Montego Bay' | 'Kingston' | 'Off site storage'

export type SessionStatus = 'open' | 'closed' | 'reconciled'

export type Location =
  | `Draw ${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | `Bra Column ${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `Storage room shelf ${1 | 2}`
  | 'Rack 1'
  | string

export interface MasterItem {
  id: string
  sku: string
  description: string
  size: string | null
  color: string | null
  category: string | null
  system_qty: number
  system_qty_date: string | null
  branch: string | null
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DropdownOption {
  id: string
  type: 'size' | 'color' | 'category' | 'location'
  value: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface CountEvent {
  id: string
  event_name: string
  branch: string
  count_date: string
  status: 'open' | 'closed' | 'reconciled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StockSession {
  id: string
  session_name: string
  branch: string
  count_date: string
  status: SessionStatus
  entered_by: string | null
  notes: string | null
  event_id: string | null
  created_at: string
  updated_at: string
}

export interface StockCountActual {
  id: string
  session_id: string
  sku: string
  description: string | null
  qty_counted: number
  location: string | null
  size: string | null
  color: string | null
  category: string | null
  entered_by: string | null
  date_of_count: string | null
  notes: string | null
  is_new_item: boolean
  system_qty_at_count: number | null
  created_at: string
  updated_at: string
}

export interface VarianceLine {
  sku: string
  description: string | null
  branch: string | null
  location: string | null
  size: string | null
  color: string | null
  system_qty: number
  counted_qty: number
  variance: number
  variance_pct: number | null
  status: 'matched' | 'short' | 'over' | 'missing' | 'unrecognized'
}

export interface MasterItemCSVRow {
  SKU: string
  'SKU: Description': string
  'QTY Count': string
  'In store location': string
  Branch: string
  'Entered by:': string
  'Date of count': string
  "Andrea's comment": string
  Modified: string
  Created: string
  Size: string
  Color: string
}

export interface ActualCSVRow {
  SKU: string
  'SKU: Description': string
  'QTY Count': string
  'In store location': string
  Branch: string
  'Entered by:': string
  'Date of count': string
  "Andrea's comment": string
  Modified: string
  Created: string
  Size: string
  Color: string
}
