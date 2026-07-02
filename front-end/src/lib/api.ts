import type { User, Classroom, Problem, Submission, Assignment } from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? ''

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at?: number
}

interface AuthResponse {
  user: User
  session: AuthSession | null
}

interface ApiError {
  error: string
}

const SESSION_KEY = 'grader-samsen-session'

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setStoredSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getStoredSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const data = (await response.json()) as T & ApiError

  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed')
  }

  return data
}

export async function register(
  username: string,
  password: string,
  role?: string,
  teacherCode?: string,
): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, role, teacherCode }),
  })

  if (data.session) {
    setStoredSession(data.session)
  }

  return data
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  if (data.session) {
    setStoredSession(data.session)
  }

  return data
}

export async function logout(): Promise<void> {
  try {
    await request<{ success: boolean }>('/api/auth/logout', { method: 'POST' })
  } finally {
    setStoredSession(null)
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const session = getStoredSession()
  if (!session?.access_token) return null

  try {
    const data = await request<{ user: User }>('/api/auth/me')
    return data.user
  } catch {
    setStoredSession(null)
    return null
  }
}

export async function fetchUsers(): Promise<User[]> {
  const data = await request<{ users: User[] }>('/api/auth/users')
  return data.users
}

export async function deleteAccount(): Promise<void> {
  try {
    await request<{ success: boolean }>('/api/auth/delete-account', {
      method: 'DELETE',
    })
  } finally {
    setStoredSession(null)
  }
}

export async function deleteUser(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/auth/users/${id}`, {
    method: 'DELETE',
  })
}

export async function updateUserRole(id: string, role: string): Promise<User> {
  const data = await request<{ user: User }>(`/api/auth/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
  return data.user
}

export interface ImportUserResult {
  total: number
  successCount: number
  failedCount: number
  errors: Array<{ username?: string; error: string }>
  imported: Array<{ id: string; username: string; name: string; role: string }>
}

export async function importUsers(
  users: Array<{ username?: string; name?: string; password?: string; role?: string }>
): Promise<ImportUserResult> {
  return request<ImportUserResult>('/api/auth/import-users', {
    method: 'POST',
    body: JSON.stringify({ users }),
  })
}



export async function fetchClassrooms(): Promise<Classroom[]> {
  const data = await request<{ classrooms: Classroom[] }>('/api/classrooms')
  return data.classrooms
}

export async function createClassroom(name: string, description?: string): Promise<Classroom> {
  const data = await request<{ classroom: Classroom }>('/api/classrooms', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
  return data.classroom
}

export async function joinClassroomByCode(code: string): Promise<Classroom> {
  const data = await request<{ classroom: Classroom }>('/api/classrooms/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  return data.classroom
}

export async function leaveClassroom(classId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/classrooms/${classId}/leave`, {
    method: 'DELETE',
  })
}

export async function deleteClassroom(classId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/classrooms/${classId}`, {
    method: 'DELETE',
  })
}

export async function fetchClassroomMembers(classId: string): Promise<User[]> {
  const data = await request<{ members: User[] }>(`/api/classrooms/${classId}/members`)
  return data.members
}

export interface XPLeaderboardEntry {
  rank: number
  userId: string
  name: string
  username: string
  xp: number
  streak: number
  tier: string
  solvedCount: number
}

export async function fetchLeaderboard(): Promise<XPLeaderboardEntry[]> {
  const data = await request<{ leaderboard: XPLeaderboardEntry[] }>('/api/auth/leaderboard')
  return data.leaderboard
}

export async function fetchProblems(): Promise<Problem[]> {
  const data = await request<{ problems: Problem[] }>('/api/problems')
  return data.problems
}

export async function fetchProblemDetail(id: string): Promise<Problem> {
  const data = await request<{ problem: Problem }>(`/api/problems/${id}`)
  return data.problem
}

export async function createProblem(problemData: Omit<Problem, 'id' | 'solvedCount'>): Promise<Problem> {
  const data = await request<{ problem: Problem }>('/api/problems', {
    method: 'POST',
    body: JSON.stringify(problemData),
  })
  return data.problem
}

export async function submitCodeSolution(problemId: string, language: string, code: string): Promise<Submission> {
  const data = await request<{ submission: Submission }>(`/api/problems/${problemId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ language, code }),
  })
  return data.submission
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const data = await request<{ submissions: Submission[] }>('/api/problems/submissions/all')
  return data.submissions
}

export async function deleteProblem(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/problems/${id}`, {
    method: 'DELETE',
  })
}

export interface EditProblemData extends Omit<Problem, 'id' | 'solvedCount' | 'createdBy'> {
  testcases?: Array<{ input: string; output: string; isPublic: boolean }>
}

export async function updateProblem(id: string, problemData: EditProblemData): Promise<Problem> {
  const data = await request<{ problem: Problem }>(`/api/problems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(problemData),
  })
  return data.problem
}

export async function fetchProblemTestcases(id: string): Promise<Array<{ input: string; output: string; isPublic: boolean }>> {
  const data = await request<{ testcases: Array<{ input: string; output: string; isPublic: boolean }> }>(`/api/problems/${id}/testcases`)
  return data.testcases
}

export async function updateProfile(name?: string, username?: string): Promise<User> {
  const data = await request<{ user: User }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, username }),
  })
  return data.user
}

export async function updatePassword(password: string): Promise<{ success: boolean; message: string }> {
  const data = await request<{ success: boolean; message: string }>('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ password }),
  })
  return data
}

export async function fetchClassroomAssignments(classId: string): Promise<Assignment[]> {
  const data = await request<{ assignments: Assignment[] }>(`/api/assignments/classroom/${classId}`)
  return data.assignments
}

export async function createAssignment(
  classroomId: string,
  title: string,
  description: string,
  dueAt: string,
  problemIds: string[],
): Promise<Assignment> {
  const data = await request<{ assignment: Assignment }>('/api/assignments', {
    method: 'POST',
    body: JSON.stringify({ classroomId, title, description, dueAt, problemIds }),
  })
  return data.assignment
}

export async function deleteAssignment(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/assignments/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchClassroomSubmissions(classId: string): Promise<Submission[]> {
  const data = await request<{ submissions: Submission[] }>(`/api/classrooms/${classId}/submissions`)
  return data.submissions
}

export async function updateProfileAvatar(avatar: string): Promise<User> {
  const data = await request<{ user: User }>('/api/auth/profile/avatar', {
    method: 'PUT',
    body: JSON.stringify({ avatar }),
  })
  return data.user
}

export async function resetProfileProgress(): Promise<User> {
  const data = await request<{ user: User }>('/api/auth/profile/reset', {
    method: 'POST',
  })
  return data.user
}

export interface UserProfileDetails {
  user: User
  solvedCount: number
  submissions: Submission[]
}

export async function fetchUserProfile(userId: string): Promise<UserProfileDetails> {
  return request<UserProfileDetails>(`/api/auth/users/${userId}/profile`)
}

