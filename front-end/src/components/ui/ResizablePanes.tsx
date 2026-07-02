import React, { useState, useEffect, useRef } from 'react'
import { GripVertical } from 'lucide-react'

interface ResizablePanesProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftWidth?: number // percentage (20 to 80)
  minWidth?: number // percentage
  maxWidth?: number // percentage
}

export function ResizablePanes({
  left,
  right,
  defaultLeftWidth = 50,
  minWidth = 25,
  maxWidth = 75,
}: ResizablePanesProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
    <div
      ref={containerRef}
      className="flex flex-col lg:flex-row w-full h-full relative"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) {
          .${leftClassName} {
            width: calc(${leftWidth}% - 12px) !important;
          }
          .${rightClassName} {
            width: calc(${100 - leftWidth}% - 12px) !important;
          }
        }
      `}} />

      {/* Left Pane */}
      <div className={`${leftClassName} w-full select-none lg:select-text`}>
        {left}
      </div>

      {/* Resize Divider Handle (Desktop only) */}
      <div
        onMouseDown={startResize}
        onTouchStart={startResize}
        onDoubleClick={() => setLeftWidth(defaultLeftWidth)}
        className="hidden lg:flex select-none cursor-col-resize w-[24px] justify-center relative z-20 group"
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
      <div className={`${rightClassName} w-full select-none lg:select-text`}>
        {right}
      </div>

      {/* Invisible overlay while dragging to prevent iframe/PDF cursor trapping or text selection */}
      {isDragging && (
        <div className="absolute inset-0 bg-transparent cursor-col-resize z-50" />
      )}
    </div>
  )
}
