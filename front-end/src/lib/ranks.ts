export interface Rank {
  id: string
  label: string
  minXp: number
  maxXp: number | null
  colorClass: string
  bgColorClass: string
  borderColorClass: string
  gradientClass: string
  iconName: 'Shield' | 'Medal' | 'Trophy' | 'Crown' | 'Gem' | 'Sparkles' | 'Flame' | 'Swords'
}

export const XP_RANKS: readonly Rank[] = [
  {
    id: 'bronze',
    label: 'Bronze',
    minXp: 0,
    maxXp: 999,
    colorClass: 'text-amber-800 dark:text-amber-400',
    bgColorClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderColorClass: 'border-amber-200 dark:border-amber-900/40',
    gradientClass: 'from-amber-600 to-amber-700 dark:from-amber-500 dark:to-amber-600',
    iconName: 'Shield',
  },
  {
    id: 'silver',
    label: 'Silver',
    minXp: 1000,
    maxXp: 2499,
    colorClass: 'text-slate-700 dark:text-slate-300',
    bgColorClass: 'bg-slate-50 dark:bg-slate-900/50',
    borderColorClass: 'border-slate-200 dark:border-slate-800/60',
    gradientClass: 'from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600',
    iconName: 'Medal',
  },
  {
    id: 'gold',
    label: 'Gold',
    minXp: 2500,
    maxXp: 4999,
    colorClass: 'text-yellow-800 dark:text-yellow-400',
    bgColorClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderColorClass: 'border-yellow-200 dark:border-yellow-900/40',
    gradientClass: 'from-yellow-500 to-yellow-600 dark:from-yellow-400 dark:to-yellow-500',
    iconName: 'Trophy',
  },
  {
    id: 'platinum',
    label: 'Platinum',
    minXp: 5000,
    maxXp: 9999,
    colorClass: 'text-cyan-800 dark:text-cyan-400',
    bgColorClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColorClass: 'border-cyan-200 dark:border-cyan-900/40',
    gradientClass: 'from-cyan-500 to-indigo-600 dark:from-cyan-400 dark:to-indigo-500',
    iconName: 'Crown',
  },
  {
    id: 'diamond',
    label: 'Diamond',
    minXp: 10000,
    maxXp: 19999,
    colorClass: 'text-indigo-700 dark:text-indigo-400',
    bgColorClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColorClass: 'border-indigo-200 dark:border-indigo-900/40',
    gradientClass: 'from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500',
    iconName: 'Gem',
  },
  {
    id: 'master',
    label: 'Master',
    minXp: 20000,
    maxXp: 39999,
    colorClass: 'text-purple-800 dark:text-purple-400',
    bgColorClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderColorClass: 'border-purple-200 dark:border-purple-900/40',
    gradientClass: 'from-purple-500 to-pink-600 dark:from-purple-400 dark:to-pink-500',
    iconName: 'Sparkles',
  },
  {
    id: 'grandmaster',
    label: 'Grandmaster',
    minXp: 40000,
    maxXp: 74999,
    colorClass: 'text-orange-700 dark:text-orange-400',
    bgColorClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderColorClass: 'border-orange-200 dark:border-orange-900/40',
    gradientClass: 'from-orange-500 to-red-600 dark:from-orange-400 dark:to-red-500',
    iconName: 'Flame',
  },
  {
    id: 'challenger',
    label: 'Challenger',
    minXp: 75000,
    maxXp: null,
    colorClass: 'text-red-700 dark:text-red-400',
    bgColorClass: 'bg-red-50 dark:bg-red-950/40',
    borderColorClass: 'border-red-200 dark:border-red-900/40',
    gradientClass: 'from-red-500 to-rose-700 dark:from-red-400 dark:to-rose-600',
    iconName: 'Swords',
  },
]

export interface RankInfo {
  currentRank: Rank
  nextRank: Rank | null
  xpToNext: number
  progressPercent: number
}

export function getRankFromXp(xp: number): RankInfo {
  const currentXp = Math.max(0, xp)
  
  // Find current rank
  let currentRank = XP_RANKS[0]
  for (let i = XP_RANKS.length - 1; i >= 0; i--) {
    if (currentXp >= XP_RANKS[i].minXp) {
      currentRank = XP_RANKS[i]
      break
    }
  }

  // Find next rank
  const currentIndex = XP_RANKS.findIndex((r) => r.id === currentRank.id)
  const nextRank = currentIndex < XP_RANKS.length - 1 ? XP_RANKS[currentIndex + 1] : null

  let xpToNext = 0
  let progressPercent = 100

  if (nextRank) {
    const range = nextRank.minXp - currentRank.minXp
    const earned = currentXp - currentRank.minXp
    xpToNext = nextRank.minXp - currentXp
    progressPercent = Math.min(100, Math.max(0, (earned / range) * 100))
  }

  return {
    currentRank,
    nextRank,
    xpToNext,
    progressPercent,
  }
}
