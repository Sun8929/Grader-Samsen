import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store/useAppStore'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from '@/utils/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { motion } from 'framer-motion'

interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const loginWithCredentials = useAppStore((s) => s.loginWithCredentials)
  const { user, authReady } = useAppStore()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>()
  const [showPassword, setShowPassword] = useState(false)
  const { t, language } = useTranslation()

  useEffect(() => {
    if (authReady && user) {
      navigate(user.role === 'teacher' || user.role === 'admin' ? '/admin' : '/app')
    }
  }, [authReady, user, navigate])

  const onSubmit = async (data: LoginForm) => {
    try {
      const loggedUser = await loginWithCredentials(data.username, data.password)
      toast.success(language === 'th' ? 'ยินดีต้อนรับกลับมา!' : 'Welcome back!')
      navigate(loggedUser.role === 'teacher' || loggedUser.role === 'admin' ? '/admin' : '/app')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'th' ? 'การเข้าสู่ระบบล้มเหลว' : 'Sign in failed'))
    }
  }

  return (
    <div className="gradient-auth flex min-h-dvh items-center justify-center px-4 py-12 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <motion.div
        key={language}
        initial={{ opacity: 0.6, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-2xl border border-border bg-card/60 backdrop-blur-xl transition-all duration-300">
          <CardHeader className="space-y-4">
            <Link to="/" className="inline-block w-fit rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring hover:opacity-85 transition-opacity">
              <BrandMark />
            </Link>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Samsen Wittayalai School</div>
              <CardTitle className="text-2xl font-bold text-foreground">{t('nav.signIn')}</CardTitle>
              <CardDescription className="mt-1.5 text-muted-foreground">
                {t('auth.signInDesc')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-semibold text-foreground/95">
                  {t('auth.username')}
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder={t('auth.usernamePlaceholder')}
                  className="bg-card text-foreground border-border/80 focus:border-primary transition-all duration-200"
                  {...register('username', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground/95">
                    {t('auth.password')}
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    className="pr-10 bg-card text-foreground border-border/80 focus:border-primary transition-all duration-200"
                    {...register('password', { required: true })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:text-primary transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full text-base font-semibold py-6" disabled={isSubmitting}>
                {isSubmitting ? t('auth.signingIn') : t('nav.signIn')}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline hover:text-primary/90 transition-colors">
                {t('auth.registerLink')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
