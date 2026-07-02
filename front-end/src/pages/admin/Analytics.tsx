import { useEffect, useState } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { chartTick, chartTooltipStyle } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { 
  BarChart3, Users, CheckCircle2
} from 'lucide-react'
import * as api from '@/lib/api'
import type { Submission } from '@/types'
import { useTranslation } from '@/utils/i18n'

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#64748b']

export default function Analytics() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const problems = useAppStore((s) => s.problems)
  const fetchProblems = useAppStore((s) => s.fetchProblems)
  const { language } = useTranslation()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const subs = await api.fetchSubmissions()
        setSubmissions(subs)
      } catch (err) {
        console.error('Failed to fetch submissions', err)
      } finally {
        setLoading(false)
      }
    }
    void loadData()
    if (problems.length === 0) {
      void fetchProblems()
    }
  }, [])

  // Calculations
  const totalSubmissions = submissions.length
  const acceptedSubmissions = submissions.filter(s => s.verdict === 'Accepted').length
  const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0
  const uniqueStudents = new Set(submissions.map(s => s.userId)).size

  // Group submissions by day (for last 7 days of activity)
  const getSubmissionsHistory = () => {
    const dateMap: Record<string, { total: number; accepted: number }> = {}
    
    // Sort submissions oldest first to map timeline correctly
    const sorted = [...submissions].sort((a, b) => 
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    )

    sorted.forEach(sub => {
      const dateKey = new Date(sub.submittedAt).toLocaleDateString(language === 'th' ? 'th-TH' : undefined, { 
        month: 'short', 
        day: 'numeric' 
      })
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { total: 0, accepted: 0 }
      }
      dateMap[dateKey].total++
      if (sub.verdict === 'Accepted') {
        dateMap[dateKey].accepted++
      }
    })

    return Object.keys(dateMap).map(date => ({
      date,
      submissions: dateMap[date].total,
      accepted: dateMap[date].accepted
    })).slice(-10) // Show last 10 active days
  }

  // Verdict distribution
  const getVerdictDistribution = () => {
    const verdictMap: Record<string, number> = {}
    submissions.forEach(sub => {
      verdictMap[sub.verdict] = (verdictMap[sub.verdict] || 0) + 1
    })

    return Object.keys(verdictMap).map(verdict => ({
      name: verdict,
      value: verdictMap[verdict]
    }))
  }

  // Language Breakdown
  const getLanguageData = () => {
    const langMap: Record<string, number> = {}
    submissions.forEach(sub => {
      const langName = sub.language === 'cpp' ? 'C++' : 
                       sub.language === 'javascript' || sub.language === 'js' ? 'JavaScript' : 
                       sub.language.toUpperCase()
      langMap[langName] = (langMap[langName] || 0) + 1
    })

    return Object.keys(langMap).map(name => ({
      name,
      submissions: langMap[name]
    })).sort((a, b) => b.submissions - a.submissions)
  }

  const historyData = getSubmissionsHistory()
  const verdictData = getVerdictDistribution()
  const languageData = getLanguageData()

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded-md" />
          <div className="h-4 w-72 bg-muted rounded-md" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border border-border/60 p-5 space-y-3">
              <div className="h-4 w-1/3 bg-muted rounded-md" />
              <div className="h-7 w-16 bg-muted rounded-md" />
            </Card>
          ))}
        </div>

        {/* Chart Grid Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border border-border/60 p-5 space-y-4">
            <div className="h-5 w-1/4 bg-muted rounded-md" />
            <div className="h-64 w-full bg-muted/20 rounded-xl" />
          </Card>
          <Card className="border border-border/60 p-5 space-y-4">
            <div className="h-5 w-1/3 bg-muted rounded-md" />
            <div className="h-64 w-full bg-muted/20 rounded-xl" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title={language === 'th' ? 'ข้อมูลวิเคราะห์' : 'Analytics'}
        description={
          language === 'th'
            ? 'สถิติโดยรวมเกี่ยวกับการส่งคำตอบในห้องเรียน อัตราความสำเร็จ และประเภทภาษาเขียนโปรแกรมที่ใช้งาน'
            : 'Aggregate statistics on classroom submissions, success rates, and language usage.'
        }
      />

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-border/80 shadow-sm transition-all hover:border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {language === 'th' ? 'การส่งคำตอบทั้งหมด' : 'Total Submissions'}
              </p>
              <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">{totalSubmissions}</p>
            </div>
            <div className="p-3 bg-muted/60 rounded-xl text-primary border border-border/40">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm transition-all hover:border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {language === 'th' ? 'อัตราผ่านการตรวจ' : 'Acceptance Rate'}
              </p>
              <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">{acceptanceRate}%</p>
            </div>
            <div className="p-3 bg-muted/60 rounded-xl text-green-500 border border-border/40">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm transition-all hover:border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {language === 'th' ? 'นักเรียนที่ส่งโค้ด' : 'Active Students'}
              </p>
              <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">{uniqueStudents}</p>
            </div>
            <div className="p-3 bg-muted/60 rounded-xl text-blue-500 border border-border/40">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Timeline Chart */}
        <Card className="md:col-span-2 border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold tracking-tight">
              {language === 'th' ? 'กิจกรรมการส่งคำตอบ' : 'Submission Activity'}
            </CardTitle>
            <CardDescription>
              {language === 'th' ? 'สถิติการส่งโค้ดทั้งหมดและโค้ดที่ผ่านในช่วงวันที่เปิดใช้งานล่าสุด' : 'Submissions and AC counts over the last active days'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={chartTick} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={chartTick} stroke="var(--color-muted-foreground)" />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    name={language === 'th' ? 'ส่งทั้งหมด' : 'Total'}
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSub)"
                  />
                  <Area
                    type="monotone"
                    dataKey="accepted"
                    name={language === 'th' ? 'ผ่าน (Accepted)' : 'Accepted'}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAc)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                {language === 'th' ? 'ไม่มีการบันทึกประวัติข้อมูลการส่งคำตอบ' : 'No submissions data recorded.'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verdict Distribution */}
        <Card className="md:col-span-1 border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold tracking-tight">
              {language === 'th' ? 'สัดส่วนผลการตรวจ' : 'Verdict Distribution'}
            </CardTitle>
            <CardDescription>
              {language === 'th' ? 'อัตราส่วนและผลลัพธ์ย่อยจากการคอมไพล์โค้ด' : 'Proportion of compiler results'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex flex-col justify-between">
            {verdictData.length > 0 ? (
              <>
                <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={verdictData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {verdictData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center text-[10px] font-semibold">
                  {verdictData.map((v, index) => (
                    <div key={v.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{v.name} ({v.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                {language === 'th' ? 'ไม่มีข้อมูลประวัติผลการตรวจ' : 'No submissions data.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Language Breakdown */}
      <div className="w-full">
        {/* Languages Bar Chart */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold tracking-tight">
              {language === 'th' ? 'ภาษาโปรแกรมมิ่งที่ใช้' : 'Language Distribution'}
            </CardTitle>
            <CardDescription>
              {language === 'th' ? 'อัตราส่วนและจำนวนการใช้ภาษาของนักเรียน' : 'Most popular programming languages used'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {languageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={chartTick} stroke="var(--color-muted-foreground)" width={75} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="submissions" name={language === 'th' ? 'จำนวนครั้งที่ส่ง' : 'Submissions'} fill="#22c55e" radius={[0, 4, 4, 0]}>
                    {languageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                {language === 'th' ? 'ไม่มีข้อมูลการเลือกใช้ภาษาโปรแกรมมิ่ง' : 'No language usage data.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
