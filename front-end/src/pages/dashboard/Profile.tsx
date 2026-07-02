import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { 
  Shield, Medal, Trophy, Crown, Gem, Sparkles, Flame, Swords, Camera, Trash2, ArrowLeft, 
  Calendar, Award
} from 'lucide-react'
import { getRankFromXp } from '@/lib/ranks'
import { cn } from '@/lib/utils'
import { useSearchParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as authApi from '@/lib/api'
import { toast } from 'sonner'
import type { User, Submission } from '@/types'
import { useTranslation } from '@/utils/i18n'

const badges = ['First AC', 'Week Streak', 'Top 10', 'Graph Master']

export default function Profile() {
  const [searchParams] = useSearchParams()
  const queryUserId = searchParams.get('userId')
  const { language } = useTranslation()
  
  const currentUser = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const resetStudentData = useAppStore((s) => s.resetStudentData)
  const problems = useAppStore((s) => s.problems)
  const fetchProblems = useAppStore((s) => s.fetchProblems)

  const [targetProfile, setTargetProfile] = useState<{
    user: User
    solvedCount: number
    submissions: Submission[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveUserId = queryUserId || currentUser?.id
  const isOwnProfile = !queryUserId || queryUserId === currentUser?.id

  // Fetch target profile details
  const loadProfile = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const details = await authApi.fetchUserProfile(id)
      setTargetProfile(details)
    } catch (err: any) {
      console.error(err)
      setError(err.message || (language === 'th' ? 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้' : 'Failed to load profile details.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (effectiveUserId) {
      void loadProfile(effectiveUserId)
    }
    if (problems.length === 0) {
      void fetchProblems()
    }
  }, [effectiveUserId])

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
          
          if (targetProfile) {
            setTargetProfile({
              ...targetProfile,
              user: updatedUser
            })
          }
          toast.success(language === 'th' ? 'อัปเดตรูปโปรไฟล์สำเร็จแล้ว!' : 'Avatar updated successfully!')
        } catch (err: any) {
          toast.error(err.message || (language === 'th' ? 'อัปเดตรูปโปรไฟล์ล้มเหลว' : 'Failed to update avatar.'))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleResetProgress = async () => {
    const confirmMessage = language === 'th'
      ? "คุณแน่ใจหรือไม่ที่จะรีเซ็ตความคืบหน้า? การดำเนินการนี้จะลบการส่งโค้ดทั้งหมดและการเป็นสมาชิกในห้องเรียนของคุณอย่างถาวร พร้อมทั้งรีเซ็ต XP และสถิติการเข้าใช้งานของคุณให้เป็น 0 ซึ่งไม่สามารถยกเลิกได้ในภายหลัง"
      : "Are you sure you want to reset your progress? This will permanently delete ALL your submissions, classroom memberships, and reset your XP/streak to 0. This action CANNOT be undone."
    
    if (!window.confirm(confirmMessage)) {
      return
    }
    try {
      const updatedUser = await authApi.resetProfileProgress()
      setUser(updatedUser)
      if (updatedUser.id) {
        resetStudentData(updatedUser.id)
      }
      if (effectiveUserId) {
        await loadProfile(effectiveUserId)
      }
      toast.success(language === 'th' ? 'รีเซ็ตความคืบหน้าสำเร็จแล้ว!' : 'Progress reset successfully!')
    } catch (err: any) {
      toast.error(err.message || (language === 'th' ? 'รีเซ็ตความคืบหน้าล้มเหลว' : 'Failed to reset progress.'))
    }
  }

  const profileUser = targetProfile?.user || currentUser
  if (!profileUser) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        {language === 'th' ? 'กำลังโหลดโปรไฟล์...' : 'Loading profile...'}
      </div>
    )
  }

  const isStudent = profileUser.role === 'student'
  const userXp = profileUser.xp ?? 0
  const { currentRank, nextRank, xpToNext, progressPercent } = getRankFromXp(userXp)

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'th' ? 'th-TH' : undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }



  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isOwnProfile && (
            <Button variant="ghost" size="icon" asChild className="hover:bg-accent">
              <Link to="/app/leaderboard">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
            </Button>
          )}
          <PageHeader 
            title={
              isOwnProfile 
                ? (language === 'th' ? "โปรไฟล์ของฉัน" : "My Profile") 
                : (language === 'th' ? `โปรไฟล์ของ ${profileUser.name}` : `${profileUser.name}'s Profile`)
            } 
            description={
              isStudent 
                ? (language === 'th' ? "XP, เหรียญรางวัล และภาพรวมบัญชี" : "XP, badges, and account overview.") 
                : (language === 'th' ? "ภาพรวมบัญชีและการตั้งค่า" : "Account overview and settings.")
            } 
          />
        </div>
        {isOwnProfile && isStudent && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleResetProgress}
            className="gap-2 shadow-sm shadow-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            {language === 'th' ? 'รีเซ็ตความคืบหน้า' : 'Reset Progress'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <Card className="overflow-hidden border border-border/80">
            <div className="h-28 bg-muted/40" />
            <div className="p-6 pt-0 -mt-12 flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="h-24 w-24 rounded-full bg-muted border-4 border-card shadow-sm" />
              <div className="space-y-2 flex-1 pb-2">
                <div className="h-6 w-48 bg-muted rounded-md mx-auto sm:mx-0" />
                <div className="h-4 w-32 bg-muted rounded-md mx-auto sm:mx-0" />
              </div>
            </div>
            <div className="border-t border-border p-6 bg-card">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 bg-muted/25 border border-border/50 rounded-xl space-y-2">
                    <div className="h-3.5 w-16 bg-muted rounded-md" />
                    <div className="h-6 w-12 bg-muted rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      ) : error ? (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive p-6">
          <p className="font-semibold">{language === 'th' ? 'เกิดข้อผิดพลาดในการโหลดโปรไฟล์' : 'Error Loading Profile'}</p>
          <p className="text-sm mt-1">{error}</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden border border-border/80 shadow-sm transition-all duration-300 hover:border-border/100">
            <CardHeader className="bg-gradient-to-b from-muted/30 to-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {profileUser.avatarUrl ? (
                      <img 
                        src={profileUser.avatarUrl} 
                        alt={profileUser.name} 
                        className="h-20 w-20 rounded-full object-cover border-2 border-primary/50 shadow-md shadow-primary/10 transition-all duration-300 group-hover:border-primary"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-3xl font-extrabold text-primary border-2 border-primary/30 shadow-sm transition-all duration-300 group-hover:border-primary">
                        {(profileUser.name ?? 'G').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isOwnProfile && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
                        <Camera className="h-6 w-6 text-primary" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarChange}
                        />
                      </label>
                    )}
                    {isStudent && (
                      <div className={cn(
                        "absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card shadow-md animate-in fade-in zoom-in-50 duration-300",
                        currentRank.bgColorClass
                      )}>
                        <RankIcon className={cn("h-4 w-4", currentRank.colorClass)} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl font-bold tracking-tight text-foreground">{profileUser.name}</CardTitle>
                      <Badge variant="outline" className="capitalize text-xs font-semibold border-primary/30 text-primary bg-primary/5">
                        {profileUser.role === 'student'
                          ? (language === 'th' ? 'นักเรียน' : 'Student')
                          : profileUser.role === 'teacher'
                          ? (language === 'th' ? 'คุณครู' : 'Teacher')
                          : (language === 'th' ? 'ผู้ดูแลระบบ' : 'Admin')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {language === 'th' ? `เข้าร่วมเมื่อ ${formatDate(profileUser.createdAt)}` : `Joined ${formatDate(profileUser.createdAt)}`}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {isStudent && (
              <CardContent className="border-t border-border p-6 bg-card">
                <div className="grid grid-cols-4 gap-4 text-center sm:text-left">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{language === 'th' ? 'XP ทั้งหมด' : 'Total XP'}</p>
                    <p className="text-2xl font-extrabold tabular-nums text-foreground">{userXp}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{language === 'th' ? 'เข้าใช้ต่อเนื่อง' : 'Streak'}</p>
                    <p className="text-2xl font-extrabold tabular-nums text-foreground">
                      {profileUser.streak ?? 0} {language === 'th' ? 'วัน' : 'days'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{language === 'th' ? 'โจทย์ที่ผ่านแล้ว' : 'Solved'}</p>
                    <p className="text-2xl font-extrabold tabular-nums text-foreground">{targetProfile?.solvedCount ?? 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{language === 'th' ? 'ระดับยศ' : 'Tier'}</p>
                    <p className={cn("text-2xl font-black tracking-tight uppercase", currentRank.colorClass)}>
                      {currentRank.label}
                    </p>
                  </div>
                </div>

                {nextRank ? (
                  <div className="mt-6 border-t border-border pt-6">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-muted-foreground">
                        {language === 'th' ? `ความคืบหน้าสู่ระดับ ${nextRank.label}` : `Progress to ${nextRank.label}`}
                      </span>
                      <span className="text-foreground font-mono tabular-nums">{userXp} / {nextRank.minXp} XP</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden shadow-inner">
                      <div 
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out", currentRank.gradientClass)} 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-2.5 text-xs text-muted-foreground flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span>
                        {isOwnProfile ? (
                          language === 'th' ? (
                            <>คุณต้องการอีก <strong className="text-foreground tabular-nums font-semibold">{xpToNext} XP</strong> เพื่อเลื่อนระดับถัดไป สู้ต่อไป!</>
                          ) : (
                            <>You need <strong className="text-foreground tabular-nums font-semibold">{xpToNext} more XP</strong> to reach the next tier. Keep solving problems!</>
                          )
                        ) : (
                          language === 'th' ? (
                            <>ต้องการอีก <strong className="text-foreground tabular-nums font-semibold">{xpToNext} XP</strong> เพื่อเลื่อนระดับถัดไป</>
                          ) : (
                            <>Needs <strong className="text-foreground tabular-nums font-semibold">{xpToNext} more XP</strong> to reach the next tier.</>
                          )
                        )}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 border-t border-border pt-6">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out", currentRank.gradientClass)} 
                        style={{ width: '100%' }}
                      />
                    </div>
                    <p className="mt-2.5 text-xs text-muted-foreground flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span>
                        {language === 'th' ? (
                          <>คุณได้รับ <strong className="text-foreground font-semibold">ระดับสูงสุดแล้ว ({currentRank.label})</strong>!</>
                        ) : (
                          <>Reached <strong className="text-foreground font-semibold">Maximum Level ({currentRank.label})</strong>!</>
                        )}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {isStudent && (
            <div className="space-y-3 max-w-md">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                {language === 'th' ? 'เหรียญรางวัล' : 'Badges'}
              </h2>
              <Card className="border border-border/80 p-4">
                <div className="flex flex-wrap gap-2">
                  {(targetProfile?.solvedCount ?? 0) > 0 ? (
                    badges.slice(0, Math.min(badges.length, Math.ceil((targetProfile?.solvedCount ?? 0) / 2))).map((b) => (
                      <Badge key={b} variant="outline" className="px-3 py-1 text-xs font-semibold border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors duration-200">
                        {b}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {language === 'th' ? 'ยังไม่ได้รับเหรียญรางวัลในขณะนี้' : 'No badges earned yet.'}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
