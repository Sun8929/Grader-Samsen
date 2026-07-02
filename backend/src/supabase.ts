import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './env.js'

const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = loadEnv()

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export function createSupabaseClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}
