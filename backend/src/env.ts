import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(backendRoot, '.env')
const envExamplePath = path.join(backendRoot, '.env.example')

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath)
  console.warn(`Created ${envPath} from .env.example — add your Supabase keys before registering.`)
}

dotenv.config({ path: envPath })

const PLACEHOLDER_VALUES = [
  'your-project.supabase.co',
  'your-anon-key',
  'your-service-role-key',
]

function normalizeSupabaseUrl(url: string): string {
  let normalized = url.trim()
  normalized = normalized.replace(/\/rest\/v1\/?$/i, '')
  normalized = normalized.replace(/\/+$/, '')
  return normalized
}

export function loadEnv() {
  const rawSupabaseUrl = process.env.SUPABASE_URL?.trim()
  const supabaseUrl = rawSupabaseUrl ? normalizeSupabaseUrl(rawSupabaseUrl) : undefined
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim()
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const port = Number(process.env.BACKEND_PORT || process.env.PORT) || 3001
  const frontendPort = process.env.FRONTEND_PORT || '5173'
  const frontendUrl = process.env.FRONTEND_URL?.trim() ?? `http://localhost:${frontendPort}`
  const onlineCompilerApiKey = process.env.ONLINE_COMPILER_API_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error(
      [
        'Missing Supabase credentials in backend/.env',
        '',
        '1. Open backend/.env (create it from backend/.env.example if needed)',
        '2. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY',
        '3. Get values from Supabase → Project Settings → API',
        '4. Restart: npm run dev',
      ].join('\n'),
    )
  }

  const usingPlaceholders = PLACEHOLDER_VALUES.some(
    (value) =>
      supabaseUrl.includes(value) ||
      supabaseAnonKey.includes(value) ||
      supabaseServiceRoleKey.includes(value),
  )

  if (usingPlaceholders) {
    console.warn(
      'Warning: backend/.env still has placeholder Supabase values. Replace them with your real project keys.',
    )
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    port,
    frontendUrl,
    onlineCompilerApiKey,
  }
}
