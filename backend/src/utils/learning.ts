import type { Request } from 'express'
import { createSupabaseClient, supabaseAdmin } from '../supabase.js'

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function actor(req: Request) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined
  if (!token) throw new HttpError(401, 'Not authenticated.')
  const { data, error } = await createSupabaseClient(token).auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Invalid session.')
  const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', data.user.id).single()
  if (profileError || !profile) throw new HttpError(403, 'Profile not found.')
  return { id: data.user.id, role: profile.role as string }
}

export async function classAccess(classId: string, user: { id: string; role: string }, ownerOnly = false) {
  const { data, error } = await supabaseAdmin.from('classrooms').select('teacher_id').eq('id', classId).maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'Classroom not found.')
  const owner = user.role === 'admin' || (user.role === 'teacher' && data.teacher_id === user.id)
  if (!owner) {
    if (ownerOnly) throw new HttpError(403, 'Only this classroom’s teacher can make this change.')
    const { data: member, error: memberError } = await supabaseAdmin.from('classroom_members').select('student_id').eq('classroom_id', classId).eq('student_id', user.id).maybeSingle()
    if (memberError) throw memberError
    if (!member) throw new HttpError(403, 'You are not enrolled in this classroom.')
  }
  return owner
}

// Explicit paging avoids Supabase's default row limit in progress calculations.
export async function allRows(query: any): Promise<any[]> {
  const rows: any[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query.range(offset, offset + 499)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < 500) return rows
  }
}

export function mapAssignment(a: any) {
  return {
    id: a.id, classId: a.classroom_id, title: a.title, description: a.description || '',
    dueAt: a.due_at, problemIds: a.problem_ids || [], createdAt: a.created_at,
  }
}
