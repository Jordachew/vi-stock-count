import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { DropdownOption } from '@/types'

export function useDropdowns() {
  const [options, setOptions] = useState<DropdownOption[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    setOptions((data ?? []) as DropdownOption[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const sizes = options.filter((o) => o.type === 'size').map((o) => o.value)
  const colors = options.filter((o) => o.type === 'color').map((o) => o.value)
  const categories = options.filter((o) => o.type === 'category').map((o) => o.value)
  const locations = options.filter((o) => o.type === 'location').map((o) => o.value)

  return { sizes, colors, categories, locations, options, loading, reload: load }
}
