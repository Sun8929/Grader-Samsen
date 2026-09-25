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
