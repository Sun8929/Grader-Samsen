export type UserRole = 'student' | 'teacher' | 'admin'

export type Verdict =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Compilation Error'
  | 'Pending'
  | 'Running'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  xp?: number
  streak?: number
  tier?: string
  password?: string
  avatarUrl?: string
}

export interface Problem {
  id: string
  title: string
  statement: string
  difficulty: Difficulty
  timeLimit: number
  memoryLimit: number
  createdBy: string
  tags?: string[]
  solvedCount?: number
  classId?: string
  pdfUrl?: string
  xp?: number
}

export interface Testcase {
  id: string
  problemId: string
  input: string
  expectedOutput: string
  isHidden: boolean
  points?: number
}

export interface Submission {
  id: string
  userId: string
  userName?: string
  problemId: string
  language: string
  code: string
  verdict: Verdict
  runtime?: number
  memory?: number
  submittedAt: string
  score?: number
  testcaseResults?: TestcaseResult[]
  plagiarismScore?: number
  isPlagiarized?: boolean
}

export interface TestcaseResult {
  id: string
  status: Verdict
  time?: number
  memory?: number
  isPublic: boolean
}

export interface Classroom {
  id: string
  name: string
  code: string
  teacherId: string
  teacherName?: string
  studentCount: number
  description?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  classId: string
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  score: number
  penalty: number
  solved: number
}

export interface Assignment {
  id: string
  title: string
  className: string
  dueAt: string
  problemIds: string[]
}
