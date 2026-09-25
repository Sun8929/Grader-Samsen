import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, Plus, Trash2, LogOut, Loader2, ChevronLeft, Shield, Medal, Trophy, Crown,
  GraduationCap, Users, Calendar, Clock, ArrowRight, ClipboardList, Check, Gem, Sparkles, Flame, Swords
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store/useAppStore'
import * as api from '@/lib/api'
import type { Classroom } from '@/types'
import { getRankFromXp } from '@/lib/ranks'
import { cn } from '@/lib/utils'
import { mockProblems } from '@/lib/mock-data'
import { Link } from 'react-router-dom'
import { useTranslation } from '@/utils/i18n'

export default function Classes() {
  const { user, problems: dbProblems, fetchProblems, animationsEnabled } = useAppStore()
  const { language } = useTranslation()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)

  // Student joining state
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  // Teacher creation state
  const [className, setClassName] = useState('')
  const [classDesc, setClassDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const isStudent = user?.role === 'student'
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin'

  // Classroom detail states
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people' | 'ranking'>('stream')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Local assignments list state
  const [assignments, setAssignments] = useState<any[]>([])

  const allProblems = [...dbProblems, ...mockProblems]

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  useEffect(() => {
    if (selectedClassroom) {
      const loadClassroomData = async () => {
        try {
          setMembersLoading(true)
          const [membersData, assignmentsData] = await Promise.all([
            api.fetchClassroomMembers(selectedClassroom.id),
            api.fetchClassroomAssignments(selectedClassroom.id)
          ])
          setMembers(membersData)
          setAssignments(assignmentsData)
        } catch (err: any) {
          toast.error(err.message ?? (language === 'th' ? 'ไม่สามารถโหลดข้อมูลห้องเรียนได้' : 'Failed to load classroom data'))
          setSelectedClassroom(null) // Return to class list if access is denied/failed
        } finally {
          setMembersLoading(false)
        }
      }
      void loadClassroomData()
      setActiveTab('stream')
    } else {
      setMembers([])
      setAssignments([])
    }
  }, [selectedClassroom, language])

  // Creation form state for new assignment
  const [newAssignTitle, setNewAssignTitle] = useState('')
  const [newAssignProblemId, setNewAssignProblemId] = useState('p1')
  const [newAssignDueDate, setNewAssignDueDate] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)

  const handleAssignClasswork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isStudent) {
      toast.error(language === 'th' ? 'นักเรียนไม่ได้รับอนุญาตให้สั่งการบ้าน' : 'Students are not allowed to assign classwork')
      return
    }
    if (!newAssignTitle.trim() || !newAssignDueDate) {
      toast.error(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบทุกช่อง' : 'Please fill out all fields')
      return
    }

    try {
      if (!selectedClassroom) return
      setCreating(true)
      const newAssignment = await api.createAssignment(
        selectedClassroom.id,
        newAssignTitle.trim(),
        '', // description
        newAssignDueDate,
        [newAssignProblemId]
      )
      setAssignments((prev) => [newAssignment, ...prev])
      toast.success(
        language === 'th'
          ? `สั่งการบ้าน "${newAssignTitle}" สำเร็จแล้ว!`
          : `Assigned "${newAssignTitle}" successfully!`
      )
      setNewAssignTitle('')
      setNewAssignDueDate('')
      setShowAssignForm(false)
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'การสั่งการบ้านล้มเหลว' : 'Failed to assign classwork'))
    } finally {
      setCreating(false)
    }
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

  // Fetch classrooms from backend
  const loadClassrooms = async () => {
    try {
      setLoading(true)
      const data = await api.fetchClassrooms()
      setClassrooms(data)
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'ไม่สามารถโหลดห้องเรียนได้' : 'Failed to load classrooms'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      void loadClassrooms()
    }
  }, [user])

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success(language === 'th' ? 'คัดลอกรหัสเข้าเรียนแล้ว' : 'Class code copied')
  }

  // Handle student join class
  const handleJoinClass = async () => {
    if (!joinCode.trim()) return
    try {
      setJoining(true)
      const newClass = await api.joinClassroomByCode(joinCode)
      setClassrooms((prev) => [newClass, ...prev])
      toast.success(
        language === 'th'
          ? `เข้าร่วมห้องเรียนสำเร็จ: ${newClass.name}`
          : `Successfully joined class: ${newClass.name}`
      )
      setJoinCode('')
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'เข้าร่วมห้องเรียนล้มเหลว' : 'Failed to join class'))
    } finally {
      setJoining(false)
    }
  }

  // Handle teacher create class
  const handleCreateClass = async () => {
    if (!className.trim()) {
      toast.error(language === 'th' ? 'กรุณากรอกชื่อห้องเรียน' : 'Class name is required')
      return
    }
    try {
      setCreating(true)
      const newClass = await api.createClassroom(className, classDesc)
      setClassrooms((prev) => [newClass, ...prev])
      toast.success(
        language === 'th'
          ? `สร้างห้องเรียนสำเร็จ: ${newClass.name}`
          : `Classroom created: ${newClass.name}`
      )
      setClassName('')
      setClassDesc('')
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'สร้างห้องเรียนล้มเหลว' : 'Failed to create classroom'))
    } finally {
      setCreating(false)
    }
  }

  // Handle student leave class
  const handleLeaveClass = async (classId: string, name: string) => {
    const confirmMsg = language === 'th'
      ? `คุณแน่ใจหรือไม่ว่าต้องการออกจากห้องเรียน ${name}?`
      : `Are you sure you want to leave ${name}?`
    if (!window.confirm(confirmMsg)) return
    try {
      await api.leaveClassroom(classId)
      setClassrooms((prev) => prev.filter((c) => c.id !== classId))
      if (selectedClassroom?.id === classId) {
        setSelectedClassroom(null)
      }
      toast.success(
        language === 'th'
          ? `ออกจากห้องเรียนสำเร็จ: ${name}`
          : `Successfully left class: ${name}`
      )
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'ออกจากห้องเรียนล้มเหลว' : 'Failed to leave class'))
    }
  }

  // Handle teacher delete class
  const handleDeleteClass = async (classId: string, name: string) => {
    if (isStudent) {
      toast.error(language === 'th' ? 'นักเรียนไม่ได้รับอนุญาตให้ลบห้องเรียน' : 'Students are not allowed to delete classrooms')
      return
    }
    const confirmMsg = language === 'th'
      ? `คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียน ${name}? การดำเนินการนี้เป็นแบบถาวร`
      : `Are you sure you want to delete ${name}? This action is permanent.`
    if (!window.confirm(confirmMsg)) return
    try {
      await api.deleteClassroom(classId)
      setClassrooms((prev) => prev.filter((c) => c.id !== classId))
      if (selectedClassroom?.id === classId) {
        setSelectedClassroom(null)
      }
      toast.success(
        language === 'th'
          ? `ลบห้องเรียนสำเร็จ: ${name}`
          : `Successfully deleted classroom: ${name}`
      )
    } catch (err: any) {
      toast.error(err.message ?? (language === 'th' ? 'ลบห้องเรียนล้มเหลว' : 'Failed to delete classroom'))
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {selectedClassroom ? (
        // GOOGLE CLASSROOM WORKSPACE
        <div className="space-y-6">
          {/* Header & Back Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <Button
              variant="ghost"
              onClick={() => setSelectedClassroom(null)}
              className="flex items-center gap-2 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors w-fit -ml-2 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              {language === 'th' ? 'กลับไปที่หน้าห้องเรียนทั้งหมด' : 'Back to Classes'}
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
                onClick={() => copyCode(selectedClassroom.code)}
              >
                <Copy className="h-3.5 w-3.5" />
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
                      layoutId="classesActiveTabUnderline"
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
                        {language === 'th' ? 'กำหนดส่งเร็วๆ นี้' : 'Upcoming Work'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {assignments.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">
                          {language === 'th' ? 'ไม่มีงานที่จะต้องส่งในเร็วๆ นี้!' : 'Woohoo, no work due soon!'}
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
                            {language === 'th' ? 'ดูทั้งหมด →' : 'View all →'}
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
                      {(user?.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div 
                      className="flex-1 bg-muted/50 hover:bg-muted/80 text-xs text-muted-foreground rounded-full px-4 py-2.5 border border-border/50 cursor-pointer transition-colors"
                      onClick={() => setActiveTab('classwork')}
                    >
                      {language === 'th' ? 'มีประกาศงานหรือสั่งงานสำหรับชั้นเรียน...' : 'Share something with your class...'}
                    </div>
                  </Card>

                  {/* Feed of assignments */}
                  <div className="space-y-4">
                    {membersLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <span className="text-xs font-medium">
                          {language === 'th' ? 'กำลังโหลดกระดานข่าวสาร...' : 'Loading stream feed...'}
                        </span>
                      </div>
                    ) : assignments.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 py-16 text-center text-xs text-muted-foreground">
                        {language === 'th' ? 'ห้องเรียนนี้ยังไม่มีการประกาศหรือสั่งงาน' : 'This classroom stream is empty.'}
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
                                    {selectedClassroom.teacherName || (language === 'th' ? 'คุณครู' : 'Instructor')}{' '}
                                    <span className="text-muted-foreground font-normal">
                                      {language === 'th' ? 'ได้สั่งงานใหม่:' : 'posted a new assignment:'}
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
                                    const pInfo = allProblems.find((p) => p.id === pid)
                                    return (
                                      <span key={pid} className="rounded bg-accent/70 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/5">
                                        {pInfo?.title || `Problem #${pid}`}
                                      </span>
                                    )
                                  })}
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <Button size="sm" className="h-8 text-[11px] font-bold gap-1 cursor-pointer" asChild>
                                    <Link to={a.problemIds && a.problemIds.length > 0 ? `/app/problems/${a.problemIds[0]}` : "/app/problems"}>
                                      {language === 'th' ? 'ทำแบบฝึกหัด' : 'Solve Task'}
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
                {isTeacherOrAdmin && (
                  <div className="border border-dashed border-border/80 p-4 rounded-xl bg-muted/20">
                    {showAssignForm ? (
                      <form onSubmit={handleAssignClasswork} className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {language === 'th' ? 'สั่งการบ้านใหม่' : 'New Assignment'}
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
                              {allProblems.map((p) => (
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
                        {language === 'th' ? 'สั่งการบ้านใหม่สำหรับห้องเรียน' : 'Assign Class Work'}
                      </Button>
                    )}
                  </div>
                )}

                {/* List of Tasks */}
                <div className="space-y-3">
                  {membersLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs">
                        {language === 'th' ? 'กำลังโหลดการบ้านประจำชั้นเรียน...' : 'Loading classroom assignments...'}
                      </span>
                    </div>
                  ) : assignments.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground py-10 border border-dashed border-border rounded-lg">
                      {language === 'th' ? 'ห้องเรียนนี้ยังไม่มีการมอบหมายงาน' : 'No class work assigned yet.'}
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
                            const pInfo = allProblems.find((p) => p.id === pid)
                            return (
                              <span key={pid} className="hidden md:inline-block rounded bg-muted border border-border px-2 py-0.5 text-[10px] text-muted-foreground font-semibold">
                                {pInfo?.title || `Problem #${pid}`}
                              </span>
                            )
                          })}
                          <Button size="sm" className="h-8 text-xs font-semibold cursor-pointer" asChild>
                            <Link to={a.problemIds && a.problemIds.length > 0 ? `/app/problems/${a.problemIds[0]}` : "/app/problems"}>
                              {language === 'th' ? 'ทำแบบฝึกหัด' : 'Solve'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                        {language === 'th' ? 'ครูผู้สอนประจำวิชา' : 'Primary Instructor'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Classmates Section */}
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                    {language === 'th' ? 'เพื่อนร่วมชั้น' : 'Classmates'}
                  </h2>
                  {membersLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs">
                        {language === 'th' ? 'กำลังโหลดรายชื่อเพื่อนร่วมชั้น...' : 'Loading classmate list...'}
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
                      {language === 'th' ? 'กำลังโหลดอันดับ...' : 'Loading standings...'}
                    </span>
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-10 border border-dashed border-border rounded-lg">
                    {language === 'th' ? 'ยังไม่มีคะแนนอันดับในขณะนี้' : 'No classroom rankings available yet.'}
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
                            const isSelf = m.id === user?.id
                            return (
                              <tr 
                                key={m.id} 
                                className={cn(
                                  "transition-colors hover:bg-muted/50",
                                  isSelf && "bg-accent/30 font-semibold"
                                )}
                              >
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
                                  <div className="flex items-center gap-2">
                                    <Link 
                                      to={`/app/profile?userId=${m.id}`} 
                                      className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer"
                                    >
                                      {m.name || (language === 'th' ? 'ไม่ระบุชื่อ' : 'Anonymous')}
                                    </Link>
                                    {isSelf && (
                                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/20">
                                        {language === 'th' ? 'คุณ' : 'You'}
                                      </span>
                                    )}
                                  </div>
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
        // ALL CLASSROOMS GRID & JOIN/CREATE FORM
        <>
          <PageHeader 
            title={language === 'th' ? 'ห้องเรียน' : 'Classes'} 
            description={
              isStudent 
                ? (language === 'th' ? 'เข้าร่วมห้องเรียนด้วยรหัส หรือจัดการชั้นเรียนที่คุณเรียนอยู่' : 'Join with a code or view enrolled classes.') 
                : (language === 'th' ? 'สร้างห้องเรียนใหม่และบริหารการเรียนการสอนของคุณ' : 'Create and manage your classrooms.')
            } 
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Join / Create Column */}
            <div className="lg:col-span-1 space-y-6">
              {isStudent ? (
                <Card className="border border-border/80 shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      {language === 'th' ? 'เข้าร่วมห้องเรียน' : 'Join Class'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'th' ? 'ป้อนรหัส 7 หลักที่ได้รับจากคุณครูของคุณ' : 'Enter the 7-character code from your teacher.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="e.g. ALGO7X2"
                      value={joinCode}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value.toUpperCase())}
                      className="font-mono uppercase text-center tracking-widest text-lg h-11"
                      maxLength={7}
                      disabled={joining}
                    />
                    <Button
                      onClick={handleJoinClass}
                      className="w-full h-10 font-medium cursor-pointer"
                      disabled={joining || joinCode.trim().length !== 7}
                    >
                      {joining ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {language === 'th' ? 'กำลังเข้าร่วม...' : 'Joining...'}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {language === 'th' ? 'เข้าร่วมห้องเรียน' : 'Join Class'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-border/80 shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      {language === 'th' ? 'สร้างห้องเรียน' : 'Create Class'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'th' ? 'เริ่มต้นเปิดวิชาเรียนใหม่สำหรับนักเรียน' : 'Launch a new classroom space for students.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="className" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {language === 'th' ? 'ชื่อห้องเรียน' : 'Class Name'}
                      </label>
                      <Input
                        id="className"
                        placeholder="e.g. Algorithms Section 1"
                        value={className}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setClassName(e.target.value)}
                        disabled={creating}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="classDesc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {language === 'th' ? 'รายละเอียดคลาส' : 'Description'}
                      </label>
                      <textarea
                        id="classDesc"
                        placeholder={language === 'th' ? 'หลักสูตร กฎเกณฑ์ หรือตารางเวลาสอน...' : 'Provide a syllabus, rules, or schedule...'}
                        value={classDesc}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setClassDesc(e.target.value)}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={creating}
                      />
                    </div>
                    <Button
                      onClick={handleCreateClass}
                      className="w-full h-10 font-medium cursor-pointer"
                      disabled={creating || !className.trim()}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {language === 'th' ? 'กำลังสร้าง...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {language === 'th' ? 'สร้างห้องเรียน' : 'Create Class'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Classrooms List Column */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {isStudent 
                  ? (language === 'th' ? 'ห้องเรียนที่เข้าเรียน' : 'Enrolled Classes') 
                  : (language === 'th' ? 'ห้องเรียนของฉัน' : 'My Classrooms')
                }
              </h2>

              {loading ? (
                <div className="animate-pulse grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-5 border border-border/60 bg-card rounded-xl space-y-3 shadow-sm">
                      <div className="h-5 w-2/3 bg-muted rounded-md" />
                      <div className="h-4 w-1/2 bg-muted rounded-md" />
                      <div className="h-1.5 w-full bg-muted rounded-md mt-2" />
                    </div>
                  ))}
                </div>
              ) : classrooms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 py-16 text-center text-sm text-muted-foreground px-6">
                  {isStudent 
                    ? (language === 'th' ? 'คุณยังไม่เคยเข้าร่วมห้องเรียนใดเลย กรอกรหัสห้องเรียนทางด้านซ้ายเพื่อเข้าร่วม!' : "You haven't enrolled in any classes yet. Enter a code on the left to join!") 
                    : (language === 'th' ? 'ยังไม่ได้สร้างห้องเรียนใดๆ ไว้เลย สร้างห้องเรียนทางด้านซ้ายเพื่อเริ่มต้นห้องเรียนสอนโค้ดของคุณ!' : "No classrooms created yet. Create a class on the left to begin teaching!")}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {classrooms.map((c) => {
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
                              {c.description || (language === 'th' ? 'ไม่มีคำอธิบายคลาส' : 'No description')}
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
                              {language === 'th' ? 'รายละเอียดชั้นเรียน' : 'Class Details'}
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
                              onClick={() => copyCode(c.code)}
                              className="flex items-center gap-1.5 rounded bg-muted hover:bg-muted/80 px-2.5 py-1 text-[10px] font-bold text-muted-foreground shadow-sm transition border border-border/50 cursor-pointer"
                            >
                              {copiedCode === c.code ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                              {c.code}
                            </button>
                          </div>

                          {isStudent && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              onClick={(e) => {
                                  e.stopPropagation()
                                  handleLeaveClass(c.id, c.name)
                              }}
                              title={language === 'th' ? 'ออกจากคลาส' : 'Leave Class'}
                            >
                              <LogOut className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isTeacherOrAdmin && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClass(c.id, c.name)
                              }}
                              title={language === 'th' ? 'ลบห้องเรียน' : 'Delete Class'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
