import { useState, useEffect } from 'react'
import { Download, Upload, Eye, EyeOff, Trash2, Search, Users, ShieldAlert, X, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { fetchUsers, deleteUser, updateUserRole, importUsers } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { useTranslation } from '@/utils/i18n'

import type { User } from '@/types'
import { Input } from '@/components/ui/input'

function parseCSV(text: string): string[][] {
  const result: string[][] = []
  let row: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(current.trim())
        current = ''
      } else if (char === '\n' || char === '\r') {
        row.push(current.trim())
        current = ''
        if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
          result.push(row)
        }
        row = []
        if (char === '\r' && nextChar === '\n') {
          i++
        }
      } else {
        current += char
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim())
    if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
      result.push(row)
    }
  }
  return result
}

export default function UserManager() {
  const currentUser = useAppStore((s) => s.user)
  const { language } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  // CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedUsers, setParsedUsers] = useState<Array<{
    id: string
    username: string
    name: string
    password: string
    role: string
    errors: string[]
    isValid: boolean
  }>>([])
  const [selectedImportIds, setSelectedImportIds] = useState<Record<string, boolean>>({})
  const [importResults, setImportResults] = useState<{
    successCount: number
    failedCount: number
    errors: Array<{ username?: string; error: string }>
  } | null>(null)

  const handleExportRoster = () => {
    if (users.length === 0) {
      toast.warning(language === 'th' ? 'ไม่มีผู้ใช้งานเพื่อส่งออกข้อมูล' : 'No users to export.')
      return
    }

    const csvHeaders = [
      language === 'th' ? 'ชื่อ' : 'Name', 
      language === 'th' ? 'ชื่อผู้ใช้' : 'Username', 
      'Email', 
      language === 'th' ? 'บทบาท' : 'Role', 
      language === 'th' ? 'รหัสผ่าน' : 'Password'
    ]
    const csvRows = users.map((u) => [
      u.name || '',
      u.username,
      u.email || '',
      u.role,
      u.password || '',
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'user_roster.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(language === 'th' ? 'ดาวน์โหลดข้อมูลผู้ใช้แบบ CSV สำเร็จแล้ว!' : 'Roster list CSV downloaded successfully!')
  }

  const handleDownloadTemplate = () => {
    const csvContent = 'username,name,password,role\nstd6901,John Doe,samsen123,student\nteach02,Jane Smith,samsen555,teacher\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'import_users_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(language === 'th' ? 'ดาวน์โหลดตัวอย่างไฟล์ CSV สำเร็จแล้ว!' : 'Template CSV downloaded!')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) {
        toast.error(language === 'th' ? 'ไฟล์ว่างเปล่า' : 'File is empty.')
        return
      }

      try {
        const parsedRows = parseCSV(text)
        if (parsedRows.length === 0) {
          toast.error(language === 'th' ? 'ไม่พบข้อมูลแถวในไฟล์ CSV' : 'No rows found in the CSV.')
          return
        }

        let startIndex = 0
        let usernameIdx = 0
        let nameIdx = 1
        let passwordIdx = 2
        let roleIdx = 3

        const firstRow = parsedRows[0].map((cell) => cell.toLowerCase().trim())
        const hasHeader =
          firstRow.includes('username') ||
          firstRow.includes('password') ||
          firstRow.includes('role') ||
          firstRow.includes('name')

        if (hasHeader) {
          startIndex = 1
          usernameIdx = firstRow.indexOf('username')
          nameIdx = firstRow.indexOf('name')
          passwordIdx = firstRow.indexOf('password')
          roleIdx = firstRow.indexOf('role')
        }

        if (hasHeader && (usernameIdx === -1 || passwordIdx === -1)) {
          toast.error(language === 'th' ? 'หัวคอลัมน์ CSV ต้องประกอบด้วยอย่างน้อย "username" และ "password"' : 'CSV headers must include at least "username" and "password".')
          return
        }

        const tempUsers = parsedRows.slice(startIndex).map((row, idx) => {
          const username = usernameIdx !== -1 && row[usernameIdx] ? row[usernameIdx].trim() : ''
          const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : username
          const password = passwordIdx !== -1 && row[passwordIdx] ? row[passwordIdx] : ''
          let role = roleIdx !== -1 && row[roleIdx] ? row[roleIdx].trim().toLowerCase() : 'student'

          const errors: string[] = []
          if (!username) {
            errors.push(language === 'th' ? 'ไม่พบชื่อผู้ใช้ (username)' : 'Missing username')
          } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            errors.push(language === 'th' ? 'ชื่อผู้ใช้ต้องเป็นตัวอักษร/ตัวเลข/ขีดล่างเท่านั้น ยาว 3-20 ตัวอักษร' : 'Username must be 3-20 characters, letters/numbers/underscores only')
          }

          if (!password) {
            errors.push(language === 'th' ? 'ไม่พบรหัสผ่าน (password)' : 'Missing password')
          } else if (password.length < 6) {
            errors.push(language === 'th' ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters')
          }

          if (role !== 'student' && role !== 'teacher' && role !== 'admin') {
            role = 'student'
          }

          return {
            id: String(idx),
            username,
            name,
            password,
            role,
            errors,
            isValid: errors.length === 0,
          }
        })

        setParsedUsers(tempUsers)
        const initialSelected: Record<string, boolean> = {}
        tempUsers.forEach((u) => {
          if (u.isValid) {
            initialSelected[u.id] = true
          }
        })
        setSelectedImportIds(initialSelected)
      } catch (err) {
        toast.error(language === 'th' ? 'การประมวลผลไฟล์ CSV ล้มเหลว' : 'Failed to parse CSV file.')
        console.error(err)
      }
    }
    reader.readAsText(file)
  }

  const handleExecuteImport = async () => {
    const toImport = parsedUsers.filter((u) => selectedImportIds[u.id])
    if (toImport.length === 0) {
      toast.warning(language === 'th' ? 'ไม่มีผู้ใช้ที่ถูกเลือกเพื่อนำเข้า' : 'No users selected for import.')
      return
    }

    setImporting(true)
    try {
      const payload = toImport.map(({ username, name, password, role }) => ({
        username,
        name,
        password,
        role,
      }))

      const res = await importUsers(payload)
      setImportResults({
        successCount: res.successCount,
        failedCount: res.failedCount,
        errors: res.errors,
      })

      if (res.successCount > 0) {
        toast.success(
          language === 'th' 
            ? `นำเข้าบัญชีผู้ใช้งานจำนวน ${res.successCount} คนสำเร็จแล้ว!` 
            : `Successfully imported ${res.successCount} users!`
        )
        void loadUsers()
      } else {
        toast.error(language === 'th' ? 'นำเข้าผู้ใช้ล้มเหลว' : 'Failed to import any users.')
      }
    } catch (err: any) {
      toast.error(err.message || (language === 'th' ? 'การนำเข้าล้มเหลว' : 'Import failed.'))
    } finally {
      setImporting(false)
    }
  }


  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (error) {
      toast.error(language === 'th' ? 'โหลดข้อมูลผู้ใช้งานที่ลงทะเบียนในระบบล้มเหลว' : 'Failed to load registered users')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmMsg = language === 'th'
      ? `คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งาน @${username}? การดำเนินการนี้เป็นแบบถาวรและไม่สามารถยกเลิกได้`
      : `Are you sure you want to delete the user @${username}? This action is permanent.`
    if (!window.confirm(confirmMsg)) return

    try {
      await deleteUser(userId)
      toast.success(
        language === 'th' 
          ? `ลบผู้ใช้ @${username} สำเร็จแล้ว` 
          : `User @${username} deleted successfully`
      )
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'th' ? 'ลบผู้ใช้ล้มเหลว' : 'Failed to delete user'))
    }
  }

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase()
    return (
      u.username.toLowerCase().includes(term) ||
      u.name.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term))
    )
  })

  const studentCount = users.filter((u) => u.role === 'student').length
  const teacherCount = users.filter((u) => u.role === 'teacher' || u.role === 'admin').length

  return (
    <div className="space-y-8">
      <PageHeader
        title={language === 'th' ? 'จัดการผู้ใช้งาน' : 'User manager'}
        description={
          language === 'th'
            ? 'จัดการข้อมูลบัญชีของนักเรียน ดูรหัสผ่าน ตรวจสอบสิทธิ์ และลบบัญชีผู้ใช้'
            : 'Manage student credentials, view passwords, and delete accounts.'
        }
      >
        <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
          <Upload className="mr-1 h-4 w-4" /> {language === 'th' ? 'นำเข้า CSV' : 'Import CSV'}
        </Button>
        <Button variant="outline" onClick={handleExportRoster}>
          <Download className="mr-1 h-4 w-4" /> {language === 'th' ? 'ส่งออก CSV' : 'Export CSV'}
        </Button>
      </PageHeader>

      {/* Analytics stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-accent p-2.5 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {language === 'th' ? 'ผู้ใช้งานทั้งหมด' : 'Total users'}
              </p>
              <h3 className="mt-0.5 text-xl font-bold tabular-nums">{users.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-50 p-2.5 text-green-600 dark:bg-green-950 dark:text-green-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {language === 'th' ? 'นักเรียน' : 'Students'}
              </p>
              <h3 className="mt-0.5 text-xl font-bold tabular-nums">{studentCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {language === 'th' ? 'คุณครูและผู้ดูแลระบบ' : 'Teachers & admins'}
              </p>
              <h3 className="mt-0.5 text-xl font-bold tabular-nums">{teacherCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and search bar */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            placeholder={language === 'th' ? 'ค้นหาชื่อผู้ใช้ ชื่อจริง หรืออีเมล...' : 'Search username, name, or email...'}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table content */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-semibold">{language === 'th' ? 'ข้อมูลผู้ใช้' : 'User info'}</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">{language === 'th' ? 'บทบาท' : 'Role'}</th>
                <th className="px-6 py-3 font-semibold">{language === 'th' ? 'รหัสผ่าน' : 'Password'}</th>
                <th className="px-6 py-3 font-semibold text-right">{language === 'th' ? 'ดำเนินการ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 bg-muted rounded-md" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-36 bg-muted rounded-md" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 bg-muted rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-muted rounded-md" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-6 w-12 bg-muted rounded-md ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    {language === 'th' ? 'ไม่พบผู้ใช้งานในระบบ' : 'No users found in the database.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPasswordVisible = visiblePasswords[u.id] || false
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{u.name || (language === 'th' ? 'ไม่มีชื่อแสดงผล' : 'No Name')}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">@{u.username}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email || '—'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          disabled={currentUser?.role === 'teacher' && u.role === 'admin'}
                          onChange={async (e) => {
                            const newRole = e.target.value
                            try {
                              await updateUserRole(u.id, newRole)
                              toast.success(
                                language === 'th' 
                                  ? `อัปเดตบทบาทของ @${u.username} เป็น ${newRole} สำเร็จ` 
                                  : `Updated @${u.username}'s role to ${newRole}`
                              )
                              setUsers((prev) =>
                                prev.map((usr) => (usr.id === u.id ? { ...usr, role: newRole as any } : usr))
                              )
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : (language === 'th' ? 'ปรับเปลี่ยนบทบาทล้มเหลว' : 'Failed to update role'))
                            }
                          }}
                          className={`rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            u.role === 'admin'
                              ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40'
                              : u.role === 'teacher'
                              ? 'text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-950/40'
                              : 'text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40'
                          }`}
                        >
                          <option value="student">{language === 'th' ? 'นักเรียน' : 'student'}</option>
                          <option value="teacher">{language === 'th' ? 'คุณครู' : 'teacher'}</option>
                          {currentUser?.role === 'admin' && <option value="admin">{language === 'th' ? 'ผู้ดูแลระบบ' : 'admin'}</option>}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm tracking-wide">
                            {isPasswordVisible ? u.password || `(${language === 'th' ? 'ไม่ได้เก็บข้อมูล' : 'not stored'})` : '••••••••'}
                          </span>
                          {u.password && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground"
                              onClick={() => togglePasswordVisibility(u.id)}
                              aria-label={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/30"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          aria-label={`Delete @${u.username}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-green-500/30 bg-neutral-950 p-6 shadow-[0_0_30px_rgba(34,197,94,0.15)] flex flex-col text-neutral-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {language === 'th' ? 'นำเข้าข้อมูลบัญชีผ่านไฟล์ CSV' : 'Import Users via CSV'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false)
                  setImportFile(null)
                  setParsedUsers([])
                  setImportResults(null)
                }}
                className="rounded-full p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {!importFile && !importResults && (
                <div className="space-y-4 py-8">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 hover:border-green-500/50 rounded-xl p-8 bg-neutral-900/40 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-10 w-10 text-neutral-500 mb-3" />
                    <p className="text-sm font-semibold text-neutral-300">
                      {language === 'th' ? 'ลากและวางไฟล์ CSV ของคุณที่นี่ หรือคลิกเพื่ออัปโหลดไฟล์' : 'Drag & drop your CSV file here, or click to browse'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {language === 'th' ? 'รองรับเฉพาะไฟล์ประเภท .csv เท่านั้น' : 'Only .csv files are supported'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/20 p-4">
                    <h4 className="text-sm font-bold text-neutral-200 mb-2">
                      {language === 'th' ? 'คำแนะนำรูปแบบคอลัมน์ของไฟล์ CSV' : 'CSV Template Guidelines'}
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {language === 'th' ? 'ไฟล์ CSV ของคุณต้องเรียงคอลัมน์และกำหนดหัวตาราง (Header) ดังต่อไปนี้ หากไม่มีหัวแถว ข้อมูลจะถูกจัดเรียงเรียงตามลำดับนี้พอดี:' : 'Your CSV file should include a header row with the following column names. If headers are absent, columns must follow this exact order:'}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-4 bg-neutral-950 p-2.5 rounded border border-neutral-800/80 font-mono text-xs text-green-400">
                      <span>username, name, password, role</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-950/20" onClick={handleDownloadTemplate}>
                        <Download className="h-3 w-3 mr-1" /> {language === 'th' ? 'ตัวอย่าง' : 'Template'}
                      </Button>
                    </div>
                    <ul className="mt-3 text-xs text-neutral-400 list-disc list-inside space-y-1.5">
                      <li>
                        <strong className="text-neutral-300">username:</strong> {language === 'th' ? 'ภาษาอังกฤษ/ตัวเลข/ขีดล่างเท่านั้น ยาว 3-20 ตัวอักษร (จำเป็น)' : '3-20 chars, alphanumeric & underscores only. (Required)'}
                      </li>
                      <li>
                        <strong className="text-neutral-300">name:</strong> {language === 'th' ? 'ชื่อจริง/ชื่อแสดงผลของนักเรียน (ทางเลือก, ค่าเริ่มต้นจะตรงกับ username)' : 'Student display name. (Optional, defaults to username)'}
                      </li>
                      <li>
                        <strong className="text-neutral-300">password:</strong> {language === 'th' ? 'ความยาวอย่างน้อย 6 ตัวอักษร (จำเป็น)' : 'At least 6 characters. (Required)'}
                      </li>
                      <li>
                        <strong className="text-neutral-300">role:</strong> {language === 'th' ? 'student, teacher หรือ admin (ทางเลือก, ค่าเริ่มต้นเป็น student)' : 'student, teacher, or admin. (Optional, defaults to student)'}
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {importFile && !importResults && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-white">{importFile.name}</p>
                        <p className="text-xs text-neutral-400">
                          {(importFile.size / 1024).toFixed(2)} KB • {language === 'th' ? `ตรวจพบ ${parsedUsers.length} แถว` : `${parsedUsers.length} rows detected`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImportFile(null)
                        setParsedUsers([])
                      }}
                      className="text-xs hover:bg-neutral-850 text-neutral-400 hover:text-red-400"
                    >
                      {language === 'th' ? 'ล้างไฟล์' : 'Clear File'}
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/20">
                    <div className="max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="px-4 py-2 text-center w-10">
                              <input
                                type="checkbox"
                                checked={parsedUsers.length > 0 && parsedUsers.every(u => !u.isValid || selectedImportIds[u.id])}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  const nextSelected = { ...selectedImportIds }
                                  parsedUsers.forEach(u => {
                                    if (u.isValid) {
                                      nextSelected[u.id] = checked
                                    }
                                  })
                                  setSelectedImportIds(nextSelected)
                                }}
                                className="rounded border-neutral-800 text-green-600 focus:ring-green-500 bg-neutral-950"
                              />
                            </th>
                            <th className="px-4 py-2">{language === 'th' ? 'ชื่อผู้ใช้' : 'Username'}</th>
                            <th className="px-4 py-2">{language === 'th' ? 'ชื่อจริง' : 'Name'}</th>
                            <th className="px-4 py-2">{language === 'th' ? 'รหัสผ่าน' : 'Password'}</th>
                            <th className="px-4 py-2">{language === 'th' ? 'บทบาท' : 'Role'}</th>
                            <th className="px-4 py-2">{language === 'th' ? 'สถานะ' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {parsedUsers.map((u) => (
                            <tr key={u.id} className={`hover:bg-neutral-900/40 transition-colors ${!u.isValid ? 'bg-red-950/10' : ''}`}>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="checkbox"
                                  disabled={!u.isValid}
                                  checked={selectedImportIds[u.id] || false}
                                  onChange={(e) => {
                                    setSelectedImportIds(prev => ({
                                      ...prev,
                                      [u.id]: e.target.checked
                                    }))
                                  }}
                                  className="rounded border-neutral-800 text-green-600 focus:ring-green-500 bg-neutral-950 disabled:opacity-30"
                                />
                              </td>
                              <td className="px-4 py-2 font-mono text-white">@{u.username || <span className="text-red-500">{language === 'th' ? 'ไม่มี' : 'None'}</span>}</td>
                              <td className="px-4 py-2 text-neutral-300">{u.name}</td>
                              <td className="px-4 py-2 font-mono text-neutral-450">{u.password || <span className="text-red-500">{language === 'th' ? 'ไม่มี' : 'None'}</span>}</td>
                              <td className="px-4 py-2 text-neutral-300">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  u.role === 'admin'
                                    ? 'bg-amber-950/50 text-amber-400 border border-amber-800/30'
                                    : u.role === 'teacher'
                                    ? 'bg-green-950/50 text-green-400 border border-green-800/30'
                                    : 'bg-indigo-950/50 text-indigo-400 border border-indigo-800/30'
                                }`}>
                                  {u.role === 'student' ? (language === 'th' ? 'นักเรียน' : 'student') : u.role === 'teacher' ? (language === 'th' ? 'คุณครู' : 'teacher') : (language === 'th' ? 'ผู้ดูแลระบบ' : 'admin')}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {u.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-green-500 font-bold">
                                    <Check className="h-3 w-3" /> {language === 'th' ? 'พร้อมใช้งาน' : 'Valid'}
                                  </span>
                                ) : (
                                  <span className="inline-flex flex-col gap-0.5 text-red-500 font-semibold leading-tight">
                                    {u.errors.map((err, i) => (
                                      <span key={i} className="flex items-center gap-0.5"><AlertCircle className="h-3 w-3 inline" /> {err}</span>
                                    ))}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {importResults && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-950/50 border border-green-500/30 flex items-center justify-center text-green-500">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{language === 'th' ? 'ดำเนินการนำเข้าผู้ใช้เสร็จสิ้น' : 'Import Session Finished'}</h3>
                      <p className="text-sm text-neutral-400 mt-1">{language === 'th' ? 'นี่คือตารางสรุปผลลัพธ์การนำเข้าข้อมูล:' : 'Here is a summary of the import actions taken:'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-4">
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-2xl font-bold text-green-500">{importResults.successCount}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{language === 'th' ? 'สำเร็จ' : 'Successful'}</div>
                      </div>
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-2xl font-bold text-red-400">{importResults.failedCount}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{language === 'th' ? 'ล้มเหลว' : 'Failed'}</div>
                      </div>
                    </div>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-neutral-350 font-semibold">{language === 'th' ? 'รายละเอียดบัญชีที่ไม่ผ่าน' : 'Failure Details'}</h4>
                      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950/50 max-h-[200px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                            <tr>
                              <th className="px-4 py-2 w-1/3">{language === 'th' ? 'ชื่อผู้ใช้' : 'Username'}</th>
                              <th className="px-4 py-2">{language === 'th' ? 'สาเหตุที่ล้มเหลว' : 'Reason for Failure'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800">
                            {importResults.errors.map((err, i) => (
                              <tr key={i} className="hover:bg-neutral-900/20">
                                <td className="px-4 py-2 font-mono text-neutral-350">@{err.username || 'unknown'}</td>
                                <td className="px-4 py-2 text-red-400 font-semibold">{err.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-neutral-800 pt-4 mt-4 flex items-center justify-end gap-3">
              {!importResults ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsImportModalOpen(false)
                      setImportFile(null)
                      setParsedUsers([])
                    }}
                    className="hover:bg-neutral-850 text-neutral-400 hover:text-white"
                  >
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </Button>
                  {importFile && (
                    <Button
                      onClick={handleExecuteImport}
                      disabled={importing || parsedUsers.filter((u) => selectedImportIds[u.id]).length === 0}
                      className="bg-green-600 text-black font-semibold hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:shadow-none"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {language === 'th' ? 'กำลังนำเข้า...' : 'Importing...'}
                        </>
                      ) : (
                        language === 'th' 
                          ? `นำเข้าข้อมูลที่เลือก (${parsedUsers.filter((u) => selectedImportIds[u.id]).length})` 
                          : `Import Selected (${parsedUsers.filter((u) => selectedImportIds[u.id]).length})`
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => {
                    setIsImportModalOpen(false)
                    setImportFile(null)
                    setParsedUsers([])
                    setImportResults(null)
                  }}
                  className="bg-green-600 text-black font-semibold hover:bg-green-500"
                >
                  {language === 'th' ? 'เสร็จสิ้น' : 'Done'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
