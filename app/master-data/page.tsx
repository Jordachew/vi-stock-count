'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MasterItem } from '@/types'
import { MasterUpload } from '@/components/master-upload'
import { AddItemModal } from '@/components/add-item-modal'
import { useToast } from '@/components/toast'
import { Plus, Search, RefreshCw, Loader2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDropdowns } from '@/lib/dropdowns'

const BRANCHES = ['Montego Bay', 'Kingston', 'Off site storage']

export default function MasterDataPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<MasterItem | null>(null)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('master_items')
      .select('*')
      .order('sku', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (!showInactive) query = query.eq('is_active', true)
    if (filterBranch) query = query.eq('branch', filterBranch)
    if (search) query = query.or(`sku.ilike.%${search}%,description.ilike.%${search}%`)

    const { data, error } = await query
    setLoading(false)
    if (error) { toast(error.message, 'error'); return }
    setItems((data ?? []) as MasterItem[])
  }, [page, search, filterBranch, showInactive, toast])

  useEffect(() => { load() }, [load])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPage(0)
    load()
  }

  const toggleActive = async (item: MasterItem) => {
    const { error } = await supabase
      .from('master_items')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
    if (error) { toast(error.message, 'error'); return }
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_active: !item.is_active } : i))
    toast(item.is_active ? 'Item deactivated' : 'Item activated', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Master Data</h1>
          <p className="text-sm text-slate-400 mt-0.5">Item catalog — upload from CSV or manage individually</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* CSV Upload */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Upload from CSV (SharePoint format)</h2>
        <MasterUpload onComplete={load} />
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or description…"
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 pl-8 text-white text-sm focus:outline-none focus:border-pink-500"
          />
        </div>
        <select
          value={filterBranch}
          onChange={(e) => { setFilterBranch(e.target.value); setPage(0) }}
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
        >
          <option value="">All branches</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <button
          type="button"
          onClick={() => { setShowInactive(!showInactive); setPage(0) }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded border text-sm transition-colors',
            showInactive
              ? 'border-pink-500 text-pink-400 bg-pink-500/10'
              : 'border-slate-700 text-slate-400 hover:border-slate-500'
          )}
        >
          {showInactive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          Show inactive
        </button>
        <button
          type="submit"
          className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm flex items-center gap-1.5"
        >
          <Search size={14} /> Search
        </button>
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
        >
          <RefreshCw size={14} />
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-10 justify-center">
          <Loader2 size={20} className="animate-spin" /> Loading items…
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-700 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-800 text-slate-400 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-left">Color</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Branch</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-right">Sys Qty</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Qty Date</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-10 text-slate-500">
                      No items found. Upload a CSV or add manually.
                    </td>
                  </tr>
                )}
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-t border-slate-800',
                      i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900',
                      !item.is_active && 'opacity-50'
                    )}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{item.sku}</td>
                    <td className="px-4 py-2.5 text-slate-200 max-w-[220px] truncate">{item.description}</td>
                    <td className="px-4 py-2.5 text-slate-400">{item.size ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{item.color ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{item.category ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{item.branch ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{item.location ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{item.system_qty}</td>
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap text-xs">
                      {item.system_qty_date ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => toggleActive(item)} className="text-slate-400 hover:text-white">
                        {item.is_active
                          ? <ToggleRight size={16} className="text-emerald-400" />
                          : <ToggleLeft size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setEditItem(item)}
                        className="text-slate-500 hover:text-pink-400"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{items.length} items on this page</span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white"
              >
                ← Prev
              </button>
              <span className="px-3 py-1 text-slate-400">Page {page + 1}</span>
              <button
                disabled={items.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onCreated={(item) => {
            setShowAddModal(false)
            setItems((prev) => [item, ...prev])
            toast('Item added', 'success')
          }}
        />
      )}

      {/* Edit modal (reuse AddItemModal with pre-filled data via inline form) */}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))
            setEditItem(null)
          }}
        />
      )}
    </div>
  )
}

// Inline edit modal
function EditItemModal({ item, onClose, onSaved }: {
  item: MasterItem
  onClose: () => void
  onSaved: (item: MasterItem) => void
}) {
  const { toast } = useToast()
  const { sizes, colors, categories } = useDropdowns()
  const [form, setForm] = useState({ ...item })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const { data, error } = await supabase
      .from('master_items')
      .update({
        description: form.description,
        size: form.size || null,
        color: form.color || null,
        category: form.category || null,
        branch: form.branch || null,
        location: form.location || null,
        system_qty: form.system_qty,
        system_qty_date: form.system_qty_date || null,
      })
      .eq('id', item.id)
      .select()
      .single()
    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    toast('Item updated', 'success')
    onSaved(data as MasterItem)
  }

  const LOCATIONS = [
    'Draw 1', 'Draw 2', 'Draw 3', 'Draw 4', 'Draw 5', 'Draw 6', 'Draw 7',
    'Bra Column 1', 'Bra Column 2', 'Bra Column 3', 'Bra Column 4',
    'Bra Column 5', 'Bra Column 6', 'Bra Column 7', 'Bra Column 8', 'Bra Column 9',
    'Storage room shelf 1', 'Storage room shelf 2', 'Rack 1',
  ]

  // Include current value even if not in dropdown list
  const sizeOpts = form.size && !sizes.includes(form.size) ? [...sizes, form.size] : sizes
  const colorOpts = form.color && !colors.includes(form.color) ? [...colors, form.color] : colors
  const catOpts = form.category && !categories.includes(form.category) ? [...categories, form.category] : categories

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-white font-semibold">Edit: {item.sku}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Size</label>
              <select
                value={form.size ?? ''}
                onChange={(e) => setForm({ ...form, size: e.target.value || null })}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              >
                <option value="">—</option>
                {sizeOpts.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Color</label>
              <select
                value={form.color ?? ''}
                onChange={(e) => setForm({ ...form, color: e.target.value || null })}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              >
                <option value="">—</option>
                {colorOpts.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <select
                value={form.category ?? ''}
                onChange={(e) => setForm({ ...form, category: e.target.value || null })}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              >
                <option value="">—</option>
                {catOpts.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Branch</label>
            <select
              value={form.branch ?? ''}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">— Select —</option>
              {['Montego Bay', 'Kingston', 'Off site storage'].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Location</label>
            <select
              value={form.location ?? ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">— Select —</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">System Qty</label>
              <input
                type="number"
                value={form.system_qty}
                onChange={(e) => setForm({ ...form, system_qty: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Qty As-of Date</label>
              <input
                type="date"
                value={form.system_qty_date ?? ''}
                onChange={(e) => setForm({ ...form, system_qty_date: e.target.value || null })}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded bg-slate-700 text-slate-200 text-sm hover:bg-slate-600">Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded bg-pink-600 text-white text-sm hover:bg-pink-500 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
