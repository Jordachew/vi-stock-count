'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { DropdownOption } from '@/types'
import { Plus, Trash2, Loader2, GripVertical, ClipboardList } from 'lucide-react'
import { useToast } from '@/components/toast'
import { cn } from '@/lib/utils'

type DropType = 'size' | 'color' | 'category'
type AdminTab = 'dropdowns' | 'audit'

interface AuditEntry {
  id: string
  sku: string
  changed_by: string | null
  changed_at: string
  source: string
  field_name: string
  old_value: string | null
  new_value: string | null
}

const TYPE_LABELS: Record<DropType, string> = {
  size: 'Sizes',
  color: 'Colors',
  category: 'Categories',
}

export default function AdminPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<AdminTab>('dropdowns')
  const [activeType, setActiveType] = useState<DropType>('category')
  const [options, setOptions] = useState<DropdownOption[]>([])
  const [loading, setLoading] = useState(true)
  const [newValue, setNewValue] = useState('')
  const [adding, setAdding] = useState(false)

  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditSource, setAuditSource] = useState('')

  const loadAudit = useCallback(async () => {
    setAuditLoading(true)
    let q = supabase
      .from('master_item_audit_log')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(200)
    if (auditSearch) q = q.ilike('sku', `%${auditSearch}%`)
    if (auditSource) q = q.eq('source', auditSource)
    const { data } = await q
    setAuditLog((data ?? []) as AuditEntry[])
    setAuditLoading(false)
  }, [auditSearch, auditSource])

  useEffect(() => { if (tab === 'audit') loadAudit() }, [tab, loadAudit])

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('type', activeType)
      .order('sort_order')
    setOptions((data ?? []) as DropdownOption[])
    setLoading(false)
  }, [activeType])

  useEffect(() => { load() }, [load])

  const addOption = async () => {
    const val = newValue.trim()
    if (!val) return
    setAdding(true)
    const maxOrder = options.length > 0 ? Math.max(...options.map((o) => o.sort_order)) + 1 : 1
    const { data, error } = await supabase
      .from('dropdown_options')
      .insert({ type: activeType, value: val, sort_order: maxOrder, is_active: true })
      .select()
      .single()
    setAdding(false)
    if (error) { toast(error.message, 'error'); return }
    setOptions((prev) => [...prev, data as DropdownOption])
    setNewValue('')
    toast(`"${val}" added to ${TYPE_LABELS[activeType]}`, 'success')
  }

  const toggleActive = async (opt: DropdownOption) => {
    const { error } = await supabase
      .from('dropdown_options')
      .update({ is_active: !opt.is_active })
      .eq('id', opt.id)
    if (error) { toast(error.message, 'error'); return }
    setOptions((prev) => prev.map((o) => o.id === opt.id ? { ...o, is_active: !opt.is_active } : o))
  }

  const deleteOption = async (opt: DropdownOption) => {
    if (!confirm(`Delete "${opt.value}"? This won't affect existing items.`)) return
    const { error } = await supabase.from('dropdown_options').delete().eq('id', opt.id)
    if (error) { toast(error.message, 'error'); return }
    setOptions((prev) => prev.filter((o) => o.id !== opt.id))
    toast(`"${opt.value}" deleted`, 'success')
  }

  const moveUp = async (opt: DropdownOption, idx: number) => {
    if (idx === 0) return
    const prev = options[idx - 1]
    await Promise.all([
      supabase.from('dropdown_options').update({ sort_order: prev.sort_order }).eq('id', opt.id),
      supabase.from('dropdown_options').update({ sort_order: opt.sort_order }).eq('id', prev.id),
    ])
    load()
  }

  const moveDown = async (opt: DropdownOption, idx: number) => {
    if (idx === options.length - 1) return
    const next = options[idx + 1]
    await Promise.all([
      supabase.from('dropdown_options').update({ sort_order: next.sort_order }).eq('id', opt.id),
      supabase.from('dropdown_options').update({ sort_order: opt.sort_order }).eq('id', next.id),
    ])
    load()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white">Admin</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage dropdown options and view audit trail</p>
      </div>

      {/* Top-level tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-0">
        <button
          onClick={() => setTab('dropdowns')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            tab === 'dropdowns' ? 'border-pink-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
          )}
        >
          Dropdowns
        </button>
        <button
          onClick={() => setTab('audit')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            tab === 'audit' ? 'border-pink-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
          )}
        >
          <ClipboardList size={13} /> Audit Log
        </button>
      </div>

      {/* ── AUDIT LOG TAB ── */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <input
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAudit()}
              placeholder="Filter by SKU…"
              className="flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            />
            <select
              value={auditSource}
              onChange={(e) => setAuditSource(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">All sources</option>
              <option value="count_entry">Count Entry</option>
              <option value="master_data_edit">Master Data Edit</option>
              <option value="csv_upload">CSV Upload</option>
            </select>
            <button
              onClick={loadAudit}
              className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
            >
              {auditLoading ? <Loader2 size={14} className="animate-spin" /> : 'Refresh'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-700 overflow-hidden overflow-x-auto">
            {auditLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : auditLog.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No audit entries yet.</div>
            ) : (
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left whitespace-nowrap">When</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Field</th>
                    <th className="px-4 py-3 text-left">Old</th>
                    <th className="px-4 py-3 text-left">New</th>
                    <th className="px-4 py-3 text-left">By</th>
                    <th className="px-4 py-3 text-left">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry, i) => (
                    <tr key={entry.id} className={cn('border-t border-slate-800', i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900')}>
                      <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(entry.changed_at).toLocaleString('en-JM', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-pink-300">{entry.sku}</td>
                      <td className="px-4 py-2.5 text-slate-300">{entry.field_name}</td>
                      <td className="px-4 py-2.5 text-red-300 text-xs">{entry.old_value ?? <span className="text-slate-600">—</span>}</td>
                      <td className="px-4 py-2.5 text-emerald-300 text-xs">{entry.new_value ?? <span className="text-slate-600">—</span>}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{entry.changed_by ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-xs',
                          entry.source === 'count_entry' ? 'bg-blue-500/20 text-blue-300' :
                          entry.source === 'master_data_edit' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-slate-700 text-slate-400'
                        )}>
                          {entry.source.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-xs text-slate-500">Showing last 200 entries. Old → New values. Red = before, Green = after.</p>
        </div>
      )}

      {/* ── DROPDOWNS TAB ── */}
      {tab === 'dropdowns' && <>
      {/* Type tabs */}
      <div className="flex gap-2">
        {(Object.keys(TYPE_LABELS) as DropType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeType === t
                ? 'bg-pink-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
          placeholder={`Add new ${TYPE_LABELS[activeType].toLowerCase().slice(0, -1)}…`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
        />
        <button
          onClick={addOption}
          disabled={adding || !newValue.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500 text-white text-sm disabled:opacity-50"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </button>
      </div>

      {/* Options list */}
      <div className="rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : options.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No {TYPE_LABELS[activeType].toLowerCase()} yet. Add one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400 text-xs">
              <tr>
                <th className="px-4 py-3 text-left w-8"></th>
                <th className="px-4 py-3 text-left">Value</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-center">Order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {options.map((opt, idx) => (
                <tr
                  key={opt.id}
                  className={cn(
                    'border-t border-slate-800',
                    idx % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900',
                    !opt.is_active && 'opacity-40'
                  )}
                >
                  <td className="px-3 py-2.5 text-slate-600">
                    <GripVertical size={14} />
                  </td>
                  <td className="px-4 py-2.5 text-white font-medium">{opt.value}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => toggleActive(opt)}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        opt.is_active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      )}
                    >
                      {opt.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => moveUp(opt, idx)}
                        disabled={idx === 0}
                        className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(opt, idx)}
                        disabled={idx === options.length - 1}
                        className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => deleteOption(opt)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Hidden options won&apos;t appear in dropdowns but won&apos;t affect existing items. Deleting is permanent.
      </p>
      </>}
    </div>
  )
}
