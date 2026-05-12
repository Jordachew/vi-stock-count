import { createClient } from '@supabase/supabase-js'

// Fallback to placeholder at build time — real values injected at runtime via env vars.
// Client components only call Supabase inside useEffect/handlers, never during SSR/prerender.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
