import Editor from '@monaco-editor/react'
import { jetbrainsMono } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface CodeEditorProps {
  problemId: string
  language: string
  value: string
  onChange: (value: string) => void
  height?: string
}

export default function CodeEditor({
  problemId,
  language,
  value,
  onChange,
  height = '420px',
}: CodeEditorProps) {
  const isDark = useAppStore((s) => s.isDark)
  const setDraftCode = useAppStore((s) => s.setDraftCode)

  const monacoLang =
    language === 'cpp' ? 'cpp' :
    language === 'c' ? 'c' :
    language === 'js' || language === 'javascript' ? 'javascript' :
    'cpp'

  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-sm">
      <Editor
        height={height}
        language={monacoLang}
        theme={isDark ? 'vs-dark' : 'light'}
        value={value}
        onChange={(v) => {
          const code = v ?? ''
          onChange(code)
          setDraftCode(problemId, code)
        }}
        options={{
          fontFamily: jetbrainsMono,
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          lineNumbers: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  )
}
