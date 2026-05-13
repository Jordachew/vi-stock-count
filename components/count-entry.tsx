'use client'

import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { MasterItem, StockCountActual } from '@/types'
import { useDropdowns } from '@/lib/dropdowns'
import { Loader2, Search, Plus, RefreshCw } from 'lucide-react'
import { AddItemModal } from './add-item-modal'
import { useToast } from './toast'

const LOCATIONS = [
  'Draw 1', 'Draw 2', 'Draw 3', 'Draw 4', 'Draw 5', 'Draw 6', 'Draw 7',
  'Bra Column 1', 'Bra Column 2', 'Bra Column 3', 'Bra Column 4',
  'Bra Column 5', 'Bra Column 6', 'Bra Column 7', 'Bra Column 8', 'Bra Column 9',
  'Storage room shelf 1', 'Storage room shelf 2',
  'Rack 1',
]

const schema = z.object({
  sku: z.string().min(1, 'SKU required').transform((v) => v.trim()),
  qty_counted: z.coerce.number().int().min(1, 'Min 1'),
  location: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  sessionId: string
  enteredBy: string | null
  onAdded: (actual: StockCountActual) => void
}

export function CountEntry({ sessionId, enteredBy, onAdded }: Props) {
  const { toast } = useToast()
  const { sizes, colors, categories } = useDropdowns()
  const [masterItem, setMasterItem] = useState<MasterItem | null>(null)
  const [skuStatus, setSkuStatus] = useState<'idle' | 'found' | 'not_found' | 'searching'>('idle')
  const [showAddModal, setShowAddModal] = useState(false)
  const [pendingSku, setPendingSku] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [syncingMaster, setSyncingMaster] = useState(false)
  const skuInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { qty_counted: 1 },
  })

  const skuValue = watch('sku')
  const sizeValue = watch('size')
  const colorValue = watch('color')
  const categoryValue = watch('category')

  // Check if any detail differs from master item
  const detailsDiffer = masterItem && (
    (sizeValue || null) !== (masterItem.size || null) ||
    (colorValue || null) !== (masterItem.color || null) ||
    (categoryValue || null) !== (masterItem.category || null)
  )

  const populateFromMaster = (item: MasterItem) => {
    setValue('location', item.location ?? '')
    setValue('size', item.size ?? '')
    setValue('color', item.color ?? '')
    setValue('category', item.category ?? '')
  }

  const lookupSku = async (sku: string) => {
    const trimmed = sku.trim()
    if (!trimmed) { setSkuStatus('idle'); setMasterItem(null); return }
    setSkuStatus('searching')
    const { data } = await supabase
      .from('master_items')
      .select()
      .eq('sku', trimmed)
      .eq('is_active', true)
      .maybeSingle()

    if (data) {
      const item = data as MasterItem
      setMasterItem(item)
      setSkuStatus('found')
      setEditingDetails(false)
      populateFromMaster(item)
    } else {
      setMasterItem(null)
      setSkuStatus('not_found')
    }
  }

  const onSkuBlur = () => { if (skuValue?.trim()) lookupSku(skuValue) }
  const onSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); lookupSku((e.target as HTMLInputElement).value) }
  }

  const syncToMaster = async () => {
    if (!masterItem) return
    setSyncingMaster(true)
    const { error } = await supabase
      .from('master_items')
      .update({
        size: sizeValue || null,
        color: colorValue || null,
        category: categoryValue || null,
      })
      .eq('id', masterItem.id)
    setSyncingMaster(false)
    if (error) { toast(error.message, 'error'); return }
    setMasterItem({ ...masterItem, size: sizeValue || null, color: colorValue || null, category: categoryValue || null })
    setEditingDetails(false)
    toast('Master item updated', 'success')
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload = {
      session_id: sessionId,
      sku: data.sku,
      description: masterItem?.description ?? null,
      qty_counted: data.qty_counted,
      location: data.location || null,
      size: data.size || null,
      color: data.color || null,
      entered_by: enteredBy,
      date_of_count: new Date().toISOString().split('T')[0],
      notes: data.notes || null,
      is_new_item: skuStatus === 'not_found',
    }

    const { data: inserted, error } = await supabase
      .from('stock_count_actuals')
      .insert(payload)
      .select()
      .single()

    setSaving(false)
    if (error) { toast(error.message, 'error'); return }

    toast(`${data.sku} added — qty ${data.qty_counted}`, 'success')
    onAdded(inserted as StockCountActual)

    reset({ qty_counted: 1 })
    setMasterItem(null)
    setSkuStatus('idle')
    setEditingDetails(false)
    skuInputRef.current?.focus()
  }

  const handleAddModalCreated = (item: MasterItem) => {
    setMasterItem(item)
    setSkuStatus('found')
    setValue('sku', item.sku)
    setEditingDetails(false)
    populateFromMaster(item)
    setShowAddModal(false)
  }

  // Dropdown helpers — include current value even if not in list
  const sizeOptions = sizeValue && !sizes.includes(sizeValue) ? [...sizes, sizeValue] : sizes
  const colorOptions = colorValue && !colors.includes(colorValue) ? [...colors, colorValue] : colors
  const categoryOptions = categoryValue && !categories.includes(categoryValue) ? [...categories, categoryValue] : categories

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* SKU row */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">SKU *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                {...register('sku')}
                ref={(e) => {
                  register('sku').ref(e)
                  ;(skuInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e
                }}
                onBlur={onSkuBlur}
                onKeyDown={onSkuKeyDown}
                autoCapitalize="characters"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm pr-9 focus:outline-none focus:border-pink-500"
                placeholder="Scan or type SKU…"
              />
              <div className="absolute right-2.5 top-2.5">
                {skuStatus === 'searching' && <Loader2 size={14} className="animate-spin text-slate-400" />}
                {skuStatus === 'found' && <Search size={14} className="text-emerald-400" />}
                {skuStatus === 'not_found' && <Search size={14} className="text-amber-400" />}
                {skuStatus === 'idle' && <Search size={14} className="text-slate-600" />}
              </div>
            </div>
            {skuStatus === 'not_found' && (
              <button
                type="button"
                onClick={() => { setPendingSku(skuValue?.trim() ?? ''); setShowAddModal(true) }}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm flex items-center gap-1 whitespace-nowrap"
              >
                <Plus size={14} /> New
              </button>
            )}
          </div>
          {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku.message}</p>}

          {/* Master item preview */}
          {masterItem && (
            <div className="mt-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-emerald-300 font-medium truncate">{masterItem.description}</span>
                <span className="text-slate-400 shrink-0">Sys qty: {masterItem.system_qty}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-slate-400">
                {masterItem.size && <span>Size: <span className="text-white">{masterItem.size}</span></span>}
                {masterItem.color && <span>Color: <span className="text-white">{masterItem.color}</span></span>}
                {masterItem.category && <span>Category: <span className="text-white">{masterItem.category}</span></span>}
              </div>
            </div>
          )}
          {skuStatus === 'not_found' && (
            <p className="mt-1 text-xs text-amber-400">SKU not in master catalog — click New to add it</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Qty Counted *</label>
            <input
              {...register('qty_counted')}
              type="number"
              min={1}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            />
            {errors.qty_counted && <p className="text-red-400 text-xs mt-1">{errors.qty_counted.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Location</label>
            <select
              {...register('location')}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="">— Select —</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Size / Color / Category — auto-populated, editable */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Item Details</span>
            {masterItem && !editingDetails && (
              <button
                type="button"
                onClick={() => setEditingDetails(true)}
                className="text-xs text-pink-400 hover:text-pink-300"
              >
                Edit
              </button>
            )}
            {editingDetails && (
              <div className="flex items-center gap-2">
                {detailsDiffer && (
                  <button
                    type="button"
                    onClick={syncToMaster}
                    disabled={syncingMaster}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                  >
                    {syncingMaster
                      ? <Loader2 size={11} className="animate-spin" />
                      : <RefreshCw size={11} />}
                    Save to master
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { if (masterItem) populateFromMaster(masterItem); setEditingDetails(false) }}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Size</label>
              <select
                {...register('size')}
                disabled={masterItem !== null && !editingDetails}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-pink-500 disabled:opacity-60"
              >
                <option value="">—</option>
                {sizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Color</label>
              <select
                {...register('color')}
                disabled={masterItem !== null && !editingDetails}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-pink-500 disabled:opacity-60"
              >
                <option value="">—</option>
                {colorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <select
                {...register('category')}
                disabled={masterItem !== null && !editingDetails}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-pink-500 disabled:opacity-60"
              >
                <option value="">—</option>
                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {masterItem && !editingDetails && (
            <p className="text-xs text-slate-500">Auto-filled from master item · click Edit to override</p>
          )}
          {editingDetails && detailsDiffer && (
            <p className="text-xs text-amber-400">Changed from master — click &quot;Save to master&quot; to update the catalog</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <input
            {...register('notes')}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            placeholder="Optional note"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-2.5 rounded bg-pink-600 text-white text-sm font-medium hover:bg-pink-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : 'Add Count Entry'}
        </button>
      </form>

      {showAddModal && (
        <AddItemModal
          initialSku={pendingSku}
          onClose={() => setShowAddModal(false)}
          onCreated={handleAddModalCreated}
        />
      )}
    </>
  )
}
