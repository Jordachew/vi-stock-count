'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { StockSession } from '@/types'
import { format } from 'date-fns'
import { Plus, ArrowRight, Loader2, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_COLORS = {
  open: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  reconciled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StockSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed' | 'reconciled'>('all')

  useEffect(() => {
    async function load() {
      let query = supabase
        .from('stock_sessions')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') query = query.eq('status', filterStatus)

      const { data } = await query
      setSessions((data ?? []) as StockSession[])
      setLoading(false)
    }
    load()
  }, [filterStatus])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Count Sessions</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage and track physical inventory count sessions</p>
        </div>
        <Link
          href="/sessions/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Session
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
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

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-10 justify-center">
          <Loader2 size={20} className="animate-spin" /> Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
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
                <th className="px-4 py-3 text-left">Count Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Entered By</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr
                  key={s.id}
                  className={cn('border-t border-slate-800', i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900', 'hover:bg-slate-800 transition-colors')}
                >
                  <td className="px-4 py-3 text-white font-medium">{s.session_name}</td>
                  <td className="px-4 py-3 text-slate-300">{s.branch}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {s.count_date ? format(new Date(s.count_date + 'T12:00:00'), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{s.entered_by ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate">{s.notes ?? '—'}</td>
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
    </div>
  )
}
