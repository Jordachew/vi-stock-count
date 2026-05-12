'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MasterItem, StockSession, StockCountActual, VarianceLine } from '@/types'
import { buildVarianceLines } from '@/lib/variance'
import { VarianceTable } from '@/components/variance-table'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'

export default function SessionVariancePage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<StockSession | null>(null)
  const [lines, setLines] = useState<VarianceLine[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: sessionData }, { data: actualsData }, { data: masterData }] = await Promise.all([
      supabase.from('stock_sessions').select('*').eq('id', id).single(),
      supabase.from('stock_count_actuals').select('*').eq('session_id', id),
      supabase.from('master_items').select('*').eq('is_active', true),
    ])

    setSession(sessionData as StockSession)

    // Filter master to this session's branch if branch set
    const sessionBranch = (sessionData as StockSession)?.branch
    let master = (masterData ?? []) as MasterItem[]
    if (sessionBranch) {
      master = master.filter((m) => !m.branch || m.branch === sessionBranch)
    }

    const variance = buildVarianceLines(master, (actualsData ?? []) as StockCountActual[])
    setLines(variance)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-20 justify-center">
        <Loader2 size={20} className="animate-spin" /> Computing variance…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/sessions/${id}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-3">
          <ArrowLeft size={14} /> Back to session
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              Variance Report
              {session && <span className="text-slate-400 font-normal ml-2">— {session.session_name}</span>}
            </h1>
            {session && (
              <p className="text-sm text-slate-400 mt-0.5">
                {session.branch} · {session.count_date}
              </p>
            )}
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <VarianceTable lines={lines} sessionName={session?.session_name} />
    </div>
  )
}
