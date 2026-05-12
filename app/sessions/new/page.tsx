'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/toast'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const BRANCHES = ['Montego Bay', 'Kingston', 'Off site storage']

const schema = z.object({
  session_name: z.string().min(1, 'Session name required'),
  branch: z.string().min(1, 'Branch required'),
  count_date: z.string().min(1, 'Count date required'),
  entered_by: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewSessionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      count_date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const { data: session, error } = await supabase
      .from('stock_sessions')
      .insert({
        session_name: data.session_name,
        branch: data.branch,
        count_date: data.count_date,
        entered_by: data.entered_by || null,
        notes: data.notes || null,
        status: 'open',
      })
      .select()
      .single()

    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    toast('Session created', 'success')
    router.push(`/sessions/${session.id}`)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/sessions"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft size={14} /> Back to sessions
        </Link>
        <h1 className="text-xl font-bold text-white">New Count Session</h1>
        <p className="text-sm text-slate-400 mt-0.5">Create a session to start recording physical counts</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-5"
      >
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Session Name *</label>
          <input
            {...register('session_name')}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500"
            placeholder="e.g. MBJ Count May 2026 — Week 1"
          />
          {errors.session_name && <p className="text-red-400 text-xs mt-1">{errors.session_name.message}</p>}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Branch *</label>
          <select
            {...register('branch')}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500"
          >
            <option value="">— Select branch —</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.branch && <p className="text-red-400 text-xs mt-1">{errors.branch.message}</p>}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Count Date *</label>
          <input
            {...register('count_date')}
            type="date"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500"
          />
          {errors.count_date && <p className="text-red-400 text-xs mt-1">{errors.count_date.message}</p>}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Entered By</label>
          <input
            {...register('entered_by')}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500"
            placeholder="Staff name"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500 resize-none"
            placeholder="Optional notes about this count session"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Creating…' : 'Create Session & Start Counting'}
        </button>
      </form>
    </div>
  )
}
