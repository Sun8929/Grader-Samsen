import { useEffect, useState } from 'react'
import { fetchFeedback, postFeedback, type Feedback } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/utils/i18n'

export default function SubmissionFeedback({ submissionId, canWrite = false }: { submissionId: string; canWrite?: boolean }) {
  const { language } = useTranslation()
  const th = language === 'th'
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Feedback[] | null>(null)
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    if (open && !items) fetchFeedback(submissionId).then(rows => { if (active) setItems(rows) }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [open, items, submissionId])
  async function send(event: React.FormEvent) {
    event.preventDefault()
    try { const item = await postFeedback(submissionId, body); setItems(old => [...(old || []), item]); setBody('') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save feedback.') }
  }
  return <div className="space-y-2"><Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(v => !v)}>{th ? 'ความคิดเห็นจากครู' : 'Teacher feedback'}</Button>{open && <div className="space-y-3 text-sm">{error && <p role="alert" className="text-destructive">{error}</p>}{items?.map(item => <article key={item.id} className="rounded border p-3"><p>{item.body}</p><p className="mt-1 text-xs text-muted-foreground">{item.authorName} · {new Date(item.createdAt).toLocaleString()}</p></article>)}{items?.length === 0 && <p className="text-muted-foreground">{th ? 'ยังไม่มีความคิดเห็น' : 'No feedback yet.'}</p>}{canWrite && items && <form onSubmit={send} className="space-y-2"><label className="block space-y-1"><span>{th ? 'ความคิดเห็นสำหรับคำตอบนี้' : 'Feedback for this submission'}</span><textarea required maxLength={4000} rows={3} value={body} onChange={e => setBody(e.target.value)} className="w-full rounded-md border border-input bg-background p-3" /></label><Button type="submit" disabled={!body.trim()}>{th ? 'ส่งความคิดเห็น' : 'Send feedback'}</Button></form>}</div>}</div>
}
