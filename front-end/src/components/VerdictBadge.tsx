import { Badge } from '@/components/ui/badge'
import type { Verdict } from '@/types'
import { formatVerdictShort, verdictVariant } from '@/utils/verdict'

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <Badge variant={verdictVariant(verdict)} className="font-mono">
      {formatVerdictShort(verdict)}
    </Badge>
  )
}
