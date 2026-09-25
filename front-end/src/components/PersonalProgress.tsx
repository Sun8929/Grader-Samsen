import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPersonalProgress, type PersonalProgressData } from '@/lib/api'
import { solvedProblems } from '@/lib/learning'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/utils/i18n'

export default function PersonalProgress() {
  const { language } = useTranslation()
  const th = language === 'th'
  const [data, setData] = useState<PersonalProgressData | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setError('')
    fetchPersonalProgress().then(d => { if (active) setData(d) }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [reload])
  const solved = solvedProblems(data?.submissions || [])
  const attempted = new Set(data?.submissions.map(s => s.problemId) || [])
  const groups = [
    { title: th ? 'ระดับความยาก' : 'Difficulty', rows: ['easy', 'medium', 'hard'].map(level => ({ label: th ? ({ easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' }[level] || level) : level, problems: data?.problems.filter(p => p.difficulty === level) || [] })) },
    { title: th ? 'หัวข้อ' : 'Topics', rows: [...new Set(data?.problems.flatMap(p => p.tags?.length ? p.tags : [th ? 'ยังไม่ระบุหัวข้อ' : 'Untagged']) || [])].sort().map(tag => ({ label: tag, problems: data?.problems.filter(p => (p.tags?.length ? p.tags : [th ? 'ยังไม่ระบุหัวข้อ' : 'Untagged']).includes(tag)) || [] })) },
  ]
  return <Card className="no-card-hover space-y-5 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{th ? 'ความก้าวหน้าของฉัน' : 'Personal progress'}</h2><Link to="/app/problems" className="text-sm text-primary underline">{th ? 'ฝึกทำโจทย์' : 'Practice problems'}</Link></div>
    {error ? <div role="alert" className="space-y-2 text-sm"><p>{error}</p><Button variant="outline" onClick={() => { setError(''); setReload(n => n + 1) }}>{th ? 'ลองอีกครั้ง' : 'Retry'}</Button></div> : !data ? <p role="status" className="text-sm text-muted-foreground">{th ? 'กำลังโหลดความก้าวหน้า...' : 'Loading progress…'}</p> : <>
      <p className="text-sm text-muted-foreground">{th ? `ทำสำเร็จ ${solved.size} โจทย์ · ลองทำ ${attempted.size} โจทย์` : `${solved.size} unique problems solved · ${attempted.size} attempted`}</p>
      {!data.submissions.length && <p className="text-sm">{th ? 'ส่งคำตอบแรกเพื่อเริ่มติดตามความก้าวหน้า' : 'Submit your first solution to start tracking your progress.'}</p>}
      <div className="grid gap-6 md:grid-cols-2">{groups.map(group => <section key={group.title} className="space-y-3"><h3 className="text-sm font-semibold">{group.title}</h3>{group.rows.map(row => {
        const count = row.problems.filter(p => solved.has(p.id)).length
        return <div key={row.label} className="space-y-1"><div className="flex justify-between gap-2 text-sm"><span className="capitalize">{row.label}</span><span className="text-muted-foreground">{count} / {row.problems.length}</span></div><progress aria-label={`${row.label}: ${count} / ${row.problems.length}`} value={count} max={row.problems.length || 1} className="h-2 w-full accent-primary" /></div>
      })}{!group.rows.length && <p className="text-sm text-muted-foreground">{th ? 'ยังไม่มีหัวข้อ' : 'No topics yet.'}</p>}</section>)}</div>
      <p className="text-xs text-muted-foreground">{th ? 'นับโจทย์ที่ผ่านแต่ละข้อเพียงครั้งเดียว โจทย์หนึ่งข้ออาจอยู่ในหลายหัวข้อ' : 'Each accepted problem counts once. A problem may belong to more than one topic.'}</p>
    </>}
  </Card>
}
