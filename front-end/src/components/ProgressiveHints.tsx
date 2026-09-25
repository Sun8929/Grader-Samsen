import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/utils/i18n'

export default function ProgressiveHints({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0)
  const { language } = useTranslation()
  if (!hints.length) return null
  return <Card className="no-card-hover space-y-4 p-4">
    <h2 className="text-sm font-semibold">{language === 'th' ? 'คำใบ้ทีละขั้น' : 'Progressive hints'}</h2>
    <p className="text-xs text-muted-foreground">{language === 'th' ? 'ลองคิดก่อนเปิดคำใบ้ถัดไป' : 'Try the idea before revealing the next hint.'}</p>
    <ol className="space-y-3" aria-live="polite">
      {hints.slice(0, revealed).map((hint, i) => <li key={i} className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap break-words"><strong>{language === 'th' ? 'คำใบ้' : 'Hint'} {i + 1}</strong><p className="mt-2">{hint}</p></li>)}
    </ol>
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" disabled={revealed >= hints.length} onClick={() => setRevealed(n => n + 1)}>{language === 'th' ? 'เปิดคำใบ้ถัดไป' : 'Reveal next hint'}</Button>
      <span className="text-xs text-muted-foreground">{revealed} / {hints.length}</span>
      {revealed > 0 && <button className="text-xs underline" onClick={() => setRevealed(0)}>{language === 'th' ? 'ซ่อนคำใบ้' : 'Hide hints'}</button>}
    </div>
  </Card>
}
