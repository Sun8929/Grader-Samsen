import type {
  Announcement,
  Assignment,
  Classroom,
  LeaderboardEntry,
  Problem,
  Submission,
  User,
} from '@/types'

export const mockUser: User = {
  id: 'u1',
  username: 'alex',
  name: 'Alex Chen',
  email: 'alex@school.edu',
  role: 'student',
  createdAt: '2025-01-15',
  xp: 2450,
  streak: 7,
  tier: 'Silver',
}

export const mockTeacher: User = {
  id: 't1',
  username: 'smith',
  name: 'Dr. Smith',
  email: 'smith@school.edu',
  role: 'teacher',
  createdAt: '2024-08-01',
}

export const mockProblems: Problem[] = []

export const mockClassrooms: Classroom[] = [
  {
    id: 'c1',
    name: 'CS301 — Algorithm Design',
    code: 'ALGO7X2',
    teacherId: 't1',
    studentCount: 42,
    description: 'Advanced algorithms and competitive programming.',
  },
  {
    id: 'c2',
    name: 'CS201 — Data Structures',
    code: 'DS4K9M',
    teacherId: 't1',
    studentCount: 38,
  },
]

export const mockSubmissions: Submission[] = [
  {
    id: 's1',
    userId: 'u1',
    problemId: 'p1',
    language: 'cpp',
    code: '#include <iostream>\nusing namespace std;\nint main() { int a,b; cin>>a>>b; cout<<a+b; }',
    verdict: 'Accepted',
    runtime: 12,
    memory: 1024,
    submittedAt: '2026-05-23T14:30:00Z',
    score: 100,
    testcaseResults: [
      { id: 'tc1', status: 'Accepted', time: 10, memory: 1024, isPublic: true },
      { id: 'tc2', status: 'Accepted', time: 12, memory: 1024, isPublic: true },
      { id: 'tc3', status: 'Accepted', time: 11, memory: 1024, isPublic: false },
    ],
  },
  {
    id: 's2',
    userId: 'u1',
    problemId: 'p2',
    language: 'cpp',
    code: 'void bfs() {}',
    verdict: 'Wrong Answer',
    runtime: 45,
    memory: 8192,
    submittedAt: '2026-05-22T09:15:00Z',
    score: 60,
    testcaseResults: [
      { id: 'tc1', status: 'Accepted', time: 20, memory: 4096, isPublic: true },
      { id: 'tc2', status: 'Wrong Answer', time: 45, memory: 8192, isPublic: true },
      { id: 'tc3', status: 'Wrong Answer', isPublic: false },
    ],
  },
]

export const mockLeaderboard: LeaderboardEntry[] = []

export const mockAnnouncements: Announcement[] = []

export const mockAssignments: Assignment[] = []

export const LANGUAGES = [
  { id: 'c', label: 'C', template: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n' },
  { id: 'cpp', label: 'C++', template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n' },
  { id: 'js', label: 'JavaScript', template: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split("\\n");\n' },
  { id: 'typescript', label: 'TypeScript', template: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split("\\n");\n' },
  { id: 'python', label: 'Python', template: 'import sys\n\ndef main():\n    # code here\n    pass\n\nif __name__ == "__main__":\n    main()\n' },
  { id: 'java', label: 'Java', template: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}\n' },
  { id: 'go', label: 'Go', template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    \n}\n' },
  { id: 'rust', label: 'Rust', template: 'use std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    \n}\n' },
] as const
