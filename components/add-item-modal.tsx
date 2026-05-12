'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { MasterItem } from '@/types'
import { X, Loader2 } from 'lucide-react'
import { useToast } from './toast'

const BRANCHES = ['Montego Bay', 'Kingston', 'Off site storage']
const LOCATIONS = [
  'Draw 1', 'Draw 2', 'Draw 3', 'Draw 4', 'Draw 5', 'Draw 6', 'Draw 7',
  'Bra Column 1', 'Bra Column 2', 'Bra Column 3', 'Bra Column 4',
  'Bra Column 5', 'Bra Column 6', 'Bra Column 7', 'Bra Column 8', 'Bra Column 9',
  'Storage room shelf 1', 'Storage room shelf 2',
  'Rack 1',
]

const schema = z.object({
  sku: z.string().min(1, 'SKU required').transform((v) => v.trim()),
  description: z.string().min(1, 'Description required'),
  size: z.string().optional(),
  color: z.string().optional(),
  branch: z.string().optional(),
  location: z.string().optional(),
  system_qty: z.coerce.number().int().min(0).default(0),
})

type FormData = z.infer<typeof schema>

interface Props {
  initialSku?: string
  onClose: () => void
  onCreated: (item: MasterItem) => void
}

export function AddItemModal({ initialSku = '', onClose, onCreated }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { sku: initialSku, system_qty: 0 },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const { data: item, error } = await supabase
      .from('master_items')
      .insert({
        sku: data.sku,
        description: data.description,
        size: data.size || null,
        color: data.color || null,
        branch: data.branch || null,
        location: data.location || null,
        system_qty: data.system_qty,
        is_active: true,
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    toast('Item added to master catalog', 'success')
    onCreated(item as MasterItem)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Add New Item to Master</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">SKU *</label>
            <input
              {...register('sku')}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              placeholder="e.g. BRA-001"
            />
            {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku.message}</p>}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description *</label>
            <input
              {...register('description')}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              placeholder="e.g. Underwire Push-Up Bra"
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Size</label>
              <input
                {...register('size')}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                placeholder="e.g. 36B"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Color</label>
              <input
                {...register('color')}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                placeholder="e.g. Black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Branch</label>
            <select
              {...register('branch')}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">— Select branch —</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Location</label>
            <select
              {...register('location')}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">— Select location —</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">System Qty</label>
            <input
              {...register('system_qty')}
              type="number"
              min={0}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-slate-700 text-slate-200 text-sm hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded bg-pink-600 text-white text-sm hover:bg-pink-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
