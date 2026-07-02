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

interface RegisterForm {
  username: string
  password: string
  role: 'student' | 'teacher'
  teacherCode?: string
}

export default function Register() {
  const navigate = useNavigate()
  const registerWithCredentials = useAppStore((s) => s.registerWithCredentials)
  const { user, authReady } = useAppStore()
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<RegisterForm>({
    defaultValues: {
      role: 'student',
      teacherCode: '',
    }
  })

  const selectedRole = watch('role')
  const [showPassword, setShowPassword] = useState(false)
  const [showTeacherCode, setShowTeacherCode] = useState(false)
  const { t, language } = useTranslation()

  useEffect(() => {
    if (authReady && user) {
      navigate(user.role === 'teacher' || user.role === 'admin' ? '/admin' : '/app')
    }
  }, [authReady, user, navigate])

  const onSubmit = async (data: RegisterForm) => {
    try {
      const registeredUser = await registerWithCredentials(data.username, data.password, data.role, data.teacherCode)
      toast.success(language === 'th' ? 'สร้างบัญชีสำเร็จแล้ว!' : 'Account created!')
      navigate(registeredUser.role === 'teacher' || registeredUser.role === 'admin' ? '/admin' : '/app')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'th' ? 'การสมัครสมาชิกล้มเหลว' : 'Registration failed'))
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
              <CardTitle className="text-2xl font-bold text-foreground">{t('auth.signUpTitle')}</CardTitle>
              <CardDescription className="mt-1.5 text-muted-foreground">
                {t('auth.signUpDesc')}
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
                <label htmlFor="password" className="text-sm font-semibold text-foreground/95">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    className="pr-10 bg-card text-foreground border-border/80 focus:border-primary transition-all duration-200"
                    {...register('password', { required: true, minLength: 6 })}
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
                <p className="text-xs text-muted-foreground">
                  {language === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : 'At least 6 characters'}
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-semibold text-foreground/95">
                  {language === 'th' ? 'ฉันคือ' : 'I am a'}
                </label>
                <select
                  id="role"
                  {...register('role', { required: true })}
                  className="flex h-11 w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 cursor-pointer"
                >
                  <option value="student">{t('auth.student')}</option>
                  <option value="teacher">{t('auth.teacher')}</option>
                </select>
              </div>
              {selectedRole === 'teacher' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label htmlFor="teacherCode" className="text-sm font-semibold text-foreground/95">
                    {t('auth.teacherCode')}
                  </label>
                  <div className="relative">
                    <Input
                      id="teacherCode"
                      type={showTeacherCode ? 'text' : 'password'}
                      placeholder={t('auth.teacherCodePlaceholder')}
                      className="pr-10 bg-card text-foreground border-border/80 focus:border-primary transition-all duration-200"
                      {...register('teacherCode', { required: selectedRole === 'teacher' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTeacherCode(!showTeacherCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:text-primary transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showTeacherCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'th' ? 'กรุณาสอบถามรหัสยืนยันคุณครูจากผู้ดูแลระบบ' : 'Ask system admin for the teacher code.'}
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full text-base font-semibold py-6" disabled={isSubmitting}>
                {isSubmitting ? t('auth.creatingAccount') : t('auth.signUpTitle')}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline hover:text-primary/90 transition-colors">
                {t('nav.signIn')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
