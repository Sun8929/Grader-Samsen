import type { Submission, Verdict } from '@/types'

/** Mock judge — replace with Judge0 API or Docker sandbox worker */
export async function submitToJudge(
  problemId: string,
  language: string,
  code: string,
): Promise<Partial<Submission>> {
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000))

  const verdicts: Verdict[] = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error']
  const verdict = verdicts[Math.floor(Math.random() * verdicts.length)]!

  return {
    problemId,
    language,
    code,
    verdict,
    runtime: Math.floor(Math.random() * 200) + 10,
    memory: Math.floor(Math.random() * 8192) + 1024,
    submittedAt: new Date().toISOString(),
    score: verdict === 'Accepted' ? 100 : Math.floor(Math.random() * 80),
    testcaseResults: [
      { id: '1', status: verdict === 'Accepted' ? 'Accepted' : 'Accepted', time: 12, memory: 1024, isPublic: true },
      { id: '2', status: verdict, time: 45, memory: 2048, isPublic: true },
      { id: '3', status: verdict, isPublic: false },
    ],
  }
}
