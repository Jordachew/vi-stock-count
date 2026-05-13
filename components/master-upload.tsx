'use client'

import { useState, useRef } from 'react'
import { parseMasterCSV, MasterCSVResult } from '@/lib/csv-parsers'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from './toast'

interface Props {
  onComplete?: () => void
}

async function parseXLS(file: File): Promise<MasterCSVResult> {
  // Dynamic import keeps xlsx out of the initial bundle
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  // header:1 gives array-of-arrays; header:0 gives array-of-objects keyed by row-1 headers
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
  // Convert to CSV string then re-parse with parseMasterCSV for shared logic
  const { default: Papa } = await import('papaparse')
  const csv = Papa.unparse(rows)
  const csvFile = new File([csv], file.name.replace(/\.xlsx?$/i, '.csv'), { type: 'text/csv' })
  return parseMasterCSV(csvFile)
}

export function MasterUpload({ onComplete }: Props) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase()
    const isXLS = name.endsWith('.xls') || name.endsWith('.xlsx')
    const isCSV = name.endsWith('.csv')

    if (!isCSV && !isXLS) {
      toast('Please upload a CSV or XLS/XLSX file', 'error')
      return
    }

    setLoading(true)
    setResult(null)

    const { items, errors } = isXLS ? await parseXLS(file) : await parseMasterCSV(file)

    if (items.length === 0) {
      setLoading(false)
      setResult({ inserted: 0, errors: errors.length ? errors : ['No items found in file'] })
      return
    }

    // Upsert by SKU
    const { data, error } = await supabase
      .from('master_items')
      .upsert(
        items.map((item) => ({ ...item, is_active: true })),
        { onConflict: 'sku' }
      )
      .select()

    setLoading(false)

    if (error) {
      setResult({ inserted: 0, errors: [error.message, ...errors] })
      toast('Upload failed', 'error')
      return
    }

    const inserted = data?.length ?? items.length
    setResult({ inserted, errors })
    toast(`${inserted} items upserted successfully`, 'success')
    onComplete?.()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-pink-500 bg-pink-500/10'
            : 'border-slate-600 hover:border-slate-400'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={onFileChange} />
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 size={28} className="animate-spin text-pink-500" />
            <p className="text-sm">Processing file…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Upload size={28} className="text-slate-500" />
            <p className="text-sm font-medium text-slate-300">Drop master data file here</p>
            <p className="text-xs">or click to browse · CSV, XLS, XLSX</p>
            <div className="mt-1 text-xs text-slate-500 space-y-0.5">
              <p><span className="text-slate-400">SharePoint CSV:</span> SKU, SKU: Description, QTY Count, In store location, Branch, Size, Color</p>
              <p><span className="text-slate-400">QuickBooks export:</span> SKU, Sales Description, Quantity On Hand, Quantity as-of Date — size &amp; color auto-extracted from description</p>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-2">
          {result.inserted > 0 && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 rounded px-3 py-2">
              <CheckCircle2 size={14} />
              {result.inserted} items upserted into master catalog
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
                <AlertCircle size={14} />
                {result.errors.length} warning{result.errors.length !== 1 ? 's' : ''}
              </div>
              <ul className="text-xs text-amber-300 space-y-0.5 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
