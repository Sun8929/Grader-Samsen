import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, Trash2, Search, Users, Check, GraduationCap, ChevronLeft, 
  Shield, Medal, Trophy, Crown, Gem, Sparkles, Flame, Swords, Plus, Loader2, Download, ClipboardList,
  Calendar, Clock, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store/useAppStore'
import * as api from '@/lib/api'
import type { Classroom, Submission } from '@/types'
import { getRankFromXp } from '@/lib/ranks'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useTranslation } from '@/utils/i18n'

export default function AdminClassrooms() {
  const { problems: dbProblems, fetchProblems, animationsEnabled } = useAppStore()
  const { language } = useTranslation()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Creation state (Teachers/Admins)
  const [className, setClassName] = useState('')
  const [classDesc, setClassDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // Detail & Assignment States
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'stream' | 'ranking' | 'classwork' | 'gradebook' | 'people'>('stream')
  const [assignments, setAssignments] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  // Assign Classwork Form State
  const [newAssignTitle, setNewAssignTitle] = useState('')
  const [newAssignProblemId, setNewAssignProblemId] = useState('')
  const [newAssignDueDate, setNewAssignDueDate] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)

  // Load classrooms on mount
  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setLoading(true)
        const data = await api.fetchClassrooms()
        setClassrooms(data)
      } catch (err: any) {
        toast.error(err.message ?? (language === 'th' ? 'โหลดห้องเรียนล้มเหลว' : 'Failed to load classrooms'))
      } finally {
        setLoading(false)
      }
    }
    void loadClassrooms()
    void fetchProblems()
  }, [fetchProblems, language])

  // Set default problem select value when problems change
  useEffect(() => {
    if (dbProblems.length > 0 && !newAssignProblemId) {
      setNewAssignProblemId(dbProblems[0].id)
    }
  }, [dbProblems, newAssignProblemId])

  // Load classroom specific data
  useEffect(() => {
    if (selectedClassroom) {
      const loadClassroomData = async () => {
        try {
          setMembersLoading(true)
          const membersData = await api.fetchClassroomMembers(selectedClassroom.id)
          setMembers(membersData)

          const assignmentsData = await api.fetchClassroomAssignments(selectedClassroom.id)
          setAssignments(assignmentsData)

          const subsData = await api.fetchClassroomSubmissions(selectedClassroom.id)
          setSubmissions(subsData)
        } catch (err: any) {
          toast.error(err.message ?? (language === 'th' ? 'ไม่สามารถโหลดข้อมูลห้องเรียนได้' : 'Failed to load classroom data'))
        } finally {
          setMembersLoading(false)
        }
      }
      void loadClassroomData()
      setActiveTab('stream')
    } else {
      setMembers([])
      setAssignments([])
      setSubmissions([])
    }
  }, [selectedClassroom, language])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!className.trim()) {
      toast.error(language === 'th' ? 'กรุณากรอกชื่อห้องเรียน' : 'Classroom name is required')
      return
    }

    try {
      setCreating(true)
      const newClass = await api.createClassroom(className, classDesc)
      setClassrooms((prev) => [newClass, ...prev])
      toast.success(
        language === 'th'
          ? `สร้างห้องเรียน "${className}" สำเร็จแล้ว!`
          : `Created classroom "${className}"!`
      )
      setClassName('')
      setClassDesc('')
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'สร้างห้องเรียนล้มเหลว' : 'Failed to create classroom'))
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClass = async (id: string, name: string) => {
    const confirmMsg = language === 'th'
      ? `คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียน "${name}"? นักเรียนทั้งหมดจะถูกถอนการลงทะเบียน`
      : `Are you sure you want to delete "${name}"? All students will be unenrolled.`
    
    if (!window.confirm(confirmMsg)) return

    try {
      await api.deleteClassroom(id)
      setClassrooms((prev) => prev.filter((c) => c.id !== id))
      toast.success(language === 'th' ? 'ลบห้องเรียนสำเร็จแล้ว' : 'Classroom deleted successfully.')
      if (selectedClassroom?.id === id) {
        setSelectedClassroom(null)
      }
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'ลบห้องเรียนล้มเหลว' : 'Failed to delete classroom'))
    }
  }

  const handleAssignClasswork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassroom) return
    if (!newAssignTitle.trim() || !newAssignDueDate || !newAssignProblemId) {
      toast.error(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบทุกช่อง' : 'Please fill out all fields')
      return
    }

    try {
      const newAssign = await api.createAssignment(
        selectedClassroom.id,
        newAssignTitle,
        '', // description
        new Date(newAssignDueDate).toISOString(),
        [newAssignProblemId]
      )
      setAssignments((prev) => [newAssign, ...prev])
      toast.success(
        language === 'th'
          ? `มอบหมายงาน "${newAssignTitle}" สำเร็จแล้ว!`
          : `Assigned "${newAssignTitle}" successfully!`
      )

      setNewAssignTitle('')
      setNewAssignDueDate('')
      setShowAssignForm(false)
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'การมอบหมายงานล้มเหลว' : 'Failed to assign classwork'))
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      toast.success(language === 'th' ? 'คัดลอกรหัสเข้าห้องเรียนไปยังคลิปบอร์ดแล้ว!' : 'Classroom code copied to clipboard!')
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }

  // Filter classrooms by search input
  const filteredClassrooms = classrooms.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  // Gradebook Exporter CSV logic
  const assignedProblemIds = [...new Set(assignments.flatMap(a => a.problemIds || []))]
  const assignedProblems = dbProblems.filter(p => assignedProblemIds.includes(p.id))
  const gridProblems = assignedProblems.length > 0 ? assignedProblems : dbProblems

  const handleExportGradebook = () => {
    if (members.length === 0) {
      toast.warning(language === 'th' ? 'ไม่มีรายชื่อนักเรียนเพื่อทำการส่งออกข้อมูลคะแนน' : 'No student members in this class to export.')
      return
    }

    const csvHeaders = [
      language === 'th' ? 'ชื่อนักเรียน' : 'Student Name', 
      language === 'th' ? 'ชื่อผู้ใช้' : 'Username', 
      'XP', 
      language === 'th' ? 'เข้าใช้ต่อเนื่อง' : 'Streak', 
      ...gridProblems.map(p => p.title)
    ]
    
    const csvRows = members.map(m => {
      const row = [
        m.name || (language === 'th' ? 'ไม่ระบุชื่อ' : 'Anonymous'),
        m.username,
        String(m.xp ?? 0),
        language === 'th' ? `${m.streak ?? 0} วัน` : `${m.streak ?? 0} days`
      ]

      gridProblems.forEach(p => {
        const studentSubs = submissions.filter(s => s.userId === m.id && s.problemId === p.id)
        const bestSub = studentSubs.find(s => s.verdict === 'Accepted') || studentSubs[0]
        row.push(
          bestSub 
            ? `${bestSub.verdict} (${bestSub.score}pts)` 
            : (language === 'th' ? 'ยังไม่ได้ทำ' : 'Unattempted')
        )
      })
      return row
    })

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    const sanitizedClassName = (selectedClassroom?.name || 'classroom').replace(/[^a-zA-Z0-9_-]/g, '_')
    link.setAttribute('download', `gradebook_${sanitizedClassName}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(language === 'th' ? 'ดาวน์โหลดไฟล์ผลการเรียน CSV สำเร็จ!' : 'Gradebook CSV downloaded successfully!')
  }

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {selectedClassroom ? (
        // GOOGLE CLASSROOM WORKSPACE FOR TEACHERS
        <div className="space-y-6">
          {/* Header & Back Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <Button
              variant="ghost"
              onClick={() => setSelectedClassroom(null)}
              className="flex items-center gap-2 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors w-fit -ml-2 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              {language === 'th' ? 'กลับไปที่การจัดการห้องเรียนทั้งหมด' : 'Back to Classroom Management'}
            </Button>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-xs text-muted-foreground font-medium">
                {language === 'th' ? 'รหัสเชิญเข้าเรียน:' : 'Invite Code:'}
              </span>
              <code className="text-xs font-mono font-bold bg-muted px-2.5 py-1 rounded text-muted-foreground uppercase border border-border/80">
                {selectedClassroom.code}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                onClick={() => handleCopyCode(selectedClassroom.code)}
              >
                {copiedCode === selectedClassroom.code ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {language === 'th' ? 'คัดลอก' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden h-40 sm:h-48 md:h-52 bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 shadow-md flex items-end p-6 sm:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-1 sm:space-y-2 text-white">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm select-none">
                {selectedClassroom.name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-xl opacity-90 drop-shadow-xs line-clamp-1">
                {selectedClassroom.description || (language === 'th' ? 'ไม่มีคำอธิบายวิชา' : 'No description provided.')}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[10px] sm:text-xs font-semibold text-emerald-200">
                <GraduationCap className="h-4 w-4" />
                <span>{language === 'th' ? `ผู้สอน: ${selectedClassroom.teacherName}` : `Instructor: ${selectedClassroom.teacherName}`}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border overflow-x-auto scrollbar-none">
            {[
              { id: 'stream', label: language === 'th' ? 'สตรีม' : 'Stream' },
              { id: 'classwork', label: language === 'th' ? 'งานของชั้นเรียน' : 'Classwork' },
              { id: 'gradebook', label: language === 'th' ? 'ผลการเรียน' : 'Grades' },
              { id: 'people', label: language === 'th' ? 'ผู้คน' : 'People' },
              { id: 'ranking', label: language === 'th' ? 'ตารางคะแนน' : 'Leaderboard' },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "relative px-5 py-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap",
                    isActive
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="classroomsActiveTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                      transition={animationsEnabled ? { type: "spring", stiffness: 380, damping: 30 } : { duration: 0 }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={animationsEnabled ? { opacity: 0, y: 8 } : {}}
                animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
                exit={animationsEnabled ? { opacity: 0, y: -8 } : {}}
                transition={{ duration: animationsEnabled ? 0.15 : 0 }}
              >
                {activeTab === 'stream' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column - Upcoming Work */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="border border-border/80 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'th' ? 'งานที่กำหนดส่งเร็วๆ นี้' : 'Upcoming Tasks'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {assignments.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">
                          {language === 'th' ? 'ไม่มีงานที่จะต้องส่งในเร็วๆ นี้!' : 'No tasks assigned yet.'}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {assignments.slice(0, 3).map((a) => (
                            <div key={a.id} className="text-xs">
                              <p className="font-semibold text-foreground line-clamp-1">{a.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3 text-primary" />
                                {language === 'th' ? 'กำหนดส่ง:' : 'Due:'} {new Date(a.dueAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setActiveTab('classwork')}
                            className="p-0 text-xs font-bold text-primary hover:underline hover:bg-transparent h-auto mt-1 cursor-pointer"
                          >
                            {language === 'th' ? 'จัดการงานทั้งหมด →' : 'Manage all →'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Activity Stream */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Create post box style */}
                  <Card className="border border-border/80 bg-card shadow-sm p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
                      {(selectedClassroom.teacherName || 'Instructor').charAt(0).toUpperCase()}
                    </div>
                    <div 
                      className="flex-1 bg-muted/50 hover:bg-muted/80 text-xs text-muted-foreground rounded-full px-4 py-2.5 border border-border/50 cursor-pointer transition-colors"
                      onClick={() => setActiveTab('classwork')}
                    >
                      {language === 'th' ? 'มอบหมายงานหรือส่งการบ้านใหม่ให้นักเรียน...' : 'Assign new class work or announce to student...'}
                    </div>
                  </Card>

                  {/* Feed of assignments */}
                  <div className="space-y-4">
                    {membersLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <span className="text-xs font-medium">
                          {language === 'th' ? 'กำลังโหลดข่าวสารและกิจกรรม...' : 'Loading stream feed...'}
                        </span>
                      </div>
                    ) : assignments.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 py-16 text-center text-xs text-muted-foreground">
                        {language === 'th' ? 'ยังไม่มีการมอบหมายงานในห้องเรียนนี้' : 'No assignments created yet.'}
                      </div>
                    ) : (
                      assignments.map((a) => (
                        <Card key={a.id} className="border border-border/80 bg-card hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-sm">
                                <ClipboardList className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                                    {selectedClassroom.teacherName || 'Instructor'}{' '}
                                    <span className="text-muted-foreground font-normal">
                                      {language === 'th' ? 'ได้มอบหมายงานใหม่:' : 'assigned a new task:'}
                                    </span>{' '}
                                    {a.title}
                                  </h3>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {new Date(a.createdAt || Date.now()).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                                  {language === 'th' ? 'กำหนดส่ง:' : 'Due Date:'} {new Date(a.dueAt).toLocaleDateString()}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {a.problemIds?.map((pid: string) => {
                                    const pInfo = dbProblems.find((p) => p.id === pid)
                                    return (
                                      <span key={pid} className="rounded bg-accent/70 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/5">
                                        {pInfo?.title || `Problem #${pid}`}
                                      </span>
                                    )
                                  })}
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <Button size="sm" className="h-8 text-[11px] font-bold gap-1 cursor-pointer" asChild>
                                    <Link to={`/app/problems/${a.problemIds?.[0] || ''}`}>
                                      {language === 'th' ? 'ดูโจทย์ปัญหา' : 'Preview Task'}
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'classwork' && (
              <div className="space-y-4 max-w-4xl">
                {/* Teacher assign controls */}
                <div className="border border-dashed border-border/80 p-4 rounded-xl bg-muted/20">
                  {showAssignForm ? (
                    <form onSubmit={handleAssignClasswork} className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'th' ? 'มอบหมายงานใหม่' : 'Assign Coding Problem'}
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder={language === 'th' ? 'ชื่อแบบฝึกหัด/การบ้าน (เช่น DP Practice)' : 'Assignment Title (e.g. DP Practice)'}
                          value={newAssignTitle}
                          onChange={(e) => setNewAssignTitle(e.target.value)}
                          className="text-xs h-9 bg-card"
                          required
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            value={newAssignProblemId}
                            onChange={(e) => setNewAssignProblemId(e.target.value)}
                            className="rounded-md border border-input bg-card px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-primary outline-none cursor-pointer h-9 text-foreground"
                          >
                            {dbProblems.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="date"
                            value={newAssignDueDate}
                            onChange={(e) => setNewAssignDueDate(e.target.value)}
                            className="text-xs h-9 bg-card"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs px-3 cursor-pointer"
                          onClick={() => setShowAssignForm(false)}
                        >
                          {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                        </Button>
                        <Button type="submit" size="sm" className="h-8 text-xs font-semibold px-4 cursor-pointer">
                          {language === 'th' ? 'สั่งการบ้าน' : 'Assign Task'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      onClick={() => setShowAssignForm(true)}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold h-9 bg-card border border-border cursor-pointer hover:bg-accent/10"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      {language === 'th' ? 'สร้างและมอบหมายงานใหม่' : 'Create & Assign Task'}
                    </Button>
                  )}
                </div>

                {/* List of Tasks */}
                <div className="space-y-3">
                  {membersLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs">
                        {language === 'th' ? 'กำลังโหลดงานการบ้านประจำชั้นเรียน...' : 'Loading classroom assignments...'}
                      </span>
                    </div>
                  ) : assignments.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground py-10 border border-dashed border-border rounded-lg">
                      {language === 'th' ? 'ยังไม่ได้มอบหมายการบ้านใดๆ ในชั้นเรียนนี้' : 'No tasks assigned yet.'}
                    </p>
                  ) : (
                    assignments.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:border-primary/50 hover:shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">{a.title}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="h-3.5 w-3.5" />
                                {language === 'th' ? 'กำหนดส่ง:' : 'Due:'} {new Date(a.dueAt).toLocaleDateString()}
                              </span>
                              <span>·</span>
                              <span className="bg-primary/5 px-1.5 py-0.5 rounded text-primary text-[9px] font-bold">
                                {language === 'th' ? `${a.problemIds?.length || 0} โจทย์ปัญหา` : `${a.problemIds?.length || 0} Problem${(a.problemIds?.length ?? 0) === 1 ? '' : 's'}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {a.problemIds?.map((pid: string) => {
                            const pInfo = dbProblems.find((p) => p.id === pid)
                            return (
                              <span key={pid} className="hidden md:inline-block rounded bg-muted border border-border px-2 py-0.5 text-[10px] text-muted-foreground font-semibold">
                                {pInfo?.title || `Problem #${pid}`}
                              </span>
                            )
                          })}
                          <Button size="sm" className="h-8 text-xs font-semibold cursor-pointer" asChild>
                            <Link to={`/app/problems/${a.problemIds?.[0] || ''}`}>
                              {language === 'th' ? 'ดูโจทย์ปัญหา' : 'Preview'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'gradebook' && (
              <div className="space-y-4">
                {/* Gradebook controls */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'ตารางบันทึกผลคะแนนและผลการเรียน' : 'Marks Matrix / Gradebook'}
                  </h2>
                  <Button size="sm" variant="outline" className="h-8 text-xs font-semibold cursor-pointer" onClick={handleExportGradebook}>
                    <Download className="h-4 w-4 mr-1.5 text-primary" /> 
                    {language === 'th' ? 'ส่งออกไฟล์ CSV' : 'Export CSV'}
                  </Button>
                </div>

                {membersLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs">
                      {language === 'th' ? 'กำลังดึงข้อมูลคะแนนนักเรียน...' : 'Generating gradebook data...'}
                    </span>
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-10 border border-dashed border-border rounded-lg">
                    {language === 'th' ? 'ยังไม่มีรายชื่อนักเรียนเพื่อแสดงผลการเรียน' : 'No students enrolled yet to show scores.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-xl bg-card shadow-sm">
                    <table className="w-full text-xs min-w-[500px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/50 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                          <th className="px-4 py-3">{language === 'th' ? 'นักเรียน' : 'Student'}</th>
                          {gridProblems.map(p => (
                            <th key={p.id} className="px-4 py-3 text-center truncate max-w-[120px]" title={p.title}>
                              {p.title}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {members.map(m => (
                          <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground">
                              {m.name || (language === 'th' ? 'ไม่ระบุชื่อ' : 'Anonymous')}
                              <div className="text-[10px] font-normal text-muted-foreground font-mono">@{m.username}</div>
                            </td>
                            {gridProblems.map(p => {
                              const studentSubs = submissions.filter(s => s.userId === m.id && s.problemId === p.id)
                              const bestSub = studentSubs.find(s => s.verdict === 'Accepted') || studentSubs[0]

                              return (
                                <td key={p.id} className="px-4 py-3 text-center font-bold">
                                  {bestSub ? (
                                    <span className={cn(
                                      "inline-block text-[10px] rounded-full px-2.5 py-0.5 border font-semibold",
                                      bestSub.verdict === 'Accepted'
                                        ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400'
                                    )}>
                                      {bestSub.verdict === 'Accepted' ? 'AC' : 'WA'}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/30 font-medium">—</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'people' && (
              <div className="space-y-6 max-w-2xl">
                {/* Teachers Section */}
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                    {language === 'th' ? 'ครูผู้สอน' : 'Teachers'}
                  </h2>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-xs">
                      {(selectedClassroom.teacherName || 'Instructor').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{selectedClassroom.teacherName || 'Instructor'}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                        {language === 'th' ? 'ครูผู้สอนหลัก' : 'Primary Instructor'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Classmates Section */}
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                    {language === 'th' ? 'รายชื่อนักเรียนที่ลงทะเบียน' : 'Students Enrolled'}
                  </h2>
                  {membersLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs">
                        {language === 'th' ? 'กำลังโหลดรายชื่อ...' : 'Loading standings...'}
                      </span>
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
                      {language === 'th' ? 'ยังไม่มีนักเรียนลงทะเบียนในห้องเรียนนี้' : 'No students enrolled yet.'}
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs border border-border">
                              {(m.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                to={`/app/profile?userId=${m.id}`}
                                className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
                              >
                                {m.name || (language === 'th' ? 'ไม่ระบุชื่อ' : 'Anonymous')}
                              </Link>
                              <div className="text-[10px] text-muted-foreground font-mono">@{m.username}</div>
                            </div>
                          </div>
                          <div className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded font-medium border border-primary/5">
                            {language === 'th' ? `สตรีค ${m.streak ?? 0} วัน` : `${m.streak ?? 0}d streak`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ranking' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {language === 'th' ? 'ตารางคะแนนประจำห้องเรียน' : 'Classroom Leaderboard'}
                  </h2>
                  <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 rounded px-2 py-0.5 font-bold uppercase">
                    {language === 'th' ? `ลงทะเบียน ${members.length} คน` : `${members.length} Enrolled`}
                  </span>
                </div>

                {membersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <span className="text-xs font-medium">
                      {language === 'th' ? 'กำลังโหลดอันดับความคืบหน้า...' : 'Loading standings...'}
                    </span>
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-10 border border-dashed border-border rounded-lg">
                    {language === 'th' ? 'ยังไม่มีตารางคะแนนสำหรับห้องเรียนนี้' : 'No classroom rankings available yet.'}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="overflow-x-auto animate-in fade-in">
                      <table className="w-full min-w-[360px] text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="w-16 px-4 py-3 text-center">{language === 'th' ? 'อันดับ' : 'Rank'}</th>
                            <th className="px-6 py-3">{language === 'th' ? 'นักเรียน' : 'Student'}</th>
                            <th className="px-6 py-3">{language === 'th' ? 'ระดับยศ' : 'Tier'}</th>
                            <th className="px-6 py-3 text-right">XP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {members.map((m, index) => {
                            const { currentRank } = getRankFromXp(m.xp ?? 0)
                            const RankIcon = rankIcons[currentRank.iconName as keyof typeof rankIcons] || Shield
                            return (
                              <tr key={m.id} className="transition-colors hover:bg-muted/50">
                                <td className="px-4 py-3.5 text-center font-mono font-bold tabular-nums">
                                  {index === 0 ? (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold">1</span>
                                  ) : index === 1 ? (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">2</span>
                                  ) : index === 2 ? (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold">3</span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">{index + 1}</span>
                                  )}
                                </td>
                                <td className="px-6 py-3.5">
                                  <Link 
                                    to={`/app/profile?userId=${m.id}`} 
                                    className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer"
                                  >
                                    {m.name || (language === 'th' ? 'ไม่ระบุชื่อ' : 'Anonymous')}
                                  </Link>
                                  <div className="text-[10px] text-muted-foreground font-mono">@{m.username}</div>
                                </td>
                                <td className="px-6 py-3.5">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                                    currentRank.bgColorClass,
                                    currentRank.borderColorClass
                                  )}>
                                    <RankIcon className={cn("h-3 w-3", currentRank.colorClass)} />
                                    <span className={cn("font-medium text-[9px]", currentRank.colorClass)}>
                                      {currentRank.label}
                                    </span>
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono font-bold tabular-nums">
                                  {m.xp ?? 0}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        // ALL CLASSROOMS GRID & CREATE FORM SIDEBAR
        <>
          <PageHeader
            title={language === 'th' ? 'การจัดการห้องเรียน' : 'Classroom Manager'}
            description={
              language === 'th'
                ? 'ติดตามระดับคะแนนของนักเรียน ส่งรหัสเชิญ ตรวจสอบอันดับ และการมอบหมายงานโจทย์คอมพิวเตอร์'
                : 'Monitor student grades, invite members, review ranks, and assign coding tasks.'
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Create Class Form */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border border-border/80 shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    {language === 'th' ? 'สร้างห้องเรียน' : 'Create Class'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'th' ? 'เริ่มต้นเปิดวิชา/ห้องเรียนใหม่สำหรับนักเรียน' : 'Launch a new classroom space for students.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateClass} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="className" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {language === 'th' ? 'ชื่อห้องเรียน' : 'Class Name'}
                      </label>
                      <Input
                        id="className"
                        required
                        placeholder="e.g. Algorithms Section 1"
                        value={className}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setClassName(e.target.value)}
                        disabled={creating}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="classDesc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-medium">
                        {language === 'th' ? 'รายละเอียดวิชา' : 'Description'}
                      </label>
                      <textarea
                        id="classDesc"
                        rows={3}
                        placeholder={language === 'th' ? 'เช่น เรียนรู้โครงสร้างข้อมูล กราฟ และอัลกอริทึมประเภทต่างๆ...' : 'e.g. Study graph traversals, greedy methods, dynamic programming'}
                        value={classDesc}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setClassDesc(e.target.value)}
                        disabled={creating}
                        className="flex w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <Button type="submit" className="w-full flex items-center justify-center gap-1.5 cursor-pointer font-semibold" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                          {language === 'th' ? 'กำลังเปิดคลาส...' : 'Launching Class…'}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1.5" /> 
                          {language === 'th' ? 'สร้างห้องเรียน' : 'Create Class'}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Active Classrooms List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border border-border/80 shadow-sm bg-card">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {language === 'th' ? 'ห้องเรียนที่ใช้งานอยู่' : 'Active Classrooms'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'th' ? 'เรียกดูและบริหารคลาสเรียนทั้งหมดที่คุณดูแล' : 'Browse and manage the classes you supervise.'}
                      </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={language === 'th' ? 'ค้นหาจากชื่อหรือรหัสห้องเรียน...' : 'Search by name or code...'}
                        value={search}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="animate-pulse space-y-4 p-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                          <div className="space-y-2 flex-1">
                            <div className="h-5 w-1/3 bg-muted rounded-md" />
                            <div className="h-3.5 w-1/4 bg-muted rounded-md" />
                          </div>
                          <div className="flex gap-4">
                            <div className="h-7 w-16 bg-muted rounded-md" />
                            <div className="h-7 w-16 bg-muted rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredClassrooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                      <GraduationCap className="h-10 w-10 text-muted-foreground/60 mb-2" />
                      <div className="text-sm font-bold text-foreground">
                        {language === 'th' ? 'ไม่พบห้องเรียน' : 'No classrooms found'}
                      </div>
                      <p className="text-xs text-muted-foreground max-w-sm mt-1">
                        {language === 'th' ? 'ลองปรับแต่งคีย์เวิร์ดค้นหา หรือกดเปิดห้องเรียนแรกที่แถบเครื่องมือด้านซ้าย' : 'Try refining your search or create your first classroom using the sidebar tool.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 p-4">
                      {filteredClassrooms.map((c) => {
                        const isSelected = selectedClassroom ? (selectedClassroom as any).id === c.id : false
                        return (
                          <Card
                            key={c.id}
                            onClick={() => setSelectedClassroom(c)}
                            className={cn(
                              "group flex flex-col justify-between overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer hover:-translate-y-0.5 bg-card",
                              isSelected ? "border-primary ring-1 ring-primary" : "border-border/80"
                            )}
                          >
                            {/* Card Header Banner (Google Classroom Style) */}
                            <div className="relative h-28 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-4 text-white flex flex-col justify-between">
                              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-white/5 blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                              
                              <div className="relative z-10">
                                <h3 className="text-base font-extrabold tracking-tight line-clamp-1 group-hover:underline select-none">
                                  {c.name}
                                </h3>
                                <p className="text-[11px] text-emerald-100/80 font-medium line-clamp-1 mt-0.5 select-none">
                                  {c.description || (language === 'th' ? 'ไม่มีคำอธิบายวิชา' : 'No description')}
                                </p>
                              </div>
                              
                              <div className="relative z-10 text-[10px] text-emerald-200/90 font-semibold flex items-center gap-1.5 select-none">
                                <GraduationCap className="h-3.5 w-3.5" />
                                <span className="truncate">{c.teacherName || (language === 'th' ? 'ผู้สอน' : 'Instructor')}</span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 flex-1 flex flex-col justify-between min-h-[5rem] bg-card">
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block">
                                  {language === 'th' ? 'รายละเอียดห้องเรียน' : 'Class Details'}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                                  <span className="font-semibold">
                                    {language === 'th' ? `นักเรียน ${c.studentCount} คน` : `${c.studentCount} student${c.studentCount === 1 ? '' : 's'}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer */}
                            <div
                              className="border-t border-border/50 bg-muted/20 px-4 py-2.5 flex items-center justify-between mt-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopyCode(c.code)}
                                  className="flex items-center gap-1.5 rounded bg-muted hover:bg-muted/80 px-2.5 py-1 text-[10px] font-bold text-muted-foreground shadow-sm transition border border-border/50 cursor-pointer"
                                >
                                  {copiedCode === c.code ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                  {c.code}
                                </button>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                onClick={() => handleDeleteClass(c.id, c.name)}
                                title={language === 'th' ? 'ลบห้องเรียน' : 'Delete Class'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
