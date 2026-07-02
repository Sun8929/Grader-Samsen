import { motion } from 'framer-motion'
import { Languages } from 'lucide-react'
import { useTranslation } from '@/utils/i18n'

export function LanguageSwitcher({ variant = 'default' }: { variant?: 'default' | 'compact' | 'ghost' }) {
  const { language, setLanguage } = useTranslation()

  if (variant === 'ghost') {
    return (
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title={language === 'en' ? 'Switch to Thai / เปลี่ยนเป็นภาษาไทย' : 'Switch to English / เปลี่ยนเป็นภาษาอังกฤษ'}
      >
        <Languages className="h-4 w-4" />
        <span className="font-mono">{language.toUpperCase()}</span>
      </button>
    )
  }

  return (
    <div className="relative flex items-center gap-0.5 rounded-full border border-border bg-card p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`relative z-10 px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 ${
          language === 'en' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
        {language === 'en' && (
          <motion.span
            layoutId="activeLang"
            className="absolute inset-0 -z-10 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('th')}
        className={`relative z-10 px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 ${
          language === 'th' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        TH
        {language === 'th' && (
          <motion.span
            layoutId="activeLang"
            className="absolute inset-0 -z-10 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
      </button>
    </div>
  )
}
