'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { StockSession } from '@/types'
import { format } from 'date-fns'
import {
  Package,
  ClipboardList,
  AlertTriangle,
  MapPin,
  Plus,
  Upload,
  ArrowRight,
  Loader2,
} from 'lucide-react'

interface DashboardStats {
  masterCount: number
  activeSessions: number
  branches: number
  itemsWithVariance: number | null
}

const STATUS_COLORS = {
  open: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  reconciled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sessions, setSessions] = useState<StockSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ count: masterCount }, { count: activeSessions }, { data: sessionData }] =
        await Promise.all([
          supabase.from('master_items').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('stock_sessions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('stock_sessions').select('*').order('created_at', { ascending: false }).limit(5),
        ])

      // Get distinct branches
      const { data: branchData } = await supabase
        .from('master_items')
        .select('branch')
        .eq('is_active', true)
      const branches = new Set((branchData ?? []).map((r: { branch: string | null }) => r.branch).filter(Boolean)).size

      setStats({
        masterCount: masterCount ?? 0,
        activeSessions: activeSessions ?? 0,
        branches,
        itemsWithVariance: null,
      })
      setSessions((sessionData ?? []) as StockSession[])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    {
      label: 'Master Items',
      value: stats?.masterCount ?? '—',
      icon: Package,
      color: 'text-pink-400',
      bg: 'bg-pink-400/10',
    },
    {
      label: 'Open Sessions',
      value: stats?.activeSessions ?? '—',
      icon: ClipboardList,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Branches',
      value: stats?.branches ?? '—',
      icon: MapPin,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Variance Items',
      value: stats?.itemsWithVariance ?? '—',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Victoria&apos;s Intimates
          <span className="text-pink-400 ml-2">Stock Count</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Physical inventory management — Montego Bay · Kingston · Off site</p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/sessions/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Count Session
        </Link>
        <Link
          href="/master-data"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
        >
          <Upload size={16} /> Upload Master Data
        </Link>
        <Link
          href="/variance"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
        >
          <AlertTriangle size={16} /> Variance Report
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-8">
          <Loader2 size={20} className="animate-spin" />
          Loading dashboard…
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
            >
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Recent Sessions</h2>
          <Link href="/sessions" className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-8 text-center">
            <ClipboardList size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No sessions yet</p>
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-pink-400 hover:text-pink-300"
            >
              <Plus size={14} /> Create your first session
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-400 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Session</th>
                  <th className="px-4 py-3 text-left">Branch</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">By</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} className={`border-t border-slate-800 ${i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900'}`}>
                    <td className="px-4 py-3 text-white font-medium">{s.session_name}</td>
                    <td className="px-4 py-3 text-slate-300">{s.branch}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {s.count_date ? format(new Date(s.count_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{s.entered_by ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="flex items-center gap-1 text-pink-400 hover:text-pink-300 text-xs"
                      >
                        Open <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
