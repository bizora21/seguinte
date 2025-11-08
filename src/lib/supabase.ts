import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://bpzqdwpkwlwflrcwcrqp.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwenFkd3Brd2x3ZmxyY3djcnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTg5MDcsImV4cCI6MjA3NTc5NDkwN30.idbxpDfBW-uK6oHdvDhDmm8j1AffdSbUgiVaBlGtixI"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidas.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)