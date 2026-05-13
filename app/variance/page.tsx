'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CountEvent, MasterItem, StockSession, StockCountActual, VarianceLine } from '@/types'
import { buildVarianceLines } from '@/lib/variance'
import { VarianceTable } from '@/components/variance-table'
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const BRANCHES = ['Montego Bay', 'Kingston', 'Off site storage']

const STATUS_COLORS = {
  open: 'text-emerald-400',
  closed: 'text-slate-400',
  reconciled: 'text-blue-400',
}

export default function GlobalVariancePage() {
  const [sessions, setSessions] = useState<StockSession[]>([])
  const [events, setEvents] = useState<CountEvent[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [lines, setLines] = useState<VarianceLine[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [showSessionPicker, setShowSessionPicker] = useState(true)

  // Load sessions + events on mount
  useEffect(() => {
    async function load() {
      const [{ data: sessData }, { data: evtData }] = await Promise.all([
        supabase
          .from('stock_sessions')
          .select('id, session_name, branch, status, count_date, event_id')
          .order('count_date', { ascending: false }),
        supabase
          .from('count_events')
          .select('*')
          .order('count_date', { ascending: false }),
      ])
      setSessions((sessData ?? []) as StockSession[])
      setEvents((evtData ?? []) as CountEvent[])
      setLoadingMeta(false)
    }
    load()
  }, [])

  // When event selected → auto-check all sessions in that event
  useEffect(() => {
    if (!selectedEvent) return
    const eventSessionIds = sessions
      .filter((s) => s.event_id === selectedEvent)
      .map((s) => s.id)
    setSelectedIds(new Set(eventSessionIds))
  }, [selectedEvent, sessions])

  // When branch filter changes → clear event selection
  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch)
    setSelectedEvent('')
    setSelectedIds(new Set())
  }

  const filteredSessions = selectedBranch
    ? sessions.filter((s) => s.branch === selectedBranch)
    : sessions

  const toggleSession = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    // If manually toggling, clear event selection
    setSelectedEvent('')
  }

  const selectAll = () => setSelectedIds(new Set(filteredSessions.map((s) => s.id)))
  const clearAll = () => { setSelectedIds(new Set()); setSelectedEvent('') }

  const compute = useCallback(async () => {
    if (selectedIds.size === 0) return
    setLoading(true)

    const ids = Array.from(selectedIds)

    // Fetch master items (branch-filtered if set)
    let masterQuery = supabase.from('master_items').select('*').eq('is_active', true)
    if (selectedBranch) masterQuery = masterQuery.or(`branch.eq.${selectedBranch},branch.is.null`)
    const { data: masterData } = await masterQuery

    // Fetch actuals for all selected sessions
    const { data: actualsData } = await supabase
      .from('stock_count_actuals')
      .select('*')
      .in('session_id', ids)

    const variance = buildVarianceLines(
      (masterData ?? []) as MasterItem[],
      (actualsData ?? []) as StockCountActual[]
    )
    setLines(variance)
    setLoading(false)
  }, [selectedIds, selectedBranch])

  const selectedEvent_ = events.find((e) => e.id === selectedEvent)

  const reportLabel = selectedEvent_
    ? selectedEvent_.event_name
    : selectedIds.size === 1
    ? sessions.find((s) => s.id === Array.from(selectedIds)[0])?.session_name ?? 'report'
    : `${selectedIds.size}-sessions`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Variance Report</h1>
          <p className="text-sm text-slate-400 mt-0.5">Select sessions to include — combine across reps and locations</p>
        </div>
      </div>

      {/* Session picker panel */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowSessionPicker(!showSessionPicker)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Layers size={15} className="text-pink-400" />
            <span className="text-white text-sm font-semibold">Session Selection</span>
            {selectedIds.size > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-pink-600/20 text-pink-300 text-xs border border-pink-500/30">
                {selectedIds.size} selected
              </span>
            )}
          </div>
          {showSessionPicker ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </button>

        {showSessionPicker && (
          <div className="border-t border-slate-700 p-5 space-y-4">
            {/* Filters row */}
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                >
                  <option value="">All branches</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {events.length > 0 && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Count Event (auto-selects sessions)</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500 min-w-[220px]"
                  >
                    <option value="">— Pick an event —</option>
                    {events
                      .filter((e) => !selectedBranch || e.branch === selectedBranch)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.event_name} · {format(new Date(e.count_date + 'T12:00:00'), 'dd MMM yyyy')}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-end gap-2">
                <button onClick={selectAll} className="text-xs text-pink-400 hover:text-pink-300 px-2 py-2">Select all</button>
                <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-300 px-2 py-2">Clear</button>
              </div>
            </div>

            {/* Session checkboxes */}
            {loadingMeta ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 size={14} className="animate-spin" /> Loading sessions…
              </div>
            ) : filteredSessions.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No sessions found</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredSessions.map((s) => {
                  const checked = selectedIds.has(s.id)
                  const evt = events.find((e) => e.id === s.event_id)
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        'flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors',
                        checked
                          ? 'bg-pink-600/10 border-pink-500/40'
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSession(s.id)}
                        className="mt-0.5 accent-pink-500"
                      />
                      <div className="min-w-0">
                        <div className="text-white text-xs font-medium truncate">{s.session_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-slate-400 text-[10px]">{s.branch}</span>
                          <span className="text-slate-600 text-[10px]">·</span>
                          <span className={cn('text-[10px] font-medium', STATUS_COLORS[s.status])}>{s.status}</span>
                          {evt && (
                            <>
                              <span className="text-slate-600 text-[10px]">·</span>
                              <span className="text-blue-400 text-[10px] truncate">{evt.event_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            {/* Run button */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={compute}
                disabled={selectedIds.size === 0 || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {loading ? 'Computing…' : `Run Variance (${selectedIds.size} session${selectedIds.size !== 1 ? 's' : ''})`}
              </button>
              {lines.length > 0 && (
                <span className="text-slate-400 text-xs">{lines.length} SKUs in report</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-10 justify-center">
          <Loader2 size={20} className="animate-spin" /> Computing variance…
        </div>
      ) : lines.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">
              {selectedEvent_ ? (
                <>Event: <span className="text-white">{selectedEvent_.event_name}</span></>
              ) : (
                <><span className="text-white">{selectedIds.size}</span> session{selectedIds.size !== 1 ? 's' : ''} combined</>
              )}
            </h2>
          </div>
          <VarianceTable lines={lines} sessionName={reportLabel} />
        </>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-800/20 p-12 text-center text-slate-500 text-sm">
          Select sessions above and click Run Variance
        </div>
      )}
    </div>
  )
}
