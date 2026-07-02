import { useAppStore } from '@/store/useAppStore'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useState } from 'react'
import * as authApi from '@/lib/api'
import { useTranslation } from '@/utils/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Upload } from 'lucide-react'

export default function Settings() {
  const { isDark, toggleDark, user, setUser, logout, deleteAccount, resetStudentData, themeColor, setThemeColor, animationsEnabled, toggleAnimations } = useAppStore()
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const { t, language } = useTranslation()

  // Profile Edit State
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(language === 'th' ? 'ขนาดรูปภาพต้องน้อยกว่า 2MB' : 'Image size must be less than 2MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string
          const updatedUser = await authApi.updateProfileAvatar(base64)
          setUser(updatedUser)
          toast.success(language === 'th' ? 'อัปเดตรูปโปรไฟล์สำเร็จแล้ว!' : 'Avatar updated successfully!')
        } catch (err: any) {
          toast.error(err.message || (language === 'th' ? 'อัปเดตรูปโปรไฟล์ล้มเหลว' : 'Failed to update avatar.'))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      const updatedUser = await authApi.updateProfileAvatar('')
      setUser(updatedUser)
      toast.success(language === 'th' ? 'ลบรูปโปรไฟล์แล้ว' : 'Avatar removed successfully!')
    } catch (err: any) {
      toast.error(err.message || (language === 'th' ? 'ลบรูปโปรไฟล์ล้มเหลว' : 'Failed to remove avatar.'))
    }
  }

  // Password Edit State
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const isStudent = user?.role === 'student'

  const handleLogout = async () => {
    try {
      await logout()
      toast.success(language === 'th' ? 'ออกจากระบบสำเร็จแล้ว' : 'Logged out successfully')
      navigate('/login')
    } catch {
      toast.error(language === 'th' ? 'ออกจากระบบล้มเหลว' : 'Logout failed')
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !username.trim()) {
      toast.error(language === 'th' ? 'กรุณากรอกชื่อและชื่อผู้ใช้' : 'Name and Username are required.')
      return
    }

    setIsSavingProfile(true)
    try {
      const updatedUser = await authApi.updateProfile(name, username)
      setUser(updatedUser)
      toast.success(language === 'th' ? 'อัปเดตโปรไฟล์สำเร็จแล้ว!' : 'Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message || (language === 'th' ? 'การอัปเดตโปรไฟล์ล้มเหลว' : 'Failed to update profile.'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast.error(language === 'th' ? 'กรุณากรอกรหัสผ่านใหม่' : 'Please enter a new password.')
      return
    }

    if (password.length < 6) {
      toast.error(language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      toast.error(language === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match.')
      return
    }

    setIsUpdatingPassword(true)
    try {
      await authApi.updatePassword(password)
      toast.success(language === 'th' ? 'อัปเดตรหัสผ่านสำเร็จแล้ว!' : 'Password updated successfully!')
      setPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || (language === 'th' ? 'การอัปเดตรหัสผ่านล้มเหลว' : 'Failed to update password.'))
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      language === 'th'
        ? 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้อย่างถาวร? การดำเนินการนี้ไม่สามารถย้อนกลับได้'
        : 'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.',
    )
    if (!confirm) return

    setIsDeleting(true)
    try {
      await deleteAccount()
      toast.success(language === 'th' ? 'ลบบัญชีผู้ใช้สำเร็จแล้ว' : 'Account successfully deleted.')
      navigate('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'th' ? 'การลบบัญชีผู้ใช้ล้มเหลว' : 'Failed to delete account'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetProgress = () => {
    const confirm = window.confirm(
      language === 'th'
        ? 'คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการสมัครชั้นเรียนและประวัติการส่งทั้งหมดของคุณ? การดำเนินการนี้ไม่สามารถย้อนกลับได้'
        : 'Are you sure you want to reset all your classroom enrollments and submission history? This action is permanent and cannot be undone.',
    )
    if (confirm && user?.id) {
      resetStudentData(user.id)
      toast.success(language === 'th' ? 'ล้างข้อมูลชั้นเรียนและประวัติการส่งสำเร็จแล้ว' : 'Your classrooms and submissions have been successfully reset.')
    }
  }

  return (
    <div className="max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{language === 'th' ? 'รายละเอียดโปรไฟล์' : 'Profile Details'}</CardTitle>
          <CardDescription>
            {language === 'th' ? 'อัปเดตชื่อแสดงผล ชื่อผู้ใช้ และรูปโปรไฟล์ของคุณ' : 'Update your display name, unique handle, and profile picture.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-border">
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary/40 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-extrabold text-primary border-2 border-primary/20">
                  {(user?.name ?? 'G').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {language === 'th' ? 'รูปโปรไฟล์' : 'Profile Picture'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all">
                  <Upload className="h-3.5 w-3.5" />
                  {language === 'th' ? 'อัปโหลดรูปภาพ' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
                {user?.avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs border-destructive/20 hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive transition-colors h-[30px]"
                    onClick={handleRemoveAvatar}
                  >
                    {language === 'th' ? 'ลบรูปภาพ' : 'Remove Image'}
                  </Button>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {language === 'th' ? 'รองรับไฟล์รูปภาพ ขนาดไม่เกิน 2MB' : 'Supports images up to 2MB.'}
              </span>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{language === 'th' ? 'ชื่อแสดงผล' : 'Full Name'}</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'th' ? 'กรอกชื่อแสดงผล' : 'Enter display name'}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('auth.username')}</label>
              <Input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder')}
              />
            </div>
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile
                ? language === 'th' ? 'กำลังบันทึก...' : 'Saving Changes…'
                : language === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}</CardTitle>
          <CardDescription>
            {language === 'th' ? 'ตั้งค่าความปลอดภัยรหัสผ่านใหม่สำหรับบัญชีของคุณ' : 'Reset or configure a secure new password for your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{language === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : 'At least 6 characters'}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{language === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}</label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === 'th' ? 'กรอกรหัสผ่านซ้ำอีกครั้ง' : 'Repeat password'}
              />
            </div>
            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword
                ? language === 'th' ? 'กำลังอัปเดตรหัสผ่าน...' : 'Updating Password…'
                : language === 'th' ? 'อัปเดตรหัสผ่าน' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance & Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.appearance')}</CardTitle>
          <CardDescription>{language === 'th' ? 'จัดการภาษาและการแสดงผลของเว็บไซต์' : 'Dark mode and language preferences.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{t('settings.language')}</label>
            <span className="text-xs text-muted-foreground mb-1">{t('settings.languageDesc')}</span>
            <div className="w-fit">
              <LanguageSwitcher />
            </div>
            {language === 'th' && (
              <p className="mt-1 text-xs text-primary font-medium">
                * {t('settings.thaiFontLabel')} ({t('settings.thaiFontDesc')})
              </p>
            )}
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{language === 'th' ? 'โทนสีหลัก' : 'Color Grading Theme'}</label>
            <span className="text-xs text-muted-foreground mb-2">
              {language === 'th' ? 'เลือกสีหลักและสีเรืองแสงของระบบตามต้องการ' : 'Select a primary color scheme and ambient glow styling.'}
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'emerald', label: language === 'th' ? 'มรกต (เขียว)' : 'Emerald (Green)', color: 'bg-emerald-500' },
                { id: 'sapphire', label: language === 'th' ? 'ไพลิน (น้ำเงิน)' : 'Sapphire (Blue)', color: 'bg-blue-500' },
                { id: 'amethyst', label: language === 'th' ? 'อเมทิสต์ (ม่วง)' : 'Amethyst (Purple)', color: 'bg-violet-500' },
                { id: 'ruby', label: language === 'th' ? 'ทับทิม (ชมพู)' : 'Ruby (Pink)', color: 'bg-pink-500' },
                { id: 'amber', label: language === 'th' ? 'อำพัน (ทอง)' : 'Amber (Gold)', color: 'bg-amber-500' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeColor(theme.id as any)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-300 ${
                    themeColor === theme.id
                      ? 'border-primary bg-primary/10 text-primary scale-105 shadow-sm'
                      : 'border-border bg-card/40 hover:bg-card/80 text-muted-foreground'
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${theme.color} ring-1 ring-white/20`} />
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{t('settings.theme')}</label>
            <span className="text-xs text-muted-foreground mb-2">{t('settings.themeDesc')}</span>
            <Button variant="outline" onClick={toggleDark} className="w-fit">
              {isDark ? t('settings.lightMode') : t('settings.darkMode')}
            </Button>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{language === 'th' ? 'แอนิเมชันระบบ' : 'System Animations'}</label>
            <span className="text-xs text-muted-foreground mb-2">
              {language === 'th' ? 'เปิด/ปิดเอฟเฟกต์การเปลี่ยนผ่านและแอนิเมชันทั้งหมด' : 'Toggle page transitions and tab animations.'}
            </span>
            <Button variant="outline" onClick={toggleAnimations} className="w-fit">
              {animationsEnabled 
                ? (language === 'th' ? 'เปิดใช้งาน (เปิด)' : 'Enabled (On)')
                : (language === 'th' ? 'ปิดใช้งาน (ปิด)' : 'Disabled (Off)')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{language === 'th' ? 'การดำเนินการกับบัญชี' : 'Account Actions'}</CardTitle>
          <CardDescription>{language === 'th' ? 'จัดการเซสชันและบัญชีผู้ใช้งานของคุณ' : 'Manage your credentials and login session.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{language === 'th' ? 'ชื่อผู้ใช้ปัจจุบัน' : 'Active Username'}</span>
            <span className="text-sm font-semibold">@{user?.username}</span>
            <span className="mt-1 text-xs text-muted-foreground">{t('auth.role')}: {user?.role === 'teacher' ? t('auth.teacher') : t('auth.student')}</span>
          </div>

          {isStudent && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">{language === 'th' ? 'ล้างความคืบหน้าของนักเรียน' : 'Reset student progress'}</h4>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300/90">
                {language === 'th' ? 'ล้างประวัติการเข้าร่วมชั้นเรียน การบ้าน โจทย์ปัญหาที่ผ่าน และประวัติการส่งทั้งหมดของคุณ' : 'Reset classroom enrollments, assignments, solved problems, and submissions.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetProgress}
                className="mt-1 border-amber-300 text-amber-900 hover:bg-amber-100/80 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/50"
              >
                {language === 'th' ? 'ล้างความคืบหน้า' : 'Reset progress'}
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button variant="outline" onClick={handleLogout} className="sm:flex-1">
              {t('nav.logout')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="sm:flex-1"
            >
              {isDeleting ? (language === 'th' ? 'กำลังลบ...' : 'Deleting…') : t('settings.deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
