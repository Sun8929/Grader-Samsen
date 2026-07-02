import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const jetbrainsMono =
  "'JetBrains Mono', ui-monospace, monospace" as const

export const chartTick = {
  fontSize: 12,
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
} as const

export const chartTooltipStyle = {
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-card)',
  color: 'var(--color-foreground)',
} as const

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
