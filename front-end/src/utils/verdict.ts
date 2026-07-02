import type { Verdict } from '@/types'

export function verdictVariant(verdict: Verdict): 'success' | 'warning' | 'danger' | 'default' {
  if (verdict === 'Accepted') return 'success'
  if (verdict === 'Pending' || verdict === 'Running') return 'warning'
  if (verdict === 'Wrong Answer' || verdict === 'Compilation Error') return 'danger'
  return 'default'
}

export function formatVerdictShort(verdict: Verdict): string {
  const map: Record<Verdict, string> = {
    Accepted: 'AC',
    'Wrong Answer': 'WA',
    'Runtime Error': 'RE',
    'Time Limit Exceeded': 'TLE',
    'Memory Limit Exceeded': 'MLE',
    'Compilation Error': 'CE',
    Pending: '...',
    Running: '...',
  }
  return map[verdict] ?? verdict
}
