'use client'

import { useState, useRef } from 'react'
import { parseActualsCSV } from '@/lib/csv-parsers'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from './toast'

interface Props {
  sessionId: string
  onComplete?: () => void
}

export function ActualsUpload({ sessionId, onComplete }: Props) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast('Please upload a CSV file', 'error')
      return
    }
    setLoading(true)
    setResult(null)

    const { actuals, errors } = await parseActualsCSV(file, sessionId)

    if (actuals.length === 0) {
      setLoading(false)
      setResult({ inserted: 0, errors: errors.length ? errors : ['No rows found in CSV'] })
      return
    }

    const rows = actuals.map((a) => ({ ...a, session_id: sessionId }))
    const { data, error } = await supabase.from('stock_count_actuals').insert(rows).select()

    setLoading(false)

    if (error) {
      setResult({ inserted: 0, errors: [error.message, ...errors] })
      toast('Upload failed', 'error')
      return
    }

    const inserted = data?.length ?? rows.length
    setResult({ inserted, errors })
    toast(`${inserted} actuals imported`, 'success')
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
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-pink-500 bg-pink-500/10'
            : 'border-slate-600 hover:border-slate-400'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 size={24} className="animate-spin text-pink-500" />
            <p className="text-sm">Importing actuals…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Upload size={24} className="text-slate-500" />
            <p className="text-sm font-medium text-slate-300">Bulk import actuals CSV</p>
            <p className="text-xs">Same format as master data CSV</p>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-2">
          {result.inserted > 0 && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 rounded px-3 py-2">
              <CheckCircle2 size={14} />
              {result.inserted} actuals imported into session
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
                <AlertCircle size={14} />
                {result.errors.length} warning{result.errors.length !== 1 ? 's' : ''}
              </div>
              <ul className="text-xs text-amber-300 space-y-0.5 max-h-24 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
