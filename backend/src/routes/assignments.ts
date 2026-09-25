import { Router } from 'express'
import { supabaseAdmin } from '../supabase.js'
import { actor, allRows, classAccess, HttpError, mapAssignment } from '../utils/learning.js'

export const assignmentsRouter = Router()
const fail = (res: any, err: any) => res.status(err instanceof HttpError ? err.status : 500).json({ error: err.message || 'Server error' })

assignmentsRouter.get('/classroom/:classId', async (req, res) => {
  try {
    const user = await actor(req)
    await classAccess(String(req.params.classId), user)
    const query = supabaseAdmin.from('assignments').select('*').eq('classroom_id', req.params.classId).order('due_at').order('id')
    const rows = await allRows(query)
    return res.json({ assignments: rows.map(a => mapAssignment(a)) })
  } catch (err) { return fail(res, err) }
})

async function fields(body: any) {
  const { title, description = '', dueAt, problemIds } = body
  if (typeof title !== 'string' || !title.trim() || title.length > 200 || typeof description !== 'string' || description.length > 10000) throw new HttpError(400, 'Enter a title (up to 200 characters) and a valid description.')
  if (typeof dueAt !== 'string' || !Number.isFinite(Date.parse(dueAt))) throw new HttpError(400, 'A valid deadline is required.')
  if (!Array.isArray(problemIds) || problemIds.length < 1 || problemIds.length > 100 || problemIds.some(p => typeof p !== 'string')) throw new HttpError(400, 'Select between 1 and 100 problems.')
  const ids = [...new Set(problemIds)]
  const { data: problems, error } = await supabaseAdmin.from('problems').select('id').in('id', ids)
  if (error) throw error
  if (problems?.length !== ids.length) throw new HttpError(400, 'One or more selected problems no longer exist.')
  return { title: title.trim(), description, due_at: dueAt, problem_ids: ids }
}

assignmentsRouter.post('/', async (req, res) => {
  try {
    const user = await actor(req)
    const { classroomId } = req.body
    if (typeof classroomId !== 'string') throw new HttpError(400, 'Classroom is required.')
    await classAccess(classroomId, user, true)
    const values = await fields(req.body)
    const { data, error } = await supabaseAdmin.from('assignments').insert({ classroom_id: classroomId, ...values }).select('*').single()
    if (error) throw error
    return res.status(201).json({ assignment: mapAssignment(data) })
  } catch (err) { return fail(res, err) }
})

assignmentsRouter.delete('/:id', async (req, res) => {
  try {
    const user = await actor(req)
    const { data, error: lookupError } = await supabaseAdmin.from('assignments').select('classroom_id').eq('id', req.params.id).maybeSingle()
    if (lookupError) throw lookupError
    if (!data) throw new HttpError(404, 'Assignment not found.')
    await classAccess(data.classroom_id, user, true)
    const { error } = await supabaseAdmin.from('assignments').delete().eq('id', req.params.id)
    if (error) throw error
    return res.json({ success: true })
  } catch (err) { return fail(res, err) }
})
