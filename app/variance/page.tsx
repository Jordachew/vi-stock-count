'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MasterItem, StockSession, StockCountActual, VarianceLine } from '@/types'
import { buildVarianceLines } from '@/lib/variance'
import { VarianceTable } from '@/components/variance-table'
import { Loader2, RefreshCw } from 'lucide-react'

const BRANCHES = ['Montego Bay', 'Kingston', 'Off site storage']

export default function GlobalVariancePage() {
  const [sessions, setSessions] = useState<StockSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('all')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [lines, setLines] = useState<VarianceLine[]>([])
  const [loading, setLoading] = useState(true)

  // Load session list once
  useEffect(() => {
    supabase
      .from('stock_sessions')
      .select('id, session_name, branch, status, count_date')
      .order('created_at', { ascending: false })
      .then(({ data }) => setSessions((data ?? []) as StockSession[]))
  }, [])

  const compute = useCallback(async () => {
    setLoading(true)

    // Fetch master items (branch-filtered if needed)
    let masterQuery = supabase.from('master_items').select('*').eq('is_active', true)
    if (selectedBranch) masterQuery = masterQuery.eq('branch', selectedBranch)
    const { data: masterData } = await masterQuery

    // Fetch actuals — filter by session or all sessions
    let actualsQuery = supabase.from('stock_count_actuals').select('*')
    if (selectedSession !== 'all') {
      actualsQuery = actualsQuery.eq('session_id', selectedSession)
    } else if (selectedBranch) {
      // Get all session ids for that branch
      const { data: branchSessions } = await supabase
        .from('stock_sessions')
        .select('id')
        .eq('branch', selectedBranch)
      const ids = (branchSessions ?? []).map((s: { id: string }) => s.id)
      if (ids.length > 0) {
        actualsQuery = actualsQuery.in('session_id', ids)
      }
    }

    const { data: actualsData } = await actualsQuery

    const variance = buildVarianceLines(
      (masterData ?? []) as MasterItem[],
      (actualsData ?? []) as StockCountActual[]
    )
    setLines(variance)
    setLoading(false)
  }, [selectedSession, selectedBranch])

  useEffect(() => { compute() }, [compute])

  const selectedSessionObj = sessions.find((s) => s.id === selectedSession)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Global Variance Report</h1>
          <p className="text-sm text-slate-400 mt-0.5">Cross-session inventory variance analysis</p>
        </div>
        <button
          onClick={compute}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500 min-w-[200px]"
          >
            <option value="all">All sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_name} ({s.branch}) — {s.status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
          >
            <option value="">All branches</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {selectedSessionObj && (
          <div className="flex items-end pb-0.5">
            <div className="text-xs text-slate-400 bg-slate-700 rounded px-3 py-2">
              Branch: <span className="text-white">{selectedSessionObj.branch}</span>
              <span className="mx-2">·</span>
              Date: <span className="text-white">{selectedSessionObj.count_date}</span>
              <span className="mx-2">·</span>
              Status: <span className="text-white">{selectedSessionObj.status}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-10 justify-center">
          <Loader2 size={20} className="animate-spin" /> Computing variance…
        </div>
      ) : (
        <VarianceTable
          lines={lines}
          sessionName={selectedSessionObj?.session_name ?? 'global'}
        />
      )}
    </div>
  )
}
