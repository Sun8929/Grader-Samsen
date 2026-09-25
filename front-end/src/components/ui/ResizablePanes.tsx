import React, { useState, useEffect, useRef } from 'react'
import { GripVertical } from 'lucide-react'
import { useTranslation } from '@/utils/i18n'

interface ResizablePanesProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftWidth?: number // percentage (20 to 80)
  minWidth?: number // percentage
  maxWidth?: number // percentage
  storageKey?: string
  allowFocus?: boolean
}

export function ResizablePanes({
  left,
  right,
  defaultLeftWidth = 50,
  minWidth = 25,
  maxWidth = 75,
  storageKey,
  allowFocus = false,
}: ResizablePanesProps) {
  const { language } = useTranslation()
  const [saved] = useState(() => {
    try { return storageKey ? JSON.parse(localStorage.getItem(storageKey) || 'null') : null } catch { return null }
  })
  const [leftWidth, setLeftWidth] = useState<number>(typeof saved?.width === 'number' && Number.isFinite(saved.width) ? Math.max(minWidth, Math.min(maxWidth, saved.width)) : defaultLeftWidth)
  const [mode, setMode] = useState<'split' | 'reading' | 'coding'>(allowFocus && ['reading', 'coding'].includes(saved?.mode) ? saved.mode : 'split')
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!storageKey || isDragging) return
    try { localStorage.setItem(storageKey, JSON.stringify({ width: leftWidth, mode })) } catch { /* Layout still works when storage is unavailable. */ }
  }, [storageKey, leftWidth, mode, isDragging])

  const startResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (clientX: number) => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((clientX - containerRect.left) / containerRect.width) * 100
      
      // Clamp the width between minWidth and maxWidth
      setLeftWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX)
      }
    }

    const stopResize = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResize)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', stopResize)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', stopResize)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', stopResize)
    }
  }, [isDragging, minWidth, maxWidth])

  const uniqueId = useRef(Math.random().toString(36).substring(2, 9)).current
  const leftClassName = `pane-left-${uniqueId}`
  const rightClassName = `pane-right-${uniqueId}`

  return (
    <>
    {allowFocus && (
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={language === 'th' ? 'รูปแบบพื้นที่ทำงาน' : 'Workspace layout'}>
        {(['split', 'reading', 'coding'] as const).map(view => (
          <button key={view} type="button" aria-pressed={mode === view} onClick={() => setMode(view)} className={`rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === view ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
            {view === 'split' ? (language === 'th' ? 'แบ่งหน้าจอ' : 'Split view') : view === 'reading' ? (language === 'th' ? 'อ่านเต็มหน้าจอ' : 'Reading mode') : (language === 'th' ? 'เขียนโค้ดเต็มหน้าจอ' : 'Coding mode')}
          </button>
        ))}
        <button type="button" className="px-3 py-2 text-sm text-muted-foreground underline" onClick={() => { setLeftWidth(defaultLeftWidth); setMode('split') }}>{language === 'th' ? 'คืนค่าเริ่มต้น' : 'Reset layout'}</button>
      </div>
    )}
    <div
      ref={containerRef}
      className="flex flex-col gap-y-6 lg:flex-row w-full h-full relative"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) {
          .${leftClassName} {
            width: ${mode === 'split' ? `calc(${leftWidth}% - 12px)` : '100%'} !important;
          }
          .${rightClassName} {
            width: ${mode === 'split' ? `calc(${100 - leftWidth}% - 12px)` : '100%'} !important;
          }
        }
      `}} />

      {/* Left Pane */}
      <div className={`${leftClassName} min-w-0 w-full ${mode === 'coding' ? 'hidden' : ''}`}>
        {left}
      </div>

      {/* Resize Divider Handle (Desktop only) */}
      <div
        role="separator"
        tabIndex={mode === 'split' ? 0 : -1}
        aria-label="Resize statement and code editor"
        aria-orientation="vertical"
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        aria-valuenow={Math.round(leftWidth)}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            setLeftWidth(w => Math.max(minWidth, Math.min(maxWidth, w + (e.key === 'ArrowLeft' ? -2 : 2))))
          }
        }}
        onMouseDown={startResize}
        onTouchStart={startResize}
        onDoubleClick={() => setLeftWidth(defaultLeftWidth)}
        className={`${mode === 'split' ? 'hidden lg:flex' : 'hidden'} shrink-0 touch-none select-none cursor-col-resize w-[24px] justify-center relative z-20 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        title="Double-click to reset layout"
      >
        {/* Thin vertical line divider */}
        <div className={`w-[2px] h-full bg-border group-hover:bg-primary/80 transition-colors duration-200 ${isDragging ? 'bg-primary' : ''}`} />
        
        {/* Grab Handle UI elements */}
        <div className={`absolute top-1/2 -translate-y-1/2 w-5 h-9 rounded-md border border-border bg-card flex items-center justify-center shadow-sm opacity-60 group-hover:opacity-100 transition-opacity duration-200 ${isDragging ? 'opacity-100 border-primary' : ''}`}>
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>

      {/* Right Pane */}
      <div className={`${rightClassName} min-w-0 w-full ${mode === 'reading' ? 'hidden' : ''}`}>
        {right}
      </div>

      {/* Invisible overlay while dragging to prevent iframe/PDF cursor trapping or text selection */}
      {isDragging && (
        <div className="absolute inset-0 bg-transparent cursor-col-resize z-50" />
      )}
    </div>
    </>
  )
}
