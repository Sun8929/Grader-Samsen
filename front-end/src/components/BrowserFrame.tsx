import type { ReactNode } from 'react'
import { SITE_NAME } from '@/lib/brand'
import { cn } from '@/lib/utils'

export function BrowserFrame({
  children,
  path = '/app',
  className,
}: {
  children: ReactNode
  path?: string
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-sm', className)}>
      <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex min-w-0 flex-1 items-center rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="truncate font-medium text-foreground">{SITE_NAME}</span>
          <span className="ml-2 truncate opacity-70">{path}</span>
        </div>
      </div>
      <div className="bg-muted/30 p-6">{children}</div>
    </div>
  )
}
