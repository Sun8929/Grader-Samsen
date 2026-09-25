import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Code2,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  MoreHorizontal,
  Settings,
  Sun,
  Trophy,
  User,
  Users,
  BarChart3,
  FileCode,
  Shield,
  Medal,
  Crown,
  Gem,
  Sparkles,
  Flame,
  Swords,
  Check,
  ChevronLeft,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { getRankFromXp, XP_RANKS } from '@/lib/ranks'

import { useTranslation } from '@/utils/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const studentNav = [
  { nameKey: 'nav.home', path: '/app', icon: Home, end: true },
  { nameKey: 'nav.classes', path: '/app/classes', icon: BookOpen },
  { nameKey: 'nav.problems', path: '/app/problems', icon: Code2 },
  { nameKey: 'nav.submissions', path: '/app/submissions', icon: History },
  { nameKey: 'nav.leaderboard', path: '/app/leaderboard', icon: Trophy },
  { nameKey: 'nav.profile', path: '/app/profile', icon: User },
]

const teacherNav = [
  { nameKey: 'nav.dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { nameKey: 'nav.classrooms', path: '/admin/classrooms', icon: BookOpen },
  { nameKey: 'nav.problems', path: '/admin/problems', icon: FileCode },
  { nameKey: 'nav.users', path: '/admin/users', icon: Users },
  { nameKey: 'nav.analytics', path: '/admin/analytics', icon: BarChart3 },
]

const mobileStudentNav = [
  { nameKey: 'nav.home', path: '/app', icon: Home, end: true },
  { nameKey: 'nav.problems', path: '/app/problems', icon: Code2 },
  { nameKey: 'nav.submissions', path: '/app/submissions', icon: History },
  { nameKey: 'nav.leaderboard', path: '/app/leaderboard', icon: Trophy },
  { nameKey: 'nav.more', path: '/app/profile', icon: MoreHorizontal },
]

const mobileTeacherNav = [
  { nameKey: 'nav.home', path: '/admin', icon: LayoutDashboard, end: true },
  { nameKey: 'nav.classrooms', path: '/admin/classrooms', icon: BookOpen },
  { nameKey: 'nav.problems', path: '/admin/problems', icon: FileCode },
  { nameKey: 'nav.users', path: '/admin/users', icon: Users },
  { nameKey: 'nav.more', path: '/admin/analytics', icon: MoreHorizontal },
]

const sidebarTransition = { type: 'spring' as const, stiffness: 280, damping: 28, mass: 0.85 }

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: { nameKey: string; path: string; icon: any; end?: boolean }
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon
  const { t } = useTranslation()
  return (
    <Link
      to={item.path}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active
          ? 'text-primary font-semibold'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
      title={collapsed ? t(item.nameKey) : ''}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 shadow-xs"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="nav-active-indicator"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          'relative z-10 h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
          active ? 'text-primary drop-shadow-[0_0_6px_var(--color-primary-glow)]' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      <AnimatePresence initial={false} mode="sync">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 truncate whitespace-nowrap overflow-hidden origin-left"
          >
            {t(item.nameKey)}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

export default function DashboardLayout({ admin = false }: { admin?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, authReady, isDark, toggleDark, logout, animationsEnabled } = useAppStore()
  const [showRankDialog, setShowRankDialog] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
  const { t, language } = useTranslation()

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const isStudent = user?.role === 'student'
  const navItems = admin
    ? teacherNav
    : (!isStudent && user
        ? [{ nameKey: 'nav.adminPortal', path: '/admin', icon: LayoutDashboard }, ...studentNav]
        : studentNav)

  const mobileNav = admin
    ? mobileTeacherNav
    : (!isStudent && user
        ? [{ nameKey: 'nav.dashboard', path: '/admin', icon: LayoutDashboard }, ...mobileStudentNav.slice(0, 4)]
        : mobileStudentNav)

  const base = admin ? '/admin' : '/app'

  useEffect(() => {
    if (authReady) {
      if (!user) {
        navigate('/login')
      } else {
        if (admin && user.role === 'student') {
          navigate('/app')
        }
      }
    }
  }, [authReady, user, admin, navigate])

  const isActive = (item: { nameKey: string; path: string; icon: any; end?: boolean }) =>
    item.end
      ? location.pathname === item.path
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/')

  const userXp = user?.xp ?? 0
  const { currentRank, nextRank, progressPercent } = getRankFromXp(userXp)

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

  if (!authReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }


  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden">
      {/* Floating glassmorphism glow blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] pointer-events-none z-0 transition-colors duration-500" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0 transition-colors duration-500" />

      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 248 }}
        transition={sidebarTransition}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card/90 shadow-sm lg:flex backdrop-blur-xl"
      >
        <div className="flex h-16 items-center border-b border-border px-4 overflow-hidden">
          <Link
            to="/"
            className="flex items-center justify-start rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring group"
          >
            <BrandMark hideText={isCollapsed} />
          </Link>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3 scrollbar-none" aria-label={language === 'th' ? 'เมนูนำทางหลัก' : 'Main navigation'}>
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} active={isActive(item)} collapsed={isCollapsed} />
          ))}
        </nav>
        <div className="border-t border-border p-3.5">
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="truncate rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground overflow-hidden border border-border/40"
              >
                <span className="font-semibold text-foreground block truncate">{user?.name ?? (language === 'th' ? 'ผู้เข้าชม' : 'Guest')}</span>
                {user?.username && <span className="block truncate text-[11px] opacity-75">@{user.username}</span>}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div layout className={cn("gap-1 items-center justify-center", isCollapsed ? "grid grid-cols-2" : "flex")}>
            <LanguageSwitcher variant="ghost" className="hover:scale-105 active:scale-95 transition-transform" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDark}
              aria-label={language === 'th' ? 'สลับธีม' : 'Toggle theme'}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" asChild className="hover:scale-105 active:scale-95 transition-transform">
              <Link to={`${base}/settings`} aria-label={t('nav.settings')}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
              aria-label={t('nav.logout')}
              className="hover:scale-105 active:scale-95 transition-transform text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="m-2.5 rounded-full border border-border/70 bg-card/80 hover:bg-card hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer self-center"
          aria-label={isCollapsed ? (language === 'th' ? 'ขยายแถบข้าง' : 'Expand sidebar') : (language === 'th' ? 'ย่อแถบข้าง' : 'Collapse sidebar')}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </Button>
      </motion.aside>

      <motion.div
        initial={false}
        animate={{ paddingLeft: isDesktop ? (isCollapsed ? 76 : 248) : 0 }}
        transition={sidebarTransition}
        className="min-h-dvh flex flex-col"
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-card/70 sm:px-8">
          <Link to="/" className="lg:hidden">
            <BrandMark />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {isStudent && (
              <button
                onClick={() => setShowRankDialog(true)}
                className={cn(
                  "hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex border transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer",
                  currentRank.bgColorClass,
                  currentRank.borderColorClass
                )}
              >
                <RankIcon className={cn("h-3.5 w-3.5", currentRank.colorClass)} />
                <span className={cn("font-semibold", currentRank.colorClass)}>
                  {currentRank.label} · <span className="font-mono tabular-nums">{userXp} XP</span>
                </span>
              </button>
            )}

            <Button variant="ghost" size="icon" asChild className="lg:hidden h-9 w-9">
              <Link to={`${base}/settings`} aria-label={t('nav.settings')}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>

            <Link
              to={isStudent ? '/app/profile' : `${base}/settings`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden border border-border/10"
              aria-label={t('nav.profile')}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                (user?.name ?? 'S').charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </header>

        <motion.main
          key={location.pathname + '_' + language}
          initial={animationsEnabled ? { opacity: 0, y: 6 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: animationsEnabled ? 0.2 : 0, ease: [0.16, 1, 0.3, 1] }}
          className={/^\/app\/problems\/[^/]+\/?$/.test(location.pathname)
            ? 'mx-auto w-full max-w-none p-4 pb-24 sm:p-6 lg:pb-10'
            : 'mx-auto max-w-7xl p-6 pb-24 sm:p-8 lg:pb-10 lg:p-10'}
        >
          <Outlet />
        </motion.main>
      </motion.div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
        aria-label={language === 'th' ? 'เมนูนำทางมือถือ' : 'Mobile navigation'}
      >
        {mobileNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{t(item.nameKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Rank System Modal */}
      <AnimatePresence>
        {showRankDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRankDialog(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={animationsEnabled ? { opacity: 0, scale: 0.95, y: 15 } : { opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={animationsEnabled ? { opacity: 0, scale: 0.95, y: 15 } : { opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl z-10 space-y-4 scrollbar-none"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {language === 'th' ? 'Grader-Samsen Rank' : 'Grader-Samsen Rank'}
                </h3>
                <button
                  onClick={() => setShowRankDialog(false)}
                  className="rounded-lg p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <span className="text-sm font-bold px-1.5">✕</span>
                </button>
              </div>

              <div className="relative pl-6 py-2 space-y-5 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
                {XP_RANKS.map((rank, index) => {
                  const isCurrent = currentRank.id === rank.id
                  const isAchieved = userXp >= rank.minXp
                  const Icon = rankIcons[rank.iconName as keyof typeof rankIcons] || Shield

                  return (
                    <motion.div
                      key={rank.id}
                      initial={animationsEnabled ? { opacity: 0, x: -15 } : {}}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="relative flex gap-4"
                    >
                      <span className={cn(
                        "absolute -left-[22px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-card transition-all z-10",
                        isCurrent ? "border-primary ring-4 ring-primary/20 bg-primary" :
                        isAchieved ? "border-primary bg-primary/70" : "border-muted-foreground/35 bg-card"
                      )}>
                        {isAchieved && !isCurrent && <Check className="h-2 w-2 text-white" />}
                      </span>

                      <div
                        className={cn(
                          "flex-1 p-3.5 rounded-xl border transition-all",
                          isCurrent
                            ? "border-primary bg-primary/5 shadow-sm scale-[1.01]"
                            : isAchieved
                              ? "border-border bg-card/65 opacity-90"
                              : "border-border/40 bg-card/30 opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg border",
                              rank.bgColorClass,
                              rank.borderColorClass
                            )}>
                              <Icon className={cn("h-4.5 w-4.5", rank.colorClass)} />
                            </span>
                            <div>
                              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                {rank.label}
                                {isCurrent && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/20 animate-pulse">
                                    {language === 'th' ? 'ยศปัจจุบัน' : 'Current'}
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-medium">
                                {rank.maxXp
                                  ? `${rank.minXp.toLocaleString()} - ${rank.maxXp.toLocaleString()} XP`
                                  : `${rank.minXp.toLocaleString()}+ XP`}
                              </p>
                            </div>
                          </div>

                          {isCurrent && (
                            <span className="text-xs text-muted-foreground font-bold font-mono">
                              {userXp.toLocaleString()} XP
                            </span>
                          )}
                        </div>

                        {isCurrent && nextRank && (
                          <div className="mt-3.5 space-y-1.5 border-t border-dashed border-border/80 pt-2.5">
                            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                              <span>{language === 'th' ? `ความคืบหน้าถึงยศถัดไป (${nextRank.label})` : `Progress to ${nextRank.label}`}</span>
                              <span>{progressPercent.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={animationsEnabled ? { width: 0 } : { width: `${progressPercent}%` }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="h-full bg-primary"
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground/80 font-medium">
                              {language === 'th'
                                ? `ต้องการอีก ${(nextRank.minXp - userXp).toLocaleString()} XP เพื่อเลื่อนยศ`
                                : `Need ${(nextRank.minXp - userXp).toLocaleString()} more XP to rank up`}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => setShowRankDialog(false)} size="sm">
                  {language === 'th' ? 'ปิดหน้านี้' : 'Close'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
