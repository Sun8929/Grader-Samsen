import { cn } from '@/lib/utils'
import samsenLogo from '@/assets/samsen-logo.png'

export function BrandMark({ className, hideText = false }: { className?: string; hideText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-3 select-none', className)}>
      <img
        src={samsenLogo}
        alt="Samsen Wittayalai School"
        className="h-8 w-8 object-contain shrink-0 transition-transform duration-300 hover:scale-105"
      />
      {!hideText && (
        <span className="font-bold tracking-tight text-foreground text-lg flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-foreground">Grader</span>
          <span className="text-primary transition-colors duration-300 drop-shadow-[0_0_8px_var(--color-primary-glow)]">Samsen</span>
        </span>
      )}
    </span>
  )
}

