import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Upload, FileText, X, Check, Code, Edit } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import * as authApi from '@/lib/api'
import { useTranslation } from '@/utils/i18n'

interface InlineTestcase {
  input: string
  output: string
  isPublic: boolean
}

export default function ProblemManager() {
  const fetchProblems = useAppStore((s) => s.fetchProblems)
  const dbProblems = useAppStore((s) => s.problems)
  const [problems, setProblems] = useState(dbProblems)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null)
  const { language } = useTranslation()

  // Form State
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [xp, setXp] = useState(100)
  const [timeLimit, setTimeLimit] = useState(1000)
  const [memoryLimit, setMemoryLimit] = useState(256)
  const [statement, setStatement] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfFileName, setPdfFileName] = useState('')
  const [testcases, setTestcases] = useState<InlineTestcase[]>([
    { input: '', output: '', isPublic: true }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  useEffect(() => {
    setProblems(dbProblems)
  }, [dbProblems])

  const openCreateModal = () => {
    setIsEditMode(false)
    setEditingProblemId(null)
    setTitle('')
    setDifficulty('easy')
    setXp(100)
    setTimeLimit(1000)
    setMemoryLimit(256)
    setStatement('')
    setTagsInput('')
    setPdfUrl('')
    setPdfFileName('')
    setTestcases([{ input: '', output: '', isPublic: true }])
    setIsModalOpen(true)
  }

  const openEditModal = async (p: any) => {
    setIsEditMode(true)
    setEditingProblemId(p.id)
    setTitle(p.title)
    setDifficulty(p.difficulty)
    setXp(p.xp || 100)
    setTimeLimit(p.timeLimit || 1000)
    setMemoryLimit(p.memoryLimit || 256)
    setStatement(p.statement || '')
    setTagsInput(p.tags ? p.tags.join(', ') : '')
    setPdfUrl(p.pdfUrl || '')
    setPdfFileName(p.pdfUrl ? 'statement.pdf' : '')
    
    // Load testcases
    toast.loading(language === 'th' ? 'กำลังโหลดกรณีทดสอบ...' : 'Loading testcases...')
    try {
      const tc = await authApi.fetchProblemTestcases(p.id)
      const sanitized = tc.map((t: any) => ({
        ...t,
        input: (t.input || '').replace(/\\n/g, '\n'),
        output: (t.output || '').replace(/\\n/g, '\n')
      }))
      setTestcases(sanitized.length > 0 ? sanitized : [{ input: '', output: '', isPublic: true }])
      setIsModalOpen(true)
    } catch {
      toast.error(language === 'th' ? 'โหลดกรณีทดสอบของโจทย์ล้มเหลว' : 'Failed to load problem testcases.')
    } finally {
      toast.dismiss()
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmMsg = language === 'th'
      ? `คุณแน่ใจหรือไม่ว่าต้องการลบโจทย์ปัญหา "${name}"?`
      : `Are you sure you want to delete the problem "${name}"?`
    if (!confirm(confirmMsg)) return

    try {
      await authApi.deleteProblem(id)
      toast.success(language === 'th' ? 'ลบโจทย์ปัญหาสำเร็จแล้ว!' : 'Problem deleted successfully!')
      fetchProblems()
    } catch (err: any) {
      toast.error(err.message || (language === 'th' ? 'ลบโจทย์ปัญหาล้มเหลว' : 'Failed to delete problem.'))
    }
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error(language === 'th' ? 'รองรับเฉพาะไฟล์ PDF เท่านั้น' : 'Only PDF files are supported.')
      return
    }

    setPdfFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPdfUrl(reader.result)
        toast.success(language === 'th' ? 'แนบไฟล์ PDF เรียบร้อยแล้ว' : 'PDF successfully attached.')
      }
    };
    reader.readAsDataURL(file)
  }

  const addTestcase = () => {
    setTestcases([...testcases, { input: '', output: '', isPublic: true }])
  }

  const removeTestcase = (index: number) => {
    if (testcases.length === 1) {
      toast.warning(language === 'th' ? 'ต้องมีอย่างน้อยหนึ่งกรณีทดสอบ' : 'Must have at least one testcase.')
      return
    }
    setTestcases(testcases.filter((_, i) => i !== index))
  }

  const updateTestcase = (index: number, field: keyof InlineTestcase, value: any) => {
    const updated = [...testcases]
    updated[index] = { ...updated[index], [field]: value }
    setTestcases(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !statement.trim()) {
      toast.error(language === 'th' ? 'จำเป็นต้องระบุชื่อโจทย์และคำอธิบายโจทย์' : 'Title and Statement are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const payload = {
        title,
        statement,
        difficulty,
        timeLimit,
        memoryLimit,
        tags,
        pdfUrl: pdfUrl || undefined,
        xp: Number(xp) || 0,
        testcases: testcases.map((tc) => ({
          input: (tc.input || '').replace(/\\n/g, '\n'),
          output: (tc.output || '').replace(/\\n/g, '\n'),
          isPublic: tc.isPublic
        }))
      }

      if (isEditMode && editingProblemId) {
        await authApi.updateProblem(editingProblemId, payload)
        toast.success(language === 'th' ? 'อัปเดตโจทย์ปัญหาสำเร็จแล้ว!' : 'Problem updated successfully!')
      } else {
        await authApi.createProblem({
          ...payload,
          createdBy: 't1' // default
        })
        toast.success(language === 'th' ? 'สร้างโจทย์ปัญหาสำเร็จแล้ว!' : 'Problem created successfully!')
      }

      setIsModalOpen(false)
      fetchProblems()
    } catch (err: any) {
      toast.error(err.message || (language === 'th' ? 'บันทึกโจทย์ปัญหาล้มเหลว' : 'Failed to save problem.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={language === 'th' ? 'จัดการโจทย์ปัญหา' : 'Problem Manager'}
        description={
          language === 'th'
            ? 'สร้าง แก้ไข และยืนยันโจทย์เขียนโปรแกรมด้วยกรณีทดสอบของคุณเอง'
            : 'Create, manage, and verify coding problems with custom testcases.'
        }
      >
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> {language === 'th' ? 'เพิ่มโจทย์ปัญหา' : 'Add Problem'}
        </Button>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">{language === 'th' ? 'ชื่อโจทย์' : 'Title'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'ระดับความยาก' : 'Difficulty'}</th>
                <th className="px-6 py-3">XP</th>
                <th className="px-6 py-3">{language === 'th' ? 'ข้อจำกัด' : 'Limits'}</th>
                <th className="px-6 py-3">{language === 'th' ? 'ไฟล์ PDF แนบ' : 'PDF Attachment'}</th>
                <th className="px-6 py-3 text-right">{language === 'th' ? 'ดำเนินการ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {language === 'th' 
                      ? 'ยังไม่มีโจทย์ปัญหาถูกสร้างขึ้นในขณะนี้ คลิก "เพิ่มโจทย์ปัญหา" เพื่อสร้างใหม่!' 
                      : 'No problems created yet. Click "Add Problem" to build one!'}
                  </td>
                </tr>
              ) : (
                problems.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/app/problems/${p.id}`}
                        className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer"
                      >
                        {p.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {p.tags?.map((t) => (
                          <span key={t} className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.difficulty === 'easy' ? 'success' : p.difficulty === 'medium' ? 'warning' : 'danger'} className="capitalize">
                        {p.difficulty === 'easy' 
                          ? (language === 'th' ? 'ง่าย' : 'easy') 
                          : p.difficulty === 'medium'
                          ? (language === 'th' ? 'ปานกลาง' : 'medium')
                          : (language === 'th' ? 'ยาก' : 'hard')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-xs text-foreground">
                      {p.xp || 0} XP
                    </td>
                    <td className="px-6 py-4 font-mono text-xs tabular-nums text-muted-foreground">
                      {p.timeLimit}ms / {p.memoryLimit}MB
                    </td>
                    <td className="px-6 py-4">
                      {p.pdfUrl ? (
                        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                          <FileText className="h-4 w-4" />
                          {language === 'th' ? 'แนบแล้ว' : 'Attached'}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">{language === 'th' ? 'ไม่มี' : 'None'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditModal(p)} aria-label="Edit Problem">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id, p.title)} aria-label="Delete Problem">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold tracking-tight mb-4">
              {isEditMode 
                ? (language === 'th' ? 'แก้ไขโจทย์ปัญหาโปรแกรมมิ่ง' : 'Modify Coding Problem') 
                : (language === 'th' ? 'สร้างโจทย์ปัญหาโปรแกรมมิ่งใหม่' : 'Create New Coding Problem')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">{language === 'th' ? 'ชื่อโจทย์ปัญหา' : 'Problem Title'}</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Find First Duplicate"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'th' ? 'ระดับความยาก' : 'Difficulty'}</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="easy">{language === 'th' ? 'ง่าย (Easy)' : 'Easy'}</option>
                    <option value="medium">{language === 'th' ? 'ปานกลาง (Medium)' : 'Medium'}</option>
                    <option value="hard">{language === 'th' ? 'ยาก (Hard)' : 'Hard'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'th' ? 'รางวัล XP' : 'XP Reward'}</label>
                  <Input
                    type="number"
                    required
                    min={0}
                    value={xp}
                    onChange={(e) => setXp(Number(e.target.value))}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'th' ? 'จำกัดเวลา (ms)' : 'Time Limit (ms)'}</label>
                  <Input
                    type="number"
                    required
                    min={100}
                    max={10000}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'th' ? 'จำกัดหน่วยความจำ (MB)' : 'Memory Limit (MB)'}</label>
                  <Input
                    type="number"
                    required
                    min={16}
                    max={2048}
                    value={memoryLimit}
                    onChange={(e) => setMemoryLimit(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{language === 'th' ? 'แท็ก (คั่นด้วยจุลภาค ,)' : 'Tags (comma-separated)'}</label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. math, graph, arrays"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'th' ? 'คำอธิบายโจทย์ปัญหา (รองรับรูปแบบ Markdown)' : 'Problem Description / Statement (Markdown supported)'}
                </label>
                <textarea
                  required
                  rows={5}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder={language === 'th' ? 'อธิบายรายละเอียดโจทย์ รูปแบบข้อมูลเข้า/ออก ข้อจำกัด และตัวอย่างการทดสอบ...' : 'Describe the input, output, constraints, and samples here...'}
                  className="flex w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* PDF Uploader */}
              <div className="space-y-2 border-t border-border pt-4">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> 
                  {language === 'th' ? 'ไฟล์คำอธิบายโจทย์รูปแบบ PDF (ไม่บังคับ)' : 'Optional PDF Problem Description File'}
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 rounded-lg border border-dashed border-primary/40 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
                    <Upload className="h-4 w-4" /> {language === 'th' ? 'อัปโหลด PDF' : 'Upload PDF'}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                  </label>
                  {pdfFileName && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1.5 animate-in fade-in">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      {pdfFileName}
                      <button type="button" onClick={() => { setPdfUrl(''); setPdfFileName('') }} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {language === 'th' 
                    ? 'อัปโหลดไฟล์ PDF คำอธิบายโจทย์เพื่อให้นักเรียนสามารถอ่านโจทย์ภายในห้องแก้ไขโค้ดได้โดยตรง' 
                    : 'Upload a PDF so students can read the problem directly inside the editor without downloading.'}
                </p>
              </div>

              {/* Testcases Builder */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" /> {language === 'th' ? 'กรณีทดสอบสำหรับการตรวจโค้ด' : 'Inline Grading Testcases'}
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={addTestcase}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> {language === 'th' ? 'เพิ่มกรณีทดสอบ' : 'Add Testcase'}
                  </Button>
                </div>

                <div className="space-y-4">
                  {testcases.map((tc, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => removeTestcase(idx)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-bold text-muted-foreground">
                        {language === 'th' ? `กรณีทดสอบที่ #${idx + 1}` : `Testcase #${idx + 1}`}
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            {language === 'th' ? 'ข้อมูลนำเข้า (Input)' : 'Input Data'}
                          </label>
                          <textarea
                            rows={4}
                            value={tc.input}
                            onChange={(e) => updateTestcase(idx, 'input', e.target.value)}
                            placeholder="e.g. 5 10"
                            className="font-mono text-xs flex w-full rounded-md border border-input bg-background text-foreground px-3 py-1.5"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            {language === 'th' ? 'ผลลัพธ์ที่คาดหวัง (Output)' : 'Expected Output'}
                          </label>
                          <textarea
                            rows={4}
                            value={tc.output}
                            onChange={(e) => updateTestcase(idx, 'output', e.target.value)}
                            placeholder="e.g. 15"
                            className="font-mono text-xs flex w-full rounded-md border border-input bg-background text-foreground px-3 py-1.5"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id={`public-${idx}`}
                          type="checkbox"
                          checked={tc.isPublic}
                          onChange={(e) => updateTestcase(idx, 'isPublic', e.target.checked)}
                          className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <label htmlFor={`public-${idx}`} className="text-xs text-muted-foreground cursor-pointer">
                          {language === 'th' 
                            ? 'กรณีทดสอบสาธารณะ (นักเรียนสามารถเห็นได้ในตารางผลการรันในหน้าการส่งผลลัพธ์)' 
                            : 'Public testcase (Visible to students on grading results page)'}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting 
                    ? (isEditMode ? (language === 'th' ? 'กำลังอัปเดตโจทย์...' : 'Updating Problem…') : (language === 'th' ? 'กำลังสร้างโจทย์...' : 'Creating Problem…')) 
                    : (language === 'th' ? 'บันทึกโจทย์ปัญหา' : 'Save Problem')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
