import { Router } from 'express'
import { createSupabaseClient, supabaseAdmin } from '../supabase.js'
import { isValidUsername, usernameToEmail, usernameValidationMessage } from '../utils/username.js'
import { cacheMiddleware, clearCache } from '../utils/cache.js'

export const authRouter = Router()

type ProfileRow = {
  id: string
  username: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  xp: number | null
  streak: number | null
  tier: string | null
  created_at: string
  avatar_url?: string
}

function mapProfile(profile: ProfileRow) {
  return {
    id: profile.id,
    username: profile.username,
    name: profile.name,
    email: usernameToEmail(profile.username),
    role: profile.role,
    xp: profile.xp ?? 0,
    streak: profile.streak ?? 0,
    tier: profile.tier ?? 'Bronze',
    createdAt: profile.created_at,
    avatarUrl: profile.avatar_url || '',
  }
}

authRouter.post('/register', async (req, res) => {
  const { username, password, role } = req.body as { username?: string; password?: string; role?: string }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: usernameValidationMessage() })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  const email = usernameToEmail(username)

  const { data: existingProfile, error: existingError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (existingError) {
    const setupHint = existingError.message.includes('profiles')
      ? 'Database not set up. Run backend/supabase/migrations/001_profiles.sql in Supabase SQL Editor.'
      : existingError.message
    return res.status(500).json({ error: setupHint })
  }

  if (existingProfile) {
    return res.status(409).json({ error: 'Username is already taken.' })
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: username.toLowerCase() },
  })

  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message ?? 'Failed to create account.' })
  }

  let userRole: 'student' | 'teacher' | 'admin' = 'student'
  if (role === 'teacher') {
    const { teacherCode } = req.body as { teacherCode?: string }
    const validKey = process.env.TEACHER_SIGNUP_KEY || 'samsen-teacher-secret'
    if (!teacherCode || teacherCode !== validKey) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(403).json({ error: 'Invalid or missing Teacher invitation code.' })
    }
    userRole = 'teacher'
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      username: username.toLowerCase(),
      name: username,
      role: userRole,
    })
    .select('*')
    .single()

  if (profileError || !profile) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return res.status(500).json({ error: profileError?.message ?? 'Failed to create profile.' })
  }

  const client = createSupabaseClient()
  const { data: sessionData, error: sessionError } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (sessionError || !sessionData.session) {
    return res.status(201).json({
      user: mapProfile(profile as ProfileRow),
      session: null,
    })
  }

  return res.status(201).json({
    user: mapProfile(profile as ProfileRow),
    session: {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_at: sessionData.session.expires_at,
    },
  })
})

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: usernameValidationMessage() })
  }

  const email = usernameToEmail(username)
  const client = createSupabaseClient()
  const { data: sessionData, error: sessionError } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (sessionError || !sessionData.user || !sessionData.session) {
    return res.status(401).json({ error: 'Invalid username or password.' })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', sessionData.user.id)
    .single()

  if (profileError || !profile) {
    return res.status(404).json({ error: 'User profile not found.' })
  }

  return res.json({
    user: mapProfile(profile as ProfileRow),
    session: {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_at: sessionData.session.expires_at,
    },
  })
})

authRouter.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
    const client = createSupabaseClient(token)
    await client.auth.signOut()
  }

  return res.json({ success: true })
})

authRouter.get('/me', async (req, res) => {
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
    .select('*')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile) {
    return res.status(404).json({ error: 'User profile not found.' })
  }

  return res.json({ user: mapProfile(profile as ProfileRow) })
})

authRouter.get('/users', async (req, res) => {
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

  const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (currentProfileError || !currentProfile) {
    return res.status(404).json({ error: 'Caller profile not found.' })
  }

  if (currentProfile.role !== 'teacher' && currentProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Only teachers or admins can view all users.' })
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    return res.status(500).json({ error: profilesError.message })
  }

  return res.json({ users: (profiles as ProfileRow[]).map(mapProfile) })
})

authRouter.delete('/delete-account', async (req, res) => {
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

  const userId = userData.user.id

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message ?? 'Failed to delete user account.' })
  }

  return res.json({ success: true })
})

authRouter.delete('/users/:id', async (req, res) => {
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

  const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (currentProfileError || !currentProfile) {
    return res.status(404).json({ error: 'Caller profile not found.' })
  }

  if (currentProfile.role !== 'teacher' && currentProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Only teachers or admins can delete users.' })
  }

  const targetUserId = req.params.id

  if (targetUserId === userData.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself using this endpoint.' })
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message ?? 'Failed to delete user.' })
  }

  return res.json({ success: true })
})

authRouter.get('/leaderboard', cacheMiddleware(15), async (req, res) => {
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

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, name, username, xp, streak, tier')
    .eq('role', 'student')
    .order('xp', { ascending: false })

  if (profilesError) {
    return res.status(500).json({ error: profilesError.message })
  }

  // Fetch accepted submissions to calculate unique problems solved per user
  const { data: acceptedSubs, error: subsError } = await supabaseAdmin
    .from('submissions')
    .select('user_id, problem_id')
    .eq('verdict', 'Accepted')

  const solvedMap: Record<string, number> = {}
  if (!subsError && acceptedSubs) {
    const userSolvedSets: Record<string, Set<string>> = {}
    acceptedSubs.forEach((sub: any) => {
      if (!userSolvedSets[sub.user_id]) {
        userSolvedSets[sub.user_id] = new Set()
      }
      userSolvedSets[sub.user_id].add(sub.problem_id)
    })
    for (const userId in userSolvedSets) {
      solvedMap[userId] = userSolvedSets[userId].size
    }
  }

  const leaderboard = (profiles || []).map((p, index) => ({
    rank: index + 1,
    userId: p.id,
    name: p.name,
    username: p.username,
    xp: p.xp ?? 0,
    streak: p.streak ?? 0,
    tier: p.tier ?? 'Bronze',
    solvedCount: solvedMap[p.id] ?? 0,
  }))

  return res.json({ leaderboard })
})

authRouter.put('/users/:id/role', async (req, res) => {
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

  const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (currentProfileError || !currentProfile) {
    return res.status(404).json({ error: 'Caller profile not found.' })
  }

  if (currentProfile.role !== 'teacher' && currentProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Only teachers or admins can change user roles.' })
  }

  const targetUserId = req.params.id
  const { role } = req.body as { role?: string }

  if (!role || !['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be student, teacher, or admin.' })
  }

  // Get target profile to check if they are currently an admin
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', targetUserId)
    .single()

  if (targetError || !targetProfile) {
    return res.status(404).json({ error: 'Target user profile not found.' })
  }

  // Teacher restrictions:
  if (currentProfile.role === 'teacher') {
    if (role === 'admin') {
      return res.status(403).json({ error: 'Teachers cannot assign the admin role.' })
    }
    if (targetProfile.role === 'admin') {
      return res.status(403).json({ error: 'Teachers cannot modify an admin\'s role.' })
    }
  }


  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId)
    .select('*')
    .single()

  if (updateError || !updatedProfile) {
    return res.status(500).json({ error: updateError?.message ?? 'Failed to update user role.' })
  }

  clearCache('/api/auth/leaderboard')

  return res.json({ user: mapProfile(updatedProfile as ProfileRow) })
})

// 9. PUT /profile - Update user's name and username handle
authRouter.put('/profile', async (req, res) => {
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

  const { name, username } = req.body as { name?: string; username?: string }

  if (!name && !username) {
    return res.status(400).json({ error: 'Name or username is required.' })
  }

  const updates: Record<string, any> = {}
  if (name !== undefined) updates.name = name
  if (username !== undefined) {
    if (!isValidUsername(username)) {
      return res.status(400).json({ error: usernameValidationMessage() })
    }
    
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', userData.user.id)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'Username handle is already taken.' })
    }
    updates.username = username.toLowerCase()
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userData.user.id)
      .select('*')
      .single()

    if (error || !profile) {
      return res.status(500).json({ error: error?.message ?? 'Failed to update profile.' })
    }

    clearCache('/api/auth/leaderboard')

    return res.json({ user: mapProfile(profile as ProfileRow) })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 10. PUT /password - Update user's secure authentication password
authRouter.put('/password', async (req, res) => {
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

  const { password } = req.body as { password?: string }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
      password: password
    })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json({ success: true, message: 'Password updated successfully.' })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 11. POST /import-users - Batch import users (teachers/admins only)
authRouter.post('/import-users', async (req, res) => {
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

  // Get caller profile
  const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (currentProfileError || !currentProfile) {
    return res.status(404).json({ error: 'Caller profile not found.' })
  }

  if (currentProfile.role !== 'teacher' && currentProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Only teachers or admins can import users.' })
  }

  const { users } = req.body as { users?: Array<{ username?: string; name?: string; password?: string; role?: string }> }

  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ error: 'Payload must contain a "users" array.' })
  }

  const results = {
    total: users.length,
    successCount: 0,
    failedCount: 0,
    errors: [] as Array<{ username?: string; error: string }>,
    imported: [] as Array<{ id: string; username: string; name: string; role: string }>
  }

  for (const user of users) {
    const username = user.username?.trim()
    const name = user.name?.trim() || username
    const password = user.password
    let role = user.role?.trim().toLowerCase() as 'student' | 'teacher' | 'admin'

    if (!username) {
      results.failedCount++
      results.errors.push({ error: 'Missing username.' })
      continue
    }

    if (!isValidUsername(username)) {
      results.failedCount++
      results.errors.push({ username, error: usernameValidationMessage() })
      continue
    }

    if (!password || password.length < 6) {
      results.failedCount++
      results.errors.push({ username, error: 'Password must be at least 6 characters.' })
      continue
    }

    if (!role) {
      role = 'student'
    } else if (role !== 'student' && role !== 'teacher' && role !== 'admin') {
      results.failedCount++
      results.errors.push({ username, error: `Invalid role "${role}". Must be student, teacher, or admin.` })
      continue
    }

    // Check if user already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (checkError) {
      results.failedCount++
      results.errors.push({ username, error: `Database error: ${checkError.message}` })
      continue
    }

    if (existingProfile) {
      results.failedCount++
      results.errors.push({ username, error: 'Username is already taken.' })
      continue
    }

    // Create auth user
    const email = usernameToEmail(username)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: username.toLowerCase() },
    })

    if (authError || !authData.user) {
      results.failedCount++
      results.errors.push({ username, error: authError?.message ?? 'Failed to create auth user.' })
      continue
    }

    // Insert profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: username.toLowerCase(),
        name,
        role,
      })
      .select('*')
      .single()

    if (profileError || !profile) {
      // Clean up the created auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      results.failedCount++
      results.errors.push({ username, error: profileError?.message ?? 'Failed to create profile.' })
      continue
    }

    results.successCount++
    results.imported.push({
      id: profile.id,
      username: profile.username,
      name: profile.name,
      role: profile.role,
    })
  }

  clearCache('/api/auth/leaderboard')

  return res.json(results)
})

// 12. PUT /profile/avatar - Update profile picture (Base64)
authRouter.put('/profile/avatar', async (req, res) => {
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

  const { avatar } = req.body as { avatar?: string }

  if (avatar === undefined) {
    return res.status(400).json({ error: 'Avatar content is required.' })
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: avatar })
      .eq('id', userData.user.id)
      .select('*')
      .single()

    if (error || !profile) {
      return res.status(500).json({ error: error?.message ?? 'Failed to update avatar.' })
    }

    return res.json({ user: mapProfile(profile as ProfileRow) })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 13. POST /profile/reset - Reset progress (Badge Out)
authRouter.post('/profile/reset', async (req, res) => {
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

  const userId = userData.user.id

  try {
    // 1. Delete submissions
    const { error: subError } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('user_id', userId)

    if (subError) {
      return res.status(500).json({ error: `Failed to reset submissions: ${subError.message}` })
    }

    // 2. Delete classroom memberships
    const { error: classError } = await supabaseAdmin
      .from('classroom_members')
      .delete()
      .eq('student_id', userId)

    if (classError) {
      return res.status(500).json({ error: `Failed to reset classroom memberships: ${classError.message}` })
    }

    // 3. Reset profile stats
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        xp: 0,
        streak: 0,
        tier: 'Bronze'
      })
      .eq('id', userId)
      .select('*')
      .single()

    if (profileError || !profile) {
      return res.status(500).json({ error: profileError?.message ?? 'Failed to reset profile stats.' })
    }

    clearCache('/api/auth/leaderboard')
    clearCache('/api/problems')

    return res.json({ user: mapProfile(profile as ProfileRow) })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})

// 14. GET /users/:id/profile - View public profile
authRouter.get('/users/:id/profile', async (req, res) => {
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

  const targetUserId = req.params.id

  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found.' })
    }

    // Fetch unique solved count
    const { data: acceptedSubs, error: subsError } = await supabaseAdmin
      .from('submissions')
      .select('problem_id')
      .eq('user_id', targetUserId)
      .eq('verdict', 'Accepted')

    const uniqueSolved = new Set<string>()
    if (!subsError && acceptedSubs) {
      acceptedSubs.forEach((sub: any) => {
        uniqueSolved.add(sub.problem_id)
      })
    }

    // Fetch submissions (recent submissions)
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('id, user_id, problem_id, language, verdict, score, runtime, memory, submitted_at')
      .eq('user_id', targetUserId)
      .order('submitted_at', { ascending: false })
      .limit(10)

    const mappedSubmissions = (submissions || []).map((sub: any) => ({
      id: sub.id,
      userId: sub.user_id,
      problemId: sub.problem_id,
      language: sub.language,
      code: '', // Do not leak actual code unless user is caller or teacher
      verdict: sub.verdict,
      score: sub.score,
      runtime: sub.runtime,
      memory: sub.memory,
      submittedAt: sub.submitted_at
    }))

    // Check caller's role. If caller is admin or teacher or self, they can see the codes
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    const isAuthorized = callerProfile?.role === 'admin' || callerProfile?.role === 'teacher' || userData.user.id === targetUserId

    if (isAuthorized && submissions && submissions.length > 0) {
      // Fetch actual codes
      const { data: codes } = await supabaseAdmin
        .from('submissions')
        .select('id, code')
        .in('id', submissions.map((s: any) => s.id))
      
      if (codes) {
        const codeMap = new Map(codes.map((c: any) => [c.id, c.code]))
        mappedSubmissions.forEach((sub: any) => {
          sub.code = codeMap.get(sub.id) || ''
        })
      }
    }

    return res.json({
      user: mapProfile(profile as ProfileRow),
      solvedCount: uniqueSolved.size,
      submissions: mappedSubmissions
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Server error' })
  }
})
