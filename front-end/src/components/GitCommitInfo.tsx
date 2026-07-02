import { useEffect, useState } from 'react'

interface CommitData {
  sha: string
  message: string
  url: string
  date: string
}

export function GitCommitInfo() {
  const [commit, setCommit] = useState<CommitData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestCommit = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/Sun8929/Grader-Samsen/commits?per_page=1')
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (data && data.length > 0) {
          const item = data[0]
          setCommit({
            sha: item.sha,
            message: item.commit.message.split('\n')[0],
            url: item.html_url,
            date: new Date(item.commit.author.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          })
        }
      } catch {
        // Fallback info
        setCommit({
          sha: '6d1c7fb3d2f97a5c81d234a983b6c7f8a9e04bc1',
          message: 'Update user rosters CSV parsing, settings and school crest logo',
          url: 'https://github.com/Sun8929/Grader-Samsen',
          date: 'Jun 13, 2026'
        })
      } finally {
        setLoading(false)
      }
    }
    void fetchLatestCommit()
  }, [])

  if (loading || !commit) {
    return (
      <footer className="mt-12 border-t border-border/40 pt-4 text-[10px] text-muted-foreground font-mono">
        <div>Loading log update...</div>
      </footer>
    )
  }

  return (
    <footer className="mt-12 border-t border-border/40 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-muted-foreground/80 font-mono">
      <div className="truncate max-w-[280px] sm:max-w-[450px]" title={commit.message}>
        <span>
          {commit.message}
        </span>
      </div>
      <div>
        <span>{commit.date}</span>
      </div>
    </footer>
  )
}
