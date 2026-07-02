import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { BookOpen, Users, Code2, ShieldAlert, ChevronRight, GraduationCap } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import * as api from '@/lib/api'
import type { User, Classroom } from '@/types'
import { chartTick, chartTooltipStyle } from '@/lib/utils'
import { useTranslation } from '@/utils/i18n'

export default function AdminDashboard() {
  const { user } = useAppStore()
  const { language } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'admin'

  // Chart data for weekly submissions
  const chartData = [
    { day: language === 'th' ? 'จ.' : 'Mon', subs: 0 },
    { day: language === 'th' ? 'อ.' : 'Tue', subs: 0 },
    { day: language === 'th' ? 'พ.' : 'Wed', subs: 0 },
    { day: language === 'th' ? 'พฤ.' : 'Thu', subs: 0 },
    { day: language === 'th' ? 'ศ.' : 'Fri', subs: 0 },
    { day: language === 'th' ? 'ส.' : 'Sat', subs: 0 },
    { day: language === 'th' ? 'อา.' : 'Sun', subs: 0 },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch all classrooms (real data)
        const classData = await api.fetchClassrooms()
        setClassrooms(classData)

        // Fetch users if caller is teacher or admin
        const userData = await api.fetchUsers()
        setUsers(userData)
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      void fetchData()
    }
  }, [user])

  // Computed metrics
  const totalClassrooms = classrooms.length
  const totalEnrolledStudents = classrooms.reduce((sum, c) => sum + c.studentCount, 0)
  const studentCount = users.filter((u) => u.role === 'student').length
  const teacherCount = users.filter((u) => u.role === 'teacher').length
  const adminCount = users.filter((u) => u.role === 'admin').length

  const roleText = user?.role === 'teacher' 
    ? (language === 'th' ? 'คุณครู' : 'Teacher')
    : user?.role === 'admin'
    ? (language === 'th' ? 'ผู้ดูแลระบบ' : 'Admin')
    : user?.role

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title={
          isAdmin 
            ? (language === 'th' ? 'แผงผู้ดูแลระบบ' : 'Admin Dashboard') 
            : (language === 'th' ? 'แผงควบคุมคุณครู' : 'Instructor Dashboard')
        }
        description={
          isAdmin
            ? (language === 'th' ? 'ภาพรวมของระบบตรวจโค้ดทั้งหมด รวมถึงห้องเรียน บัญชีผู้ใช้ และทรัพยากรต่างๆ' : 'Overview of the entire grader platform including live classrooms, registrations, and resources.')
            : (language === 'th' ? 'เข้าถึงสถิติห้องเรียน ผลการส่งของนักเรียน และจัดการห้องเรียนของคุณ' : 'Access class metrics, student submissions, and manage your classrooms.')
        }
      />

      {/* Grid of stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <Card className="border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'นักเรียนทั้งหมด' : 'Total Students'}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tabular-nums">
                    {loading ? '...' : studentCount}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'คุณครูทั้งหมด' : 'Total Teachers'}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tabular-nums">
                    {loading ? '...' : teacherCount}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'ห้องเรียน' : 'Classrooms'}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tabular-nums">
                    {loading ? '...' : totalClassrooms}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'ผู้ดูแลระบบ' : 'Administrators'}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tabular-nums">
                    {loading ? '...' : adminCount}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md col-span-1">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'ห้องเรียนของฉัน' : 'My Classrooms'}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tabular-nums">
                    {loading ? '...' : totalClassrooms}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md col-span-1">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'นักเรียนที่เข้าเรียน' : 'Active Students'}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tabular-nums">
                    {loading ? '...' : totalEnrolledStudents}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md col-span-1">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'โจทย์โปรแกรมมิ่ง' : 'Coding Problems'}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tabular-nums">3</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md col-span-1">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'บทบาทของฉัน' : 'My Role'}
                  </p>
                  <h3 className="mt-1 text-xl font-bold capitalize text-amber-700 dark:text-amber-400">
                    {roleText}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                {language === 'th' ? 'สถิติการส่งคำตอบในสัปดาห์นี้' : 'Submissions this week'}
              </CardTitle>
              <CardDescription>
                {language === 'th' ? 'กราฟแสดงประวัติความพยายามส่งโค้ดตรวจในระบบ' : 'Visual metrics of system coding attempts.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="day" tick={chartTick} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={chartTick} stroke="var(--color-muted-foreground)" />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="subs" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {language === 'th' ? 'ทางลัดดำเนินการ' : 'Quick Actions'}
              </CardTitle>
              <CardDescription>
                {language === 'th' ? 'เมนูเข้าถึงการตั้งค่าด่วนอย่างรวดเร็ว' : 'Shortcut panels for quick access.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-between" variant="outline">
                <Link to="/admin/classrooms">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {isAdmin 
                      ? (language === 'th' ? 'ตรวจสอบห้องเรียนทั้งหมด' : 'Look through classrooms') 
                      : (language === 'th' ? 'สร้างและจัดการห้องเรียน' : 'Create & Manage Classrooms')}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between" variant="outline">
                <Link to="/admin/users">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    {language === 'th' ? 'จัดการผู้ใช้งานลงทะเบียน' : 'Manage registered users'}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between" variant="outline">
                <Link to="/admin/problems">
                  <span className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-amber-600" />
                    {language === 'th' ? 'คลังโจทย์ปัญหาในระบบ' : 'System Problem pool'}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
