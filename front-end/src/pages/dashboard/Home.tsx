import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Code2, Trophy, Activity, Shield, Medal, Crown, Gem, Sparkles, Flame, Swords, Moon, Sun, Settings, GitCommit, GitBranch, Loader2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { getRankFromXp } from '@/lib/ranks'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/utils/i18n'
import * as api from '@/lib/api'
import PersonalProgress from '@/components/PersonalProgress'

const Github = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
}

const listVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const listItemVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }

const getRelativeTime = (dateString: string, lang: 'en' | 'th') => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) {
    return lang === 'th' ? 'เมื่อครู่นี้' : 'just now'
  }
  if (diffMins < 60) {
    return lang === 'th' ? `${diffMins} นาทีที่แล้ว` : `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return lang === 'th' ? `${diffHours} ชั่วโมงที่แล้ว` : `${diffHours}h ago`
  }
  if (diffDays === 1) {
    return lang === 'th' ? 'เมื่อวานนี้' : 'yesterday'
  }
  if (diffDays < 30) {
    return lang === 'th' ? `${diffDays} วันที่แล้ว` : `${diffDays}d ago`
  }
  return date.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function DashboardHome() {
  const { user, studentSubmissions, isDark, toggleDark } = useAppStore()
  const userId = user?.id ?? ''
  const isStudent = user?.role === 'student'
  const { t, language } = useTranslation()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' · ' + date.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const [leaderboard, setLeaderboard] = useState<api.XPLeaderboardEntry[]>([])
  const [commits, setCommits] = useState<any[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
  const [loadingCommits, setLoadingCommits] = useState(true)

  const userSubmissions = studentSubmissions[userId] ?? []

  const acceptedSubmissions = userSubmissions.filter((s) => s.verdict === 'Accepted')
  const solvedCount = new Set(acceptedSubmissions.map((s) => s.problemId)).size

  const problemsSolvedText = isStudent ? solvedCount.toString() : '0'

  const userXp = user?.xp ?? 0
  const { currentRank, nextRank, xpToNext } = getRankFromXp(userXp)

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
  const RankIcon = rankIcons[currentRank.iconName as keyof typeof rankIcons] || Shield

  const stats = [
    { 
      label: t('home.stats.solvedProblems'), 
      value: problemsSolvedText, 
      icon: Code2, 
      colorClass: 'text-primary', 
      bgColorClass: 'bg-accent' 
    },
    ...(isStudent
      ? [
          {
            label: t('profile.rankLabel'),
            value: currentRank.label,
            icon: RankIcon,
            colorClass: currentRank.colorClass,
            bgColorClass: currentRank.bgColorClass,
            borderColorClass: currentRank.borderColorClass,
            subtext: nextRank 
              ? language === 'th'
                ? `อีก ${xpToNext} XP จะเลื่อนขั้นเป็น ${nextRank.label}`
                : `${xpToNext} XP to ${nextRank.label}`
              : language === 'th'
                ? 'ยศสูงสุดแล้ว'
                : 'Max tier achieved',
          },
        ]
      : []),
    { 
      label: language === 'th' ? 'ไฟสตรีค' : 'Streak', 
      value: language === 'th' ? `${user?.streak ?? 0} วัน` : `${user?.streak ?? 0} days`, 
      icon: Activity, 
      colorClass: 'text-primary', 
      bgColorClass: 'bg-accent' 
    },
  ]

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoadingLeaderboard(true)
        const data = await api.fetchLeaderboard()
        setLeaderboard(data)
      } catch (err) {
        console.error('Error fetching leaderboard preview:', err)
      } finally {
        setLoadingLeaderboard(false)
      }
    }
    void loadLeaderboard()
  }, [])

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setLoadingCommits(true)
        const response = await fetch('https://api.github.com/repos/Sun8929/Grader-Samsen/commits')
        if (!response.ok) {
          throw new Error('Failed to fetch github commits')
        }
        const data = await response.json()
        const formattedCommits = data.slice(0, 6).map((c: any) => ({
          sha: c.sha,
          shortSha: c.sha.substring(0, 7),
          message: c.commit.message.split('\n')[0],
          authorName: c.commit.author.name,
          authorAvatar: c.author?.avatar_url || '',
          date: c.commit.author.date,
          url: c.html_url
        }))
        setCommits(formattedCommits)
      } catch (err) {
        console.warn('Could not fetch commit history:', err)
        setCommits([])
      } finally {
        setLoadingCommits(false)
      }
    }
    void fetchCommits()
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('home.welcome', { name: user?.name?.split(' ')[0] ?? 'there' })}
        description={language === 'th' ? 'การบ้านและการประกาศกิจกรรมล่าสุดในห้องเรียนของคุณ' : 'Your assignments and recent activity.'}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Date/Time Pill */}
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono tabular-nums">
              {formatDateTime(currentTime)}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDark}
              aria-label={language === 'th' ? 'สลับธีม' : 'Toggle theme'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link to={isStudent ? '/app/settings' : '/admin/settings'} aria-label={t('nav.settings')}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={cn("grid gap-4 sm:grid-cols-2", isStudent ? "lg:grid-cols-3" : "lg:grid-cols-2")}
      >
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              variants={cardVariants}
              whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.15 } }}
            >
              <Card className={cn("h-full transition-shadow duration-200 hover:shadow-md", s.borderColorClass && `border ${s.borderColorClass}`)}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", s.bgColorClass)}>
                    <Icon className={cn("h-5 w-5", s.colorClass)} aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">{s.value}</p>
                    {s.subtext && <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{s.subtext}</p>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">


        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 100, damping: 15 }}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-medium">
                  {t('classes.githubLog')}
                </CardTitle>
              </div>
              <span className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                <GitBranch className="h-3 w-3" /> main
              </span>
            </CardHeader>
            <CardContent className="flex-1 p-6 overflow-y-auto max-h-[300px] scrollbar-thin">
              {loadingCommits ? (
                <div className="flex h-full min-h-[200px] items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : commits.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('classes.noGithubCommits')}
                </p>
              ) : (
                <div className="relative border-l border-border pl-4 ml-2 space-y-6 py-1">
                  {commits.map((commit, index) => (
                    <motion.div
                      key={commit.sha}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      <span className="absolute -left-[25px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                        {commit.authorAvatar ? (
                          <img
                            src={commit.authorAvatar}
                            alt={commit.authorName}
                            className="h-3.5 w-3.5 rounded-full"
                          />
                        ) : (
                          <GitCommit className="h-2.5 w-2.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </span>

                      <div>
                        <span className="text-sm font-medium text-foreground line-clamp-2 block leading-snug">
                          {commit.message}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground/80">{commit.authorName}</span>
                          <span>•</span>
                          <span>{getRelativeTime(commit.date, language as any)}</span>
                          <span>•</span>
                          <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {commit.shortSha}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>



        {isStudent && <div className="lg:col-span-2"><PersonalProgress key={userId} /></div>}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 15 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <CardTitle className="text-sm font-medium">{language === 'th' ? 'ตารางคะแนนย่อ' : 'Leaderboard preview'}</CardTitle>
              <Link to="/app/leaderboard" className="text-xs font-medium text-primary hover:underline">
                {language === 'th' ? 'อันดับทั้งหมด →' : 'Full board →'}
              </Link>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {loadingLeaderboard ? (
                <div className="flex min-h-[150px] items-center justify-center p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">{language === 'th' ? 'ยังไม่มีตารางคะแนน' : 'No rankings yet.'}</p>
              ) : (
                <table className="w-full min-w-[320px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">{language === 'th' ? 'ชื่อ' : 'Name'}</th>
                      <th className="px-6 py-3">{t('problemDetail.scoreLabel')}</th>
                      <th className="px-6 py-3">{language === 'th' ? 'โจทย์ที่ผ่าน' : 'Solved'}</th>
                    </tr>
                  </thead>
                  <motion.tbody 
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    className="divide-y divide-border"
                  >
                    {leaderboard.slice(0, 10).map((e) => (
                      <motion.tr 
                        key={e.userId} 
                        variants={listItemVariants}
                        className={cn(
                          "transition-colors hover:bg-muted/50",
                          e.userId === user?.id && "bg-primary/5 font-semibold"
                        )}
                      >
                        <td className="px-6 py-3 font-mono tabular-nums text-muted-foreground">{e.rank}</td>
                        <td className="px-6 py-3 font-medium flex items-center gap-2">
                          <Link to={`/app/profile?userId=${e.userId}`} className="hover:underline hover:text-primary transition-colors">
                            {e.name}
                          </Link>
                          {e.userId === user?.id && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {language === 'th' ? 'คุณ' : 'You'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 font-mono tabular-nums">{e.xp}</td>
                        <td className="px-6 py-3 tabular-nums">{e.solvedCount}</td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
