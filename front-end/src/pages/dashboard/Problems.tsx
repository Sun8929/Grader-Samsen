import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import { useTranslation } from '@/utils/i18n'

const difficultyStyle = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
} as const

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

export default function Problems() {
  const fetchProblems = useAppStore((s) => s.fetchProblems)
  const dbProblems = useAppStore((s) => s.problems)
  const [search, setSearch] = useState('')
  const { t, language } = useTranslation()

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  // Show database-created problems filtered by search query
  const displayProblems = dbProblems.filter((p) => {
    const term = search.toLowerCase()
    return (
      p.title.toLowerCase().includes(term) ||
      p.tags?.some((t) => t.toLowerCase().includes(term))
    )
  })

  const getDifficultyLabel = (diff: 'easy' | 'medium' | 'hard') => {
    if (diff === 'easy') return t('problems.easy')
    if (diff === 'medium') return t('problems.medium')
    if (diff === 'hard') return t('problems.hard')
    return diff
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('problems.title')}
        description={language === 'th' ? 'เรียกดูและแก้ไขโจทย์ปัญหาจากวิชาเรียนของคุณ' : 'Browse and solve problems from your classes.'}
      />

      {/* Filter and search bar */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            placeholder={language === 'th' ? 'ค้นหาโจทย์ตามชื่อหรือแท็ก...' : 'Search problems by title or tag...'}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">{t('problems.table.title')}</th>
                <th className="px-6 py-3">{t('problems.table.difficulty')}</th>
                <th className="px-6 py-3">{language === 'th' ? 'รางวัล XP' : 'XP Reward'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'จำนวนคนผ่าน' : 'Solved'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'ขีดจำกัด' : 'Limit'}</th>
              </tr>
            </thead>
            <motion.tbody 
              key={search}
              variants={tableVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-border"
            >
              {displayProblems.map((p, i) => (
                <motion.tr 
                  key={p.id} 
                  variants={rowVariants}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-4 font-mono tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/app/problems/${p.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.tags?.map((t) => (
                        <span key={t} className="text-[10px] font-semibold tracking-wide text-green-400 bg-green-950/20 border border-green-900/30 px-1.5 py-0.5 rounded uppercase">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={difficultyStyle[p.difficulty]} className="capitalize">
                      {getDifficultyLabel(p.difficulty)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-green-500">
                    +{p.xp || 0} XP
                  </td>
                  <td className="px-6 py-4 tabular-nums text-muted-foreground">{p.solvedCount}</td>
                  <td className="px-6 py-4 font-mono text-xs tabular-nums text-muted-foreground">
                    {p.timeLimit}ms / {p.memoryLimit}MB
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
