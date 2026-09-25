import { Router } from 'express'
import { supabaseAdmin } from '../supabase.js'
import { actor, allRows, HttpError } from '../utils/learning.js'

export const learningRouter = Router()
const fail = (res: any, err: any) => res.status(err instanceof HttpError ? err.status : 500).json({ error: err.message || 'Server error' })
const mapSubmission = (s: any) => ({
  id: s.id, userId: s.user_id, problemId: s.problem_id,
  language: s.language, code: s.code, verdict: s.verdict, score: s.score,
  submittedAt: s.submitted_at,
})

learningRouter.get('/progress', async (req, res) => {
  try {
    const user = await actor(req)
    const [problems, submissions] = await Promise.all([
      allRows(supabaseAdmin.from('problems').select('id,title,difficulty,tags').order('id')),
      allRows(supabaseAdmin.from('submissions').select('id,user_id,problem_id,verdict,submitted_at').eq('user_id', user.id).order('submitted_at').order('id')),
    ])
    return res.json({ problems, submissions: submissions.map(mapSubmission) })
  } catch (err) { return fail(res, err) }
})

async function feedbackAccess(submissionId: string, user: { id: string; role: string }, writing = false) {
  const { data: submission, error } = await supabaseAdmin.from('submissions').select('user_id,assignment_id').eq('id', submissionId).maybeSingle()
  if (error) throw error
  if (!submission) throw new HttpError(404, 'Submission not found.')
  if (!writing && submission.user_id === user.id) return
  if (user.role === 'admin') return
  if (user.role !== 'teacher' || !submission.assignment_id) throw new HttpError(403, 'Feedback is available to the student and their assignment teacher.')
  const { data: assignment, error: assignmentError } = await supabaseAdmin.from('assignments').select('classroom_id').eq('id', submission.assignment_id).maybeSingle()
  if (assignmentError) throw assignmentError
  if (!assignment) throw new HttpError(403, 'Assignment not found.')
  const { data: classroom, error: classError } = await supabaseAdmin.from('classrooms').select('teacher_id').eq('id', assignment.classroom_id).maybeSingle()
  if (classError) throw classError
  if (!classroom || classroom.teacher_id !== user.id) throw new HttpError(403, 'Only the assignment teacher may give feedback.')
}

learningRouter.get('/submissions/:id/feedback', async (req, res) => {
  try {
    const user = await actor(req)
    await feedbackAccess(String(req.params.id), user)
    const rows = await allRows(supabaseAdmin.from('submission_feedback').select('*, author:profiles!author_id(name)').eq('submission_id', req.params.id).order('created_at').order('id'))
    return res.json({ feedback: rows.map(f => ({ id: f.id, body: f.body, authorName: f.author?.name || 'Teacher', createdAt: f.created_at })) })
  } catch (err) { return fail(res, err) }
})

learningRouter.post('/submissions/:id/feedback', async (req, res) => {
  try {
    const user = await actor(req)
    await feedbackAccess(String(req.params.id), user, true)
    const body = req.body.body
    if (typeof body !== 'string' || !body.trim() || body.trim().length > 4000) throw new HttpError(400, 'Feedback must contain 1–4000 characters.')
    const { data, error } = await supabaseAdmin.from('submission_feedback').insert({ submission_id: req.params.id, author_id: user.id, body: body.trim() }).select('*, author:profiles!author_id(name)').single()
    if (error) throw error
    return res.status(201).json({ feedback: { id: data.id, body: data.body, authorName: data.author?.name || 'Teacher', createdAt: data.created_at } })
  } catch (err) { return fail(res, err) }
})
