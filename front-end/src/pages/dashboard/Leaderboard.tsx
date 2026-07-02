import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Medal, Trophy, Crown, Gem, Sparkles, Flame, Swords, Activity, Award } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import * as api from '@/lib/api'
import { getRankFromXp } from '@/lib/ranks'
import type { XPLeaderboardEntry } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/utils/i18n'

export default function Leaderboard() {
  const currentUser = useAppStore((s) => s.user)
  const { language } = useTranslation()
  const [leaderboard, setLeaderboard] = useState<XPLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'rank' | 'streak' | 'solved'>('rank')

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'streak') {
      return b.streak - a.streak || a.rank - b.rank
    }
    if (sortBy === 'solved') {
      return b.solvedCount - a.solvedCount || a.rank - b.rank
    }
    return a.rank - b.rank
  })

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true)
        const data = await api.fetchLeaderboard()
        setLeaderboard(data)
      } catch {
        // Fallback silently or keep empty
      } finally {
        setLoading(false)
      }
    }
    void loadLeaderboard()
  }, [])

  const rankIcons = {
    Shield,
    Medal,
    Trophy,
    Crown,
    Gem,
    Sparkles,
    Flame,
    Swords,
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title={language === 'th' ? 'ตารางคะแนน' : 'Leaderboard'}
        description={
          language === 'th'
            ? 'ตารางอันดับของนักเรียนทั้งหมดโดยอิงตามคะแนน XP และกิจกรรมการเขียนโค้ด'
            : 'Global student rankings based on earned XP and coding activity.'
        }
      />

      {/* Sorting Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-md border border-border/80 p-4 rounded-xl shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === 'th' ? 'เรียงลำดับตารางตาม' : 'Sort rankings by'}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={sortBy === 'rank' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('rank')}
            className={cn(
              "text-xs font-semibold transition-all duration-200",
              sortBy === 'rank'
                ? "bg-green-600 text-black hover:bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)] border-green-500"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {language === 'th' ? 'อันดับ (XP)' : 'Rank (XP)'}
          </Button>
          <Button
            variant={sortBy === 'streak' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('streak')}
            className={cn(
              "text-xs font-semibold transition-all duration-200",
              sortBy === 'streak'
                ? "bg-green-600 text-black hover:bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)] border-green-500"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {language === 'th' ? 'การเข้าใช้ต่อเนื่อง' : 'Streak'}
          </Button>
          <Button
            variant={sortBy === 'solved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('solved')}
            className={cn(
              "text-xs font-semibold transition-all duration-200",
              sortBy === 'solved'
                ? "bg-green-600 text-black hover:bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)] border-green-500"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {language === 'th' ? 'โจทย์ที่ผ่านแล้ว' : 'Problems Solved'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-200">
        {loading ? (
          <div className="animate-pulse space-y-4 p-6">
            <div className="h-5 w-1/4 bg-muted rounded-md mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-8 bg-muted rounded-md" />
                  <div className="h-6 w-40 bg-muted rounded-md" />
                </div>
                <div className="flex gap-12">
                  <div className="h-6 w-16 bg-muted rounded-md" />
                  <div className="h-6 w-12 bg-muted rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            {language === 'th'
              ? 'ยังไม่มีตารางคะแนนในขณะนี้ เริ่มแก้โจทย์เพื่อสะสม XP ได้เลย!'
              : 'No rankings yet. Start solving problems to rank up!'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="w-20 px-6 py-3.5 text-center">{language === 'th' ? 'อันดับ' : 'Rank'}</th>
                  <th className="px-6 py-3.5">{language === 'th' ? 'ชื่อ' : 'Name'}</th>
                  <th className="px-6 py-3.5">{language === 'th' ? 'ระดับยศ' : 'Tier'}</th>
                  <th className="px-6 py-3.5">{language === 'th' ? 'เข้าใช้ต่อเนื่อง' : 'Streak'}</th>
                  <th className="px-6 py-3.5">{language === 'th' ? 'ผ่านแล้ว' : 'Solved'}</th>
                  <th className="px-6 py-3.5 text-right">{language === 'th' ? 'XP ทั้งหมด' : 'Total XP'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedLeaderboard.map((e, i) => {
                  const isSelf = e.userId === currentUser?.id
                  const { currentRank } = getRankFromXp(e.xp)
                  const RankIcon = rankIcons[currentRank.iconName as keyof typeof rankIcons] || Shield

                  return (
                    <motion.tr
                      key={e.userId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.25, ease: 'easeOut' }}
                      className={cn(
                        'transition-colors hover:bg-muted/40',
                        isSelf && 'bg-accent/40 hover:bg-accent/50 font-medium',
                      )}
                    >
                      <td className="px-6 py-4 text-center font-mono font-bold tabular-nums">
                        {e.rank === 1 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 text-xs">1</span>
                        ) : e.rank === 2 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">2</span>
                        ) : e.rank === 3 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">3</span>
                        ) : (
                          <span className="text-muted-foreground">{e.rank}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/app/profile?userId=${e.userId}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                          >
                            {e.name}
                          </Link>
                          {isSelf && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {language === 'th' ? 'คุณ' : 'You'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">@{e.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                          currentRank.bgColorClass,
                          currentRank.borderColorClass
                        )}>
                          <RankIcon className={cn("h-3.5 w-3.5", currentRank.colorClass)} />
                          <span className={cn("font-medium", currentRank.colorClass)}>
                            {currentRank.label}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono tabular-nums text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5 text-primary/80" />
                          {language === 'th' ? `${e.streak} วัน` : `${e.streak} day${e.streak === 1 ? '' : 's'}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono tabular-nums text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-green-500/80" />
                          {e.solvedCount ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold tabular-nums text-foreground">
                        {e.xp.toLocaleString()} XP
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
