import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/PageHeader'
import { VerdictBadge } from '@/components/VerdictBadge'
import { mockProblems, mockSubmissions } from '@/lib/mock-data'
import { useAppStore } from '@/store/useAppStore'
import { useTranslation } from '@/utils/i18n'

const tableVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
}

const rowVariants = {
  hidden: { opacity: 0, y: 5 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
      damping: 15,
    },
  },
}

export default function Submissions() {
  const { user, studentSubmissions, submissions, problems, fetchSubmissions, fetchProblems } = useAppStore()
  const { t, language } = useTranslation()
  const userId = user?.id ?? ''
  const isStudent = user?.role === 'student'

  useEffect(() => {
    fetchSubmissions()
    fetchProblems()
  }, [fetchSubmissions, fetchProblems])

  // Get submissions list
  let submissionsList = submissions.length > 0 ? submissions : []
  if (submissionsList.length === 0) {
    submissionsList = isStudent ? (studentSubmissions[userId] ?? []) : mockSubmissions
  }

  // Combine database problems and mock problems for title resolution
  const allProblems = [...problems, ...mockProblems]

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('nav.submissions')}
        description={language === 'th' ? 'ประวัติการส่งคำตอบและผลลัพธ์เคสการตรวจของคุณ' : 'Your submission history and testcase results.'}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">{language === 'th' ? 'เวลาที่ส่ง' : 'When'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'โจทย์ปัญหา' : 'Problem'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'ภาษา' : 'Lang'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'ผลการตรวจ' : 'Verdict'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'เวลา' : 'Time'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'คะแนน' : 'Score'}</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={tableVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-border"
            >
              {submissionsList.length === 0 ? (
                <motion.tr variants={rowVariants}>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {language === 'th'
                      ? 'ยังไม่มีประวัติการส่งคำตอบ ลองทำโจทย์เพื่อดูประวัติที่นี่'
                      : 'No submissions yet. Solve some coding problems to see your history.'}
                  </td>
                </motion.tr>
              ) : (
                submissionsList.map((s) => {
                  const problem = allProblems.find((p) => p.id === s.problemId)
                  return (
                    <motion.tr 
                      key={s.id} 
                      variants={rowVariants}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(s.submittedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <Link
                          to={`/app/problems/${s.problemId}`}
                          className="text-primary hover:underline"
                        >
                          {problem?.title ?? s.problemId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs uppercase text-muted-foreground">
                        {s.language}
                      </td>
                      <td className="px-6 py-4">
                        <VerdictBadge verdict={s.verdict} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs tabular-nums text-muted-foreground">
                        {s.runtime != null ? `${s.runtime}ms` : '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold tabular-nums">{s.score ?? '—'}</td>
                    </motion.tr>
                  )
                })
              )}
            </motion.tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
