'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CountEvent, StockSession } from '@/types'
import { useToast } from '@/components/toast'
import { format } from 'date-fns'
import {
  Plus, ArrowRight, Loader2, ClipboardList, Layers,
  ChevronDown, ChevronRight, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const BRANCHES = ['Montego Bay', 'Kingston', 'Off site storage']

const STATUS_COLORS = {
  open: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  reconciled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

// ─── Create Event Modal ────────────────────────────────────────────────────────
function CreateEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (evt: CountEvent) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim() || !branch || !date) { toast('Name, branch and date required', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase
      .from('count_events')
      .insert({ event_name: name.trim(), branch, count_date: date, notes: notes || null, status: 'open' })
      .select()
      .single()
    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    toast('Count event created', 'success')
    onCreated(data as CountEvent)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">New Count Event</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-slate-400 text-xs">A Count Event groups multiple sessions from the same branch and date for combined variance reporting.</p>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Event Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MBJ Full Count May 2026"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Branch *</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500"
          >
            <option value="">— Select branch —</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Count Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500 resize-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Create Event
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Assign Event inline dropdown ─────────────────────────────────────────────
function AssignEventCell({
  session,
  events,
  onAssigned,
}: {
  session: StockSession
  events: CountEvent[]
  onAssigned: (sessionId: string, eventId: string | null) => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const assign = async (eventId: string | null) => {
    setSaving(true)
    const { error } = await supabase
      .from('stock_sessions')
      .update({ event_id: eventId })
      .eq('id', session.id)
    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    onAssigned(session.id, eventId)
  }

  return (
    <div className="flex items-center gap-1.5 min-w-[140px]">
      {saving
        ? <Loader2 size={12} className="animate-spin text-slate-400" />
        : (
          <select
            value={session.event_id ?? ''}
            onChange={(e) => assign(e.target.value || null)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-pink-500 w-full"
          >
            <option value="">— No event —</option>
            {events
              .filter((e) => e.branch === session.branch)
              .map((e) => (
                <option key={e.id} value={e.id}>{e.event_name}</option>
              ))}
          </select>
        )}
    </div>
  )
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function EventsTab({
  events,
  sessions,
  onEventCreated,
}: {
  events: CountEvent[]
  sessions: StockSession[]
  onEventCreated: (e: CountEvent) => void
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Group sessions from the same branch and date for combined variance reporting.</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={14} /> New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-10 text-center">
          <Layers size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No count events yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-pink-400 hover:text-pink-300"
          >
            <Plus size={14} /> Create your first event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const evtSessions = sessions.filter((s) => s.event_id === evt.id)
            const open = expanded.has(evt.id)
            return (
              <div key={evt.id} className="rounded-xl border border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggle(evt.id)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                    <div>
                      <div className="text-white font-medium text-sm">{evt.event_name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {evt.branch} · {format(new Date(evt.count_date + 'T12:00:00'), 'dd MMM yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">{evtSessions.length} session{evtSessions.length !== 1 ? 's' : ''}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS[evt.status])}>
                      {evt.status}
                    </span>
                    <Link
                      href={`/variance?event=${evt.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap"
                    >
                      Variance →
                    </Link>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-slate-700 divide-y divide-slate-800">
                    {evtSessions.length === 0 ? (
                      <p className="px-5 py-4 text-slate-500 text-sm">No sessions assigned to this event yet. Assign from the Sessions tab.</p>
                    ) : (
                      evtSessions.map((s) => (
                        <div key={s.id} className="flex items-center justify-between px-5 py-3">
                          <div>
                            <div className="text-white text-sm">{s.session_name}</div>
                            <div className="text-slate-400 text-xs mt-0.5">
                              {s.entered_by ?? '—'} · {s.count_date}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS[s.status])}>
                              {s.status}
                            </span>
                            <Link
                              href={`/sessions/${s.id}`}
                              className="text-pink-400 hover:text-pink-300 text-xs"
                            >
                              Open →
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={(e) => { onEventCreated(e); setShowCreate(false) }}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SessionsPage() {
  const [sessions, setSessions] = useState<StockSession[]>([])
  const [events, setEvents] = useState<CountEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sessions' | 'events'>('sessions')
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed' | 'reconciled'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: sessData }, { data: evtData }] = await Promise.all([
      supabase
        .from('stock_sessions')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('count_events')
        .select('*')
        .order('count_date', { ascending: false }),
    ])
    setSessions((sessData ?? []) as StockSession[])
    setEvents((evtData ?? []) as CountEvent[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filteredSessions = filterStatus === 'all'
    ? sessions
    : sessions.filter((s) => s.status === filterStatus)

  const handleSessionAssigned = (sessionId: string, eventId: string | null) => {
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, event_id: eventId } : s))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Count Sessions</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage physical inventory count sessions and events</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/sessions/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Session
          </Link>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-800/40 border border-slate-700 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('sessions')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors',
            tab === 'sessions' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
          )}
        >
          <ClipboardList size={14} /> Sessions
        </button>
        <button
          onClick={() => setTab('events')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors',
            tab === 'events' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
          )}
        >
          <Layers size={14} /> Count Events
          {events.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-700 text-xs text-slate-300">{events.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-10 justify-center">
          <Loader2 size={20} className="animate-spin" /> Loading…
        </div>
      ) : tab === 'events' ? (
        <EventsTab
          events={events}
          sessions={sessions}
          onEventCreated={(e) => setEvents((prev) => [e, ...prev])}
        />
      ) : (
        <>
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'open', 'closed', 'reconciled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize',
                  filterStatus === s
                    ? s === 'all'
                      ? 'bg-pink-600 text-white border-pink-600'
                      : `${STATUS_COLORS[s as 'open' | 'closed' | 'reconciled']} border-current`
                    : 'text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {filteredSessions.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-10 text-center">
              <ClipboardList size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No sessions found</p>
              <Link
                href="/sessions/new"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-pink-400 hover:text-pink-300"
              >
                <Plus size={14} /> Create a session
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Session Name</th>
                    <th className="px-4 py-3 text-left">Branch</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Entered By</th>
                    <th className="px-4 py-3 text-left">Count Event</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((s, i) => (
                    <tr
                      key={s.id}
                      className={cn(
                        'border-t border-slate-800 hover:bg-slate-800 transition-colors',
                        i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900'
                      )}
                    >
                      <td className="px-4 py-3 text-white font-medium">{s.session_name}</td>
                      <td className="px-4 py-3 text-slate-300">{s.branch}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {s.count_date ? format(new Date(s.count_date + 'T12:00:00'), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS[s.status])}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{s.entered_by ?? '—'}</td>
                      <td className="px-4 py-3">
                        <AssignEventCell
                          session={s}
                          events={events}
                          onAssigned={handleSessionAssigned}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/sessions/${s.id}`}
                            className="flex items-center gap-1 text-pink-400 hover:text-pink-300 text-xs whitespace-nowrap"
                          >
                            Enter <ArrowRight size={12} />
                          </Link>
                          <Link
                            href={`/sessions/${s.id}/variance`}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap"
                          >
                            Variance
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
