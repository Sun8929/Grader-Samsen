import type { Submission } from '../types/index'

export function solvedProblems(submissions: Pick<Submission, 'problemId' | 'verdict'>[]) {
  return new Set(submissions.filter(s => s.verdict === 'Accepted').map(s => s.problemId))
}
