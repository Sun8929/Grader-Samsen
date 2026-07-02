import { useAppStore } from '@/store/useAppStore'
import { translations } from './translations'

export type Lang = 'en' | 'th'
export type TranslationKeys = typeof translations.en

export function getTranslation(lang: Lang, path: string, variables?: Record<string, string | number>): string {
  const parts = path.split('.')
  let current: any = translations[lang] || translations.en
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      // Fallback to English
      let fallback: any = translations.en
      for (const fPart of parts) {
        if (fallback && typeof fallback === 'object' && fPart in fallback) {
          fallback = fallback[fPart]
        } else {
          return path
        }
      }
      current = fallback
      break
    }
  }
  
  if (typeof current !== 'string') {
    return path
  }
  
  if (variables) {
    let result = current
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value))
    }
    return result
  }
  
  return current
}

export function useTranslation() {
  const language = useAppStore((s) => s.language) || 'en'
  const setLanguage = useAppStore((s) => s.setLanguage)
  
  const t = (path: string, variables?: Record<string, string | number>) => {
    return getTranslation(language, path, variables)
  }
  
  return { t, language, setLanguage }
}
