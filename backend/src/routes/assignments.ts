import { Router } from 'express'
import { createSupabaseClient, supabaseAdmin } from '../supabase.js'

export const assignmentsRouter = Router()

// 1. GET /classroom/:classId - List assignments for a classroom
assignmentsRouter.get('/classroom/:classId', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  const { classId } = req.params

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  try {
    // Verify caller has access to classroom
    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classId)
      .maybeSingle()

    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found.' })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    const isTeacher = classroom.teacher_id === userData.user.id
    const isAdmin = profile?.role === 'admin'

    let isEnrolled = false
    if (!isTeacher && !isAdmin) {
      const { data: membership } = await supabaseAdmin
        .from('classroom_members')
        .select('*')
        .eq('classroom_id', classId)
        .eq('student_id', userData.user.id)
        .maybeSingle()

      isEnrolled = !!membership
    }

    if (!isTeacher && !isAdmin && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied. You are not enrolled in this classroom.' })
    }

    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('classroom_id', classId)
      .order('due_at', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const mapped = (assignments || []).map(a => ({
      id: a.id,
      classId: a.classroom_id,
      title: a.title,
      description: a.description || '',
      dueAt: a.due_at,
      problemIds: a.problem_ids || [],
      createdAt: a.created_at
    }))

    return res.json({ assignments: mapped })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 2. POST / - Create assignment (Teachers/Admins only)
assignmentsRouter.post('/', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid session.' })
  }

  const { classroomId, title, description, dueAt, problemIds } = req.body as {
    classroomId: string
    title: string
    description?: string
    dueAt: string
    problemIds: string[]
  }

  if (!classroomId || !title || !dueAt || !problemIds || problemIds.length === 0) {
    return res.status(400).json({ error: 'Classroom ID, title, due date, and problem IDs are required.' })
  }

  try {
    // Verify user is teacher or admin of this classroom
    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single()

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    const isTeacher = classroom?.teacher_id === userData.user.id
    const isAdmin = profile?.role === 'admin'

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. Teachers and Admins only.' })
    }

    const { data: assignment, error } = await supabaseAdmin
      .from('assignments')
      .insert({
        classroom_id: classroomId,
        title,
        description,
        due_at: dueAt,
        problem_ids: problemIds
      })
      .select('*')
      .single()

    if (error || !assignment) {
      return res.status(500).json({ error: error?.message ?? 'Failed to create assignment.' })
    }

    return res.status(201).json({
      assignment: {
        id: assignment.id,
        classId: assignment.classroom_id,
        title: assignment.title,
        description: assignment.description || '',
        dueAt: assignment.due_at,
        problemIds: assignment.problem_ids || [],
        createdAt: assignment.created_at
      }
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 3. DELETE /:id - Delete assignment (Teachers/Admins only)
assignmentsRouter.delete('/:id', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  const { id } = req.params

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid session.' })
  }

  try {
    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select('classroom_id')
      .eq('id', id)
      .single()

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' })
    }

    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', assignment.classroom_id)
      .single()

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    const isTeacher = classroom?.teacher_id === userData.user.id
    const isAdmin = profile?.role === 'admin'

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const { error } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})
