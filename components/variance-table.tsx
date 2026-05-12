'use client'

import { useState, useMemo } from 'react'
import { VarianceLine } from '@/types'
import { exportToCSV } from '@/lib/csv-parsers'
import { cn } from '@/lib/utils'
import { Download, ChevronUp, ChevronDown } from 'lucide-react'

type SortField = keyof VarianceLine
type SortDir = 'asc' | 'desc'

interface Props {
  lines: VarianceLine[]
  sessionName?: string
}

const STATUS_LABELS: Record<VarianceLine['status'], string> = {
  matched: 'Match',
  short: 'Short',
  over: 'Over',
  missing: 'Missing',
  unrecognized: 'Unrecognized',
}

const STATUS_COLORS: Record<VarianceLine['status'], string> = {
  matched: 'text-emerald-400 bg-emerald-400/10',
  short: 'text-red-400 bg-red-400/10',
  over: 'text-orange-400 bg-orange-400/10',
  missing: 'text-red-300 bg-red-300/10',
  unrecognized: 'text-purple-400 bg-purple-400/10',
}

export function VarianceTable({ lines, sessionName }: Props) {
  const [filterStatus, setFilterStatus] = useState<VarianceLine['status'] | 'all'>('all')
  const [filterBranch, setFilterBranch] = useState('')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('variance')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const branches = useMemo(() => {
    const set = new Set<string>()
    lines.forEach((l) => { if (l.branch) set.add(l.branch) })
    return Array.from(set).sort()
  }, [lines])

  const filtered = useMemo(() => {
    let result = lines
    if (filterStatus !== 'all') result = result.filter((l) => l.status === filterStatus)
    if (filterBranch) result = result.filter((l) => l.branch === filterBranch)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.sku.toLowerCase().includes(q) ||
          (l.description ?? '').toLowerCase().includes(q) ||
          (l.location ?? '').toLowerCase().includes(q)
      )
    }
    return [...result].sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [lines, filterStatus, filterBranch, search, sortField, sortDir])

  const summary = useMemo(() => ({
    total: lines.length,
    matched: lines.filter((l) => l.status === 'matched').length,
    short: lines.filter((l) => l.status === 'short').length,
    over: lines.filter((l) => l.status === 'over').length,
    missing: lines.filter((l) => l.status === 'missing').length,
    unrecognized: lines.filter((l) => l.status === 'unrecognized').length,
  }), [lines])

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ChevronUp size={12} className="text-slate-600" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-pink-400" />
      : <ChevronDown size={12} className="text-pink-400" />
  }

  const handleExport = () => {
    const data = filtered.map((l) => ({
      SKU: l.sku,
      Description: l.description ?? '',
      Branch: l.branch ?? '',
      Location: l.location ?? '',
      Size: l.size ?? '',
      Color: l.color ?? '',
      'System Qty': l.system_qty,
      'Counted Qty': l.counted_qty,
      Variance: l.variance,
      'Variance %': l.variance_pct != null ? `${l.variance_pct.toFixed(1)}%` : '',
      Status: STATUS_LABELS[l.status],
    }))
    exportToCSV(data, `variance-${sessionName ?? 'report'}-${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {([
          ['all', `All (${summary.total})`, 'text-slate-300 bg-slate-700'],
          ['matched', `Match (${summary.matched})`, 'text-emerald-400 bg-emerald-400/10'],
          ['short', `Short (${summary.short})`, 'text-red-400 bg-red-400/10'],
          ['over', `Over (${summary.over})`, 'text-orange-400 bg-orange-400/10'],
          ['missing', `Missing (${summary.missing})`, 'text-red-300 bg-red-300/10'],
          ['unrecognized', `Unrec. (${summary.unrecognized})`, 'text-purple-400 bg-purple-400/10'],
        ] as const).map(([val, label, cls]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val as VarianceLine['status'] | 'all')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all border',
              filterStatus === val
                ? `${cls} border-current`
                : 'text-slate-500 bg-transparent border-slate-700 hover:border-slate-500'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search SKU / description…"
          className="flex-1 min-w-[180px] bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-pink-500"
        />
        {branches.length > 1 && (
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-pink-500"
          >
            <option value="">All branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-400 text-xs">
            <tr>
              {([
                ['sku', 'SKU'],
                ['description', 'Description'],
                ['branch', 'Branch'],
                ['location', 'Location'],
                ['size', 'Size'],
                ['system_qty', 'System'],
                ['counted_qty', 'Counted'],
                ['variance', 'Variance'],
                ['variance_pct', 'Var %'],
                ['status', 'Status'],
              ] as [SortField, string][]).map(([field, label]) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-3 py-2.5 text-left cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {label} <SortIcon field={field} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-10 text-slate-500">No items match current filters</td>
              </tr>
            )}
            {filtered.map((line, i) => (
              <tr
                key={`${line.sku}-${i}`}
                className={cn(
                  'border-t border-slate-800 transition-colors',
                  i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900',
                  'hover:bg-slate-800'
                )}
              >
                <td className="px-3 py-2 font-mono text-xs text-slate-300 whitespace-nowrap">{line.sku}</td>
                <td className="px-3 py-2 text-slate-200 max-w-[200px] truncate">{line.description ?? '—'}</td>
                <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{line.branch ?? '—'}</td>
                <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{line.location ?? '—'}</td>
                <td className="px-3 py-2 text-slate-400">{line.size ?? '—'}</td>
                <td className="px-3 py-2 text-right text-slate-300">{line.system_qty}</td>
                <td className="px-3 py-2 text-right text-slate-300">{line.counted_qty}</td>
                <td className={cn(
                  'px-3 py-2 text-right font-bold',
                  line.variance < 0 ? 'text-red-400' : line.variance > 0 ? 'text-green-400' : 'text-slate-400'
                )}>
                  {line.variance > 0 ? `+${line.variance}` : line.variance}
                </td>
                <td className={cn(
                  'px-3 py-2 text-right font-medium',
                  line.variance < 0 ? 'text-red-400' : line.variance > 0 ? 'text-green-400' : 'text-slate-400'
                )}>
                  {line.variance_pct != null
                    ? `${line.variance_pct > 0 ? '+' : ''}${line.variance_pct.toFixed(1)}%`
                    : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[line.status])}>
                    {STATUS_LABELS[line.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 text-right">{filtered.length} of {lines.length} items</p>
    </div>
  )
}
