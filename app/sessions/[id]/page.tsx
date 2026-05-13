/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { StockCountActual, StockSession } from '@/types'
import { CountEntry } from '@/components/count-entry'
import { ActualsUpload } from '@/components/actuals-upload'
import { useToast } from '@/components/toast'
import { useDropdowns } from '@/lib/dropdowns'
import { format } from 'date-fns'
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  Trash2,
  Lock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Pencil,
  X,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_COLORS = {
  open: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  reconciled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

// ─── Edit Actual Modal ────────────────────────────────────────────────────────
function EditActualModal({
  actual,
  sessionEnteredBy,
  onClose,
  onSaved,
}: {
  actual: StockCountActual
  sessionEnteredBy: string | null
  onClose: () => void
  onSaved: (updated: StockCountActual) => void
}) {
  const { toast } = useToast()
  const { sizes, colors, categories, locations } = useDropdowns()
  const [saving, setSaving] = useState(false)

  const [qty, setQty] = useState(String(actual.qty_counted))
  const [location, setLocation] = useState(actual.location ?? '')
  const [size, setSize] = useState(actual.size ?? '')
  const [color, setColor] = useState(actual.color ?? '')
  const [category, setCategory] = useState(actual.category ?? '')
  const [notes, setNotes] = useState(actual.notes ?? '')

  // Include current values even if not in dropdown list
  const sizeOpts = size && !sizes.includes(size) ? [...sizes, size] : sizes
  const colorOpts = color && !colors.includes(color) ? [...colors, color] : colors
  const catOpts = category && !categories.includes(category) ? [...categories, category] : categories
  const locOpts = location && !locations.includes(location) ? [...locations, location] : locations

  const save = async () => {
    const qtyNum = parseInt(qty)
    if (isNaN(qtyNum) || qtyNum < 1) { toast('Qty must be at least 1', 'error'); return }
    setSaving(true)

    const updates = {
      qty_counted: qtyNum,
      location: location || null,
      size: size || null,
      color: color || null,
      category: category || null,
      notes: notes || null,
    }

    const { error } = await supabase
      .from('stock_count_actuals')
      .update(updates)
      .eq('id', actual.id)

    if (error) { toast(error.message, 'error'); setSaving(false); return }

    // Build audit log entries for changed fields
    const fields: Array<[string, string | null, string | null]> = [
      ['qty_counted', String(actual.qty_counted), String(qtyNum)],
      ['location', actual.location ?? null, location || null],
      ['size', actual.size ?? null, size || null],
      ['color', actual.color ?? null, color || null],
      ['category', actual.category ?? null, category || null],
      ['notes', actual.notes ?? null, notes || null],
    ]
    const auditRows = fields
      .filter(([, oldVal, newVal]) => oldVal !== newVal)
      .map(([field, old_value, new_value]) => ({
        session_id: actual.session_id,
        actual_id: actual.id,
        sku: actual.sku,
        changed_by: sessionEnteredBy,
        field_name: field,
        old_value,
        new_value,
      }))

    if (auditRows.length > 0) {
      await supabase.from('count_actuals_audit_log').insert(auditRows)
    }

    setSaving(false)
    onSaved({ ...actual, ...updates })
    toast('Entry updated', 'success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-sm">Edit Count Entry</h2>
            <p className="text-pink-300 font-mono text-xs mt-0.5">{actual.sku}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>

        {actual.description && (
          <p className="text-slate-400 text-xs bg-slate-900/50 rounded px-3 py-2">{actual.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Qty Counted *</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">—</option>
              {locOpts.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">—</option>
              {sizeOpts.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Color</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">—</option>
              {colorOpts.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">—</option>
              {catOpts.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            placeholder="Optional note"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [session, setSession] = useState<StockSession | null>(null)
  const [actuals, setActuals] = useState<StockCountActual[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [closingSession, setClosingSession] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingActual, setEditingActual] = useState<StockCountActual | null>(null)

  const load = useCallback(async () => {
    const [{ data: sessionData }, { data: actualsData }] = await Promise.all([
      supabase.from('stock_sessions').select('*').eq('id', id).single(),
      supabase
        .from('stock_count_actuals')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: false }),
    ])
    setSession(sessionData as StockSession)
    setActuals((actualsData ?? []) as StockCountActual[])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const handleActualAdded = (actual: StockCountActual) => {
    setActuals((prev) => [actual, ...prev])
  }

  const handleActualSaved = (updated: StockCountActual) => {
    setActuals((prev) => prev.map((a) => a.id === updated.id ? updated : a))
    setEditingActual(null)
  }

  const deleteActual = async (actualId: string) => {
    if (!confirm('Remove this count entry? This cannot be undone.')) return
    setDeletingId(actualId)
    const { error } = await supabase.from('stock_count_actuals').delete().eq('id', actualId)
    setDeletingId(null)
    if (error) { toast(error.message, 'error'); return }
    setActuals((prev) => prev.filter((a) => a.id !== actualId))
    toast('Entry removed', 'success')
  }

  const logSessionStatus = async (oldStatus: string, newStatus: string) => {
    await supabase.from('session_audit_log').insert({
      session_id: id,
      session_name: session?.session_name,
      changed_by: session?.entered_by ?? null,
      old_status: oldStatus,
      new_status: newStatus,
    })
  }

  const closeSession = async (newStatus: 'closed' | 'reconciled') => {
    if (newStatus === 'reconciled') {
      const ok = confirm(
        `Mark session "${session?.session_name}" as Reconciled?\n\n` +
        `This will lock the session permanently. Count entries cannot be added, edited, or deleted after reconciliation.\n\n` +
        `Proceed?`
      )
      if (!ok) return
    }
    setClosingSession(true)
    const oldStatus = session?.status ?? 'open'
    const { error } = await supabase
      .from('stock_sessions')
      .update({ status: newStatus })
      .eq('id', id)
    setClosingSession(false)
    if (error) { toast(error.message, 'error'); return }
    await logSessionStatus(oldStatus, newStatus)
    setSession((prev) => prev ? { ...prev, status: newStatus } : prev)
    toast(`Session ${newStatus}`, 'success')
  }

  const reopenSession = async () => {
    if (!confirm(`Reopen session "${session?.session_name}"? Entries will be editable again.`)) return
    const oldStatus = session?.status ?? 'closed'
    const { error } = await supabase
      .from('stock_sessions')
      .update({ status: 'open' })
      .eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    await logSessionStatus(oldStatus, 'open')
    setSession((prev) => prev ? { ...prev, status: 'open' } : prev)
    toast('Session reopened', 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-20 justify-center">
        <Loader2 size={20} className="animate-spin" /> Loading session…
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Session not found</p>
        <Link href="/sessions" className="text-pink-400 text-sm mt-2 block">← Back to sessions</Link>
      </div>
    )
  }

  const isOpen = session.status === 'open'

  const skuCounts = actuals.reduce<Record<string, number>>((acc, a) => {
    acc[a.sku] = (acc[a.sku] ?? 0) + a.qty_counted
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/sessions" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-3">
          <ArrowLeft size={14} /> Back to sessions
        </Link>

        <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-white">{session.session_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-400">
                <span>{session.branch}</span>
                <span>·</span>
                <span>{format(new Date(session.count_date + 'T12:00:00'), 'dd MMM yyyy')}</span>
                {session.entered_by && (
                  <>
                    <span>·</span>
                    <span>By: {session.entered_by}</span>
                  </>
                )}
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS[session.status])}>
                  {session.status}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/sessions/${id}/variance`}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
              >
                <BarChart3 size={14} /> Variance Report
              </Link>
              {isOpen ? (
                <>
                  <button
                    onClick={() => closeSession('closed')}
                    disabled={closingSession}
                    className="flex items-center gap-1.5 px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors disabled:opacity-60"
                  >
                    <Lock size={14} /> Close Session
                  </button>
                  <button
                    onClick={() => closeSession('reconciled')}
                    disabled={closingSession}
                    className="flex items-center gap-1.5 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-colors disabled:opacity-60"
                  >
                    <CheckCircle size={14} /> Mark Reconciled
                  </button>
                </>
              ) : (
                <button
                  onClick={reopenSession}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm transition-colors"
                >
                  Reopen
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-4 text-sm">
            <div className="text-slate-400">
              <span className="text-white font-semibold">{actuals.length}</span> entries
            </div>
            <div className="text-slate-400">
              <span className="text-white font-semibold">{Object.keys(skuCounts).length}</span> unique SKUs
            </div>
            <div className="text-slate-400">
              <span className="text-white font-semibold">
                {actuals.reduce((s, a) => s + a.qty_counted, 0)}
              </span> total units
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Entry form */}
        <div>
          {!isOpen && (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-3 text-sm mb-4">
              <AlertTriangle size={16} />
              Session is {session.status} — reopen to add or edit entries
            </div>
          )}

          {isOpen && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-5">
              <h2 className="text-sm font-semibold text-slate-300">Manual Entry</h2>
              <CountEntry
                sessionId={id}
                enteredBy={session.entered_by}
                onAdded={handleActualAdded}
              />
            </div>
          )}

          {/* CSV bulk upload */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 mt-4">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center justify-between w-full text-sm font-semibold text-slate-300"
            >
              Bulk CSV Import
              {showUpload ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showUpload && (
              <div className="mt-3">
                <ActualsUpload sessionId={id} onComplete={load} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Running count list */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Count Entries ({actuals.length})
            {isOpen && <span className="text-slate-500 font-normal ml-2">· click row to edit</span>}
          </h2>
          <div className="rounded-xl border border-slate-700 overflow-hidden max-h-[600px] overflow-y-auto">
            {actuals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No entries yet — start scanning</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-slate-400 text-xs sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5 text-left">SKU</th>
                    <th className="px-3 py-2.5 text-left">Description</th>
                    <th className="px-3 py-2.5 text-left">Location</th>
                    <th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {actuals.map((a, i) => (
                    <tr
                      key={a.id}
                      onClick={() => isOpen && setEditingActual(a)}
                      className={cn(
                        'border-t border-slate-800',
                        i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900',
                        a.is_new_item && 'border-l-2 border-l-amber-400',
                        isOpen && 'cursor-pointer hover:bg-slate-700/60 transition-colors'
                      )}
                    >
                      <td className="px-3 py-2 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {a.sku}
                        {a.is_new_item && (
                          <span className="ml-1.5 text-amber-400 text-[10px] font-medium">NEW</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-400 max-w-[140px] truncate text-xs">
                        {a.description ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-xs">{a.location ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-white font-semibold">{a.qty_counted}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 justify-end">
                          {isOpen && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingActual(a) }}
                                className="text-slate-600 hover:text-blue-400 transition-colors"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteActual(a.id) }}
                                disabled={deletingId === a.id}
                                className="text-slate-600 hover:text-red-400 transition-colors"
                              >
                                {deletingId === a.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Trash2 size={12} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editingActual && (
        <EditActualModal
          actual={editingActual}
          sessionEnteredBy={session.entered_by}
          onClose={() => setEditingActual(null)}
          onSaved={handleActualSaved}
        />
      )}
    </div>
  )
}
