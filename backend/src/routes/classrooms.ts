import { Router } from 'express'
import { createSupabaseClient, supabaseAdmin } from '../supabase.js'

export const classroomsRouter = Router()

// Helper to generate a random 7-character alphanumeric uppercase code
function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Map database classroom row to frontend format
interface DbClassroom {
  id: string
  name: string
  code: string
  description: string | null
  teacher_id: string
  created_at: string
}

async function getStudentCount(classroomId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('classroom_members')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', classroomId)
  
  if (error) return 0
  return count ?? 0
}

// 1. GET / - List classrooms (enrolled for students, created for teachers)
classroomsRouter.get('/', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  // Get user profile role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Profile not found.' })
  }

  try {
    let classes: DbClassroom[] = []

    if (profile.role === 'student') {
      // Fetch classrooms this student is enrolled in
      const { data: memberRows, error: memberError } = await supabaseAdmin
        .from('classroom_members')
        .select('classroom_id')
        .eq('student_id', userData.user.id)

      if (memberError) {
        return res.status(500).json({ error: memberError.message })
      }

      const classroomIds = memberRows.map((r) => r.classroom_id)
      if (classroomIds.length > 0) {
        const { data: classroomRows, error: classError } = await supabaseAdmin
          .from('classrooms')
          .select('*')
          .in('id', classroomIds)
          .order('created_at', { ascending: false })

        if (classError) {
          return res.status(500).json({ error: classError.message })
        }
        classes = classroomRows || []
      }
    } else if (profile.role === 'admin') {
      // Fetch all classrooms in the database for the system admin
      const { data: classroomRows, error: classError } = await supabaseAdmin
        .from('classrooms')
        .select('*')
        .order('created_at', { ascending: false })

      if (classError) {
        return res.status(500).json({ error: classError.message })
      }
      classes = classroomRows || []
    } else {
      // Fetch classrooms owned by this teacher
      const { data: classroomRows, error: classError } = await supabaseAdmin
        .from('classrooms')
        .select('*')
        .eq('teacher_id', userData.user.id)
        .order('created_at', { ascending: false })

      if (classError) {
        return res.status(500).json({ error: classError.message })
      }
      classes = classroomRows || []
    }

    // Batch fetch teacher profiles to avoid N+1 queries
    const teacherIds = [...new Set(classes.map((c) => c.teacher_id))]
    let teacherMap = new Map<string, { name: string; username: string }>()
    if (teacherIds.length > 0) {
      const { data: teacherProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name, username')
        .in('id', teacherIds)
      
      if (teacherProfiles) {
        teacherProfiles.forEach((tp) => {
          teacherMap.set(tp.id, tp)
        })
      }
    }

    // Batch fetch student membership counts to avoid N+1 queries
    const classIds = classes.map((c) => c.id)
    const countMap = new Map<string, number>()
    if (classIds.length > 0) {
      const { data: memberRows } = await supabaseAdmin
        .from('classroom_members')
        .select('classroom_id')
        .in('classroom_id', classIds)

      if (memberRows) {
        memberRows.forEach((row) => {
          countMap.set(row.classroom_id, (countMap.get(row.classroom_id) || 0) + 1)
        })
      }
    }

    const mappedClasses = classes.map((c) => {
      const teacherProfile = teacherMap.get(c.teacher_id)
      const studentCount = countMap.get(c.id) ?? 0

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        description: c.description ?? '',
        teacherId: c.teacher_id,
        teacherName: teacherProfile?.name || teacherProfile?.username || 'Unknown',
        studentCount,
      }
    })

    return res.json({ classrooms: mappedClasses })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 2. POST / - Create a classroom (Teachers only)
classroomsRouter.post('/', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Profile not found.' })
  }

  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return res.status(403).json({ error: 'Only teachers or admins can create classrooms.' })
  }

  const { name, description } = req.body as { name?: string; description?: string }
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Class name is required.' })
  }

  try {
    // Generate unique class code
    let code = generateClassCode()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const { data: existingClass, error: lookupError } = await supabaseAdmin
        .from('classrooms')
        .select('id')
        .eq('code', code)
        .maybeSingle()

      if (!lookupError && !existingClass) {
        isUnique = true
      } else {
        code = generateClassCode()
        attempts++
      }
    }

    const { data: classroom, error: insertError } = await supabaseAdmin
      .from('classrooms')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        code,
        teacher_id: userData.user.id,
      })
      .select('*')
      .single()

    if (insertError || !classroom) {
      return res.status(500).json({ error: insertError?.message ?? 'Failed to create classroom.' })
    }

    // Fetch teacher profile to get the teacher's name
    const { data: teacherProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, username')
      .eq('id', userData.user.id)
      .maybeSingle()

    return res.status(201).json({
      classroom: {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        description: classroom.description ?? '',
        teacherId: classroom.teacher_id,
        teacherName: teacherProfile?.name || teacherProfile?.username || 'Unknown',
        studentCount: 0,
      }
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 3. POST /join - Join a classroom by code (Students only)
classroomsRouter.post('/join', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  const { code } = req.body as { code?: string }
  if (!code || code.trim().length === 0) {
    return res.status(400).json({ error: 'Class code is required.' })
  }

  const cleanCode = code.trim().toUpperCase()

  try {
    // Find class
    const { data: classroom, error: classLookupError } = await supabaseAdmin
      .from('classrooms')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle()

    if (classLookupError) {
      return res.status(500).json({ error: classLookupError.message })
    }

    if (!classroom) {
      return res.status(404).json({ error: 'Invalid class code. Please try again.' })
    }

    // Check if student is already enrolled
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('classroom_members')
      .select('*')
      .eq('classroom_id', classroom.id)
      .eq('student_id', userData.user.id)
      .maybeSingle()

    if (enrollmentError) {
      return res.status(500).json({ error: enrollmentError.message })
    }

    if (enrollment) {
      return res.status(409).json({ error: 'You are already enrolled in this class.' })
    }

    // Enroll student
    const { error: joinError } = await supabaseAdmin
      .from('classroom_members')
      .insert({
        classroom_id: classroom.id,
        student_id: userData.user.id,
      })

    if (joinError) {
      return res.status(500).json({ error: joinError.message })
    }

    const studentCount = await getStudentCount(classroom.id)

    // Fetch teacher profile to get the teacher's name
    const { data: teacherProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, username')
      .eq('id', classroom.teacher_id)
      .maybeSingle()

    return res.json({
      classroom: {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        description: classroom.description ?? '',
        teacherId: classroom.teacher_id,
        teacherName: teacherProfile?.name || teacherProfile?.username || 'Unknown',
        studentCount,
      }
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 4. GET /:id/members - List classroom student profiles (Teachers or enrolled students only)
classroomsRouter.get('/:id/members', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  const classId = req.params.id

  try {
    // Check if class exists
    const { data: classroom, error: classLookupError } = await supabaseAdmin
      .from('classrooms')
      .select('*')
      .eq('id', classId)
      .maybeSingle()

    if (classLookupError || !classroom) {
      return res.status(404).json({ error: 'Classroom not found.' })
    }

    // Auth check: User must be either the class teacher, an enrolled student, or an admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isOwner = classroom.teacher_id === userData.user.id || isAdmin
    let isEnrolled = false

    if (!isOwner) {
      const { data: enrollment } = await supabaseAdmin
        .from('classroom_members')
        .select('*')
        .eq('classroom_id', classId)
        .eq('student_id', userData.user.id)
        .maybeSingle()
      isEnrolled = !!enrollment
    }

    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    // Fetch members
    const { data: memberRows, error: memberLookupError } = await supabaseAdmin
      .from('classroom_members')
      .select('student_id')
      .eq('classroom_id', classId)

    if (memberLookupError) {
      return res.status(500).json({ error: memberLookupError.message })
    }

    const studentIds = memberRows.map((r) => r.student_id)
    let members: any[] = []

    if (studentIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, username, xp, streak, tier')
        .in('id', studentIds)
        .order('xp', { ascending: false })

      if (profilesError) {
        return res.status(500).json({ error: profilesError.message })
      }
      members = profiles || []
    }

    return res.json({ members })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 5. DELETE /:id - Delete a classroom (Teachers only)
classroomsRouter.delete('/:id', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  const classId = req.params.id

  try {
    const { data: classroom, error: lookupError } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classId)
      .maybeSingle()

    if (lookupError || !classroom) {
      return res.status(404).json({ error: 'Classroom not found.' })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isTeacher = profile?.role === 'teacher'
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ error: 'Only teachers or administrators can delete classrooms.' })
    }

    if (classroom.teacher_id !== userData.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Only the creator teacher or an administrator can delete this classroom.' })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('classrooms')
      .delete()
      .eq('id', classId)

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message })
    }

    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 6. DELETE /:id/leave - Leave a classroom (Students only)
classroomsRouter.delete('/:id/leave', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  const classId = req.params.id

  try {
    const { data: enrollment, error: lookupError } = await supabaseAdmin
      .from('classroom_members')
      .select('*')
      .eq('classroom_id', classId)
      .eq('student_id', userData.user.id)
      .maybeSingle()

    if (lookupError || !enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('classroom_members')
      .delete()
      .eq('classroom_id', classId)
      .eq('student_id', userData.user.id)

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message })
    }

    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 7. GET /:id/submissions - List all submissions from students in this classroom (Teachers/Admins only)
classroomsRouter.get('/:id/submissions', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const classId = req.params.id

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  const client = createSupabaseClient(token)
  const { data: userData, error: userError } = await client.auth.getUser(token)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  try {
    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classId)
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

    const { data: members } = await supabaseAdmin
      .from('classroom_members')
      .select('student_id')
      .eq('classroom_id', classId)

    const studentIds = members?.map(m => m.student_id) || []
    if (studentIds.length === 0) {
      return res.json({ submissions: [] })
    }

    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .in('user_id', studentIds)
      .order('submitted_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const mapped = (submissions || []).map(s => ({
      id: s.id,
      userId: s.user_id,
      problemId: s.problem_id,
      language: s.language,
      code: s.code,
      verdict: s.verdict,
      score: s.score,
      runtime: s.runtime,
      memory: s.memory,
      submittedAt: s.submitted_at
    }))

    return res.json({ submissions: mapped })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})
