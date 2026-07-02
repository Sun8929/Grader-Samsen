import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  Code2,
  Trophy,
  Zap,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { SITE_NAME } from '@/lib/brand'
import { useAppStore } from '@/store/useAppStore'
import { GitCommitInfo } from '@/components/GitCommitInfo'
import { useTranslation } from '@/utils/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Typewriter } from '@/components/Typewriter'
import samsenLogo from '@/assets/samsen-logo.png'
import respectImg from '@/assets/respect.webp'

const featureItems = [
  { icon: BookOpen, titleKey: 'landing.features.classroomManagement', descKey: 'landing.features.classroomDesc' },
  { icon: Code2, titleKey: 'landing.features.onlineCompiler', descKey: 'landing.features.onlineDesc' },
  { icon: Trophy, titleKey: 'landing.features.leaderboard', descKey: 'landing.features.leaderboardDesc' },
  { icon: ClipboardList, titleKey: 'landing.features.submissions', descKey: 'landing.features.submissionsDesc' },
  { icon: BarChart3, titleKey: 'landing.features.analytics', descKey: 'landing.features.analyticsDesc' },
  { icon: Zap, titleKey: 'landing.features.fastJudging', descKey: 'landing.features.fastJudgingDesc' },
]

const faqItems = [
  { qKey: 'landing.faqs.q1', aKey: 'landing.faqs.a1' },
  { qKey: 'landing.faqs.q2', aKey: 'landing.faqs.a2' },
  { qKey: 'landing.faqs.q3', aKey: 'landing.faqs.a3' },
]

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
}

export default function Landing() {
  const { user, authReady, isDark, toggleDark } = useAppStore()
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const closePopup = () => {
    setShowPopup(false)
  }
  useEffect(() => {
    if (authReady && user) {
      navigate(user.role === 'teacher' || user.role === 'admin' ? '/admin' : '/app')
    }
  }, [authReady, user, navigate])

  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden">
      {/* Floating glassmorphism glow blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[130px] pointer-events-none z-0" />

      {/* Respect Image Popup Modal for First-time Visitors */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={closePopup}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 360 }}
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              {/* Close Button on top-right */}
              <div className="absolute top-3 right-3 z-20">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePopup}
                  className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content Container */}
              <div className="flex flex-col">
                {/* Image Section - Displays the whole picture */}
                <div className="relative w-full overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={respectImg}
                    alt="Respect"
                    className="w-full h-auto max-h-[65vh] object-contain block"
                  />
                </div>

                {/* Remembrance Text Section */}
                <div className="p-6 text-center space-y-3 bg-card border-t border-border/50">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground tracking-wide leading-relaxed">
                    สถิตในดวงใจตราบนิจนิรันดร์
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    สมเด็จพระเจ้าลูกเธอ เจ้าฟ้าพัชรกิติยาภา นเรนทิราเทพยวดี กรมหลวงราชสาริณีสิริพัชร มหาวัชรราชธิดา
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              {t('nav.features')}
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              {t('nav.faq')}
            </a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDark}
              aria-label={language === 'th' ? 'สลับธีม' : 'Toggle theme'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">{t('nav.signIn')}</Link>
            </Button>
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/register">{t('nav.getStarted')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <motion.div
        key={language}
        initial={{ opacity: 0.6, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <section className="gradient-hero mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <motion.div {...fadeUp} className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
              <p className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                {t('landing.tagline')}
              </p>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl min-h-[2.4em] sm:min-h-[2.2em] lg:min-h-[2.2em]">
                <Typewriter text={t('landing.heroTitle')} />
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl">
                {t('landing.heroSubtitle')}
              </p>
              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
                <Button size="lg" asChild>
                  <Link to="/register">
                    {t('landing.startNow')} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">{t('nav.signIn')}</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 w-full block relative"
            >
              {/* Hybrid Code Editor with School Branding */}
              <div className="relative w-full rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xl shadow-2xl p-3.5 sm:p-5 font-mono text-[10.5px] sm:text-xs text-foreground overflow-hidden">
                {/* Editor Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-border/60 pb-3 mb-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  {/* Active Tab */}
                  <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 border border-border/40 text-[10px] font-semibold text-muted-foreground">
                    <img src={samsenLogo} alt="Samsen icon" className="w-3.5 h-3.5 object-contain shrink-0" />
                    samsen_judge.cpp
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                    C++17
                  </span>
                </div>

                {/* Code text */}
                <pre className="relative z-10 leading-relaxed text-muted-foreground p-1 overflow-hidden select-none">
                  <code>
                    <div>
                      <span className="text-pink-500">#include</span> <span className="text-amber-500">&lt;iostream&gt;</span>
                    </div>
                    <div>
                      <span className="text-pink-500">using namespace</span> <span className="text-sky-500">std</span>;
                    </div>
                    <br />
                    <div>
                      <span className="text-sky-500">int</span> <span className="text-emerald-500">main</span>() &#123;
                    </div>
                    <div className="pl-4">
                      <span className="text-sky-500">cout</span> &lt;&lt; <span className="text-amber-500">"Hello Samsen!\n"</span>;
                    </div>
                    <div className="pl-4">
                      <span className="text-pink-500">return</span> <span className="text-amber-500">0</span>;
                    </div>
                    <div>&#125;</div>
                  </code>
                </pre>

                {/* Console Output Block */}
                <div className="relative z-10 mt-3 sm:mt-4 border-t border-border/60 pt-3 sm:pt-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground mb-2">
                    <span>TERMINAL OUTPUT</span>
                    <span className="text-primary font-bold">COMPILATION SUCCESS</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2.5 sm:p-3 text-[10px] sm:text-[11px] border border-slate-800/80 text-emerald-400 font-mono space-y-1">
                    <div className="text-slate-400">$ g++ samsen_judge.cpp -o main</div>
                    <div className="text-slate-400">$ ./main</div>
                    <div className="text-slate-100 font-semibold">Hello Samsen!</div>
                    <div className="text-xs text-slate-500 pt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      All test cases passed. (0.002s, 1.2MB)
                    </div>
                  </div>
                </div>

                {/* Glowing Watermark Crest Centered in Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                  <img
                    src={samsenLogo}
                    alt="Samsen Logo Watermark"
                    className="w-48 h-48 opacity-[0.08] dark:opacity-[0.05] object-contain filter saturate-50 animate-pulse"
                    style={{ animationDuration: '8s' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('landing.everythingYouNeed')}</h2>
              <p className="mt-2 text-muted-foreground">
                {t('landing.everythingSubtitle')}
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featureItems.map((f, i) => (
                <motion.div
                  key={f.titleKey}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="group h-full rounded-xl border border-border bg-card p-6 shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                      <f.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{t(f.titleKey)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(f.descKey)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">{t('landing.faqs.title')}</h2>
            <dl className="mt-10 grid gap-6 md:grid-cols-2">
              {faqItems.map((f) => (
                <div key={f.qKey} className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <dt className="font-semibold text-foreground text-sm sm:text-base">{t(f.qKey)}</dt>
                  <dd className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{t(f.aKey)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-border bg-primary px-6 py-16 text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-2xl font-semibold">{t('landing.readyToStart')}</h2>
              <p className="mt-2 text-primary-foreground/80">{t('landing.readySubtitle')}</p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                {t('nav.getStarted')} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-border py-12 bg-card/20">
          <div className="mx-auto max-w-6xl px-6 space-y-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <span className="text-sm text-muted-foreground">© 2026 {SITE_NAME}</span>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <Link to="/login" className="transition-colors hover:text-foreground">
                  {t('nav.signIn')}
                </Link>
                <Link to="/app" className="transition-colors hover:text-foreground">
                  {t('nav.dashboard')}
                </Link>
              </div>
            </div>
            <GitCommitInfo />
          </div>
        </footer>
      </motion.div>
    </div>
  )
}
