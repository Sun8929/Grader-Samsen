import { cn } from '@/lib/utils'
import samsenLogo from '@/assets/samsen-logo.png'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <img
        src={samsenLogo}
        alt="Samsen Wittayalai School"
        className="h-8 w-8 object-contain shrink-0"
      />
      <span className="font-bold tracking-tight text-foreground text-lg flex items-center gap-1.5">
        <span className="text-foreground">Grader</span>
        <span className="text-green-500 drop-shadow-[0_0_3px_rgba(34,197,94,0.2)] dark:drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]">Samsen</span>
      </span>
    </span>
  )
}

