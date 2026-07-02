import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Submission, Problem } from '@/types'
import * as authApi from '@/lib/api'

interface AppState {
  user: User | null
  isDark: boolean
  language: 'en' | 'th'
  draftCode: Record<string, string>
  authReady: boolean
  problems: Problem[]
  submissions: Submission[]
  studentJoinedClassrooms: Record<string, string[]>
  studentSubmissions: Record<string, Submission[]>
  themeColor: 'emerald' | 'sapphire' | 'amethyst' | 'ruby' | 'amber'
  animationsEnabled: boolean
  setUser: (user: User | null) => void
  toggleDark: (event?: any) => void
  setLanguage: (lang: 'en' | 'th') => void
  setThemeColor: (color: 'emerald' | 'sapphire' | 'amethyst' | 'ruby' | 'amber') => void
  toggleAnimations: () => void
  setDraftCode: (problemId: string, code: string) => void
  loginWithCredentials: (username: string, password: string) => Promise<User>
  registerWithCredentials: (username: string, password: string, role?: string, teacherCode?: string) => Promise<User>
  restoreSession: () => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
  joinClassroom: (userId: string, classId: string) => void
  addSubmission: (userId: string, submission: Submission) => void
  resetStudentData: (userId: string) => void
  fetchProblems: () => Promise<void>
  fetchSubmissions: () => Promise<void>
  submitSolution: (problemId: string, language: string, code: string) => Promise<Submission>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isDark: false,
      language: (navigator.language.startsWith('th') ? 'th' : 'en') as 'en' | 'th',
      draftCode: {},
      authReady: false,
      problems: [],
      submissions: [],
      studentJoinedClassrooms: {},
      studentSubmissions: {},
      themeColor: 'emerald',
      animationsEnabled: true,
      setUser: (user) => set({ user }),
      toggleDark: (event?: any) => {
        const isDark = get().isDark
        const next = !isDark

        const toggle = () => {
          document.documentElement.classList.toggle('dark', next)
          set({ isDark: next })
        }

        const documentWithTransition = document as any

        if (
          !get().animationsEnabled ||
          !documentWithTransition.startViewTransition ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          toggle()
          return
        }

        const x = event?.clientX ?? window.innerWidth / 2
        const y = event?.clientY ?? window.innerHeight / 2
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )

        const transition = documentWithTransition.startViewTransition(toggle)

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ]
          document.documentElement.animate(
            {
              clipPath: clipPath,
            },
            {
              duration: 450,
              easing: 'ease-in-out',
              pseudoElement: '::view-transition-new(root)',
            }
          )
        })
      },
      setLanguage: (language) =>
        set(() => {
          document.documentElement.lang = language
          document.documentElement.classList.toggle('lang-th', language === 'th')
          return { language }
        }),
      setThemeColor: (themeColor) => {
        const toggle = () => {
          const colors = ['emerald', 'sapphire', 'amethyst', 'ruby', 'amber']
          colors.forEach((c) => {
            document.documentElement.classList.toggle(`theme-${c}`, c === themeColor)
          })
          set({ themeColor })
        }

        const documentWithTransition = document as any

        if (
          !get().animationsEnabled ||
          !documentWithTransition.startViewTransition ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          toggle()
          return
        }

        documentWithTransition.startViewTransition(toggle)
      },
      toggleAnimations: () =>
        set((s) => ({
          animationsEnabled: !s.animationsEnabled
        })),
      setDraftCode: (problemId, code) =>
        set((s) => ({
          draftCode: { ...s.draftCode, [problemId]: code },
        })),
      loginWithCredentials: async (username, password) => {
        const { user } = await authApi.login(username, password)
        set({ user })
        return user
      },
      registerWithCredentials: async (username, password, role, teacherCode) => {
        const { user } = await authApi.register(username, password, role, teacherCode)
        set({ user })
        return user
      },
      restoreSession: async () => {
        const user = await authApi.fetchCurrentUser()
        set({ user, authReady: true })
      },
      logout: async () => {
        await authApi.logout()
        set({ user: null })
      },
      deleteAccount: async () => {
        await authApi.deleteAccount()
        set({ user: null })
      },
      joinClassroom: (userId, classId) =>
        set((s) => {
          const current = s.studentJoinedClassrooms[userId] ?? []
          if (current.includes(classId)) return {}
          return {
            studentJoinedClassrooms: {
              ...s.studentJoinedClassrooms,
              [userId]: [...current, classId],
            },
          }
        }),
      addSubmission: (userId, submission) =>
        set((s) => {
          const current = s.studentSubmissions[userId] ?? []
          return {
            studentSubmissions: {
              ...s.studentSubmissions,
              [userId]: [submission, ...current],
            },
          }
        }),
      resetStudentData: (userId) =>
        set((s) => ({
          studentJoinedClassrooms: {
            ...s.studentJoinedClassrooms,
            [userId]: [],
          },
          studentSubmissions: {
            ...s.studentSubmissions,
            [userId]: [],
          },
        })),
      fetchProblems: async () => {
        try {
          const problems = await authApi.fetchProblems()
          set({ problems })
        } catch (err) {
          console.error('Failed to fetch problems', err)
        }
      },
      fetchSubmissions: async () => {
        try {
          const submissions = await authApi.fetchSubmissions()
          set({ submissions })
        } catch (err) {
          console.error('Failed to fetch submissions', err)
        }
      },
      submitSolution: async (problemId, language, code) => {
        const submission = await authApi.submitCodeSolution(problemId, language, code)
        
        // Also add locally
        const user = get().user
        if (user) {
          get().addSubmission(user.id, submission)
        }
        
        return submission
      },
    }),
    {
      name: 'grader-samsen',
      partialize: (s) => ({
        user: s.user,
        isDark: s.isDark,
        language: s.language,
        draftCode: s.draftCode,
        problems: s.problems,
        submissions: s.submissions,
        studentJoinedClassrooms: s.studentJoinedClassrooms,
        studentSubmissions: s.studentSubmissions,
        themeColor: s.themeColor,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isDark) {
          document.documentElement.classList.add('dark')
        }
        if (state?.language) {
          document.documentElement.lang = state.language
          document.documentElement.classList.toggle('lang-th', state.language === 'th')
        } else {
          const defaultLang = (navigator.language.startsWith('th') ? 'th' : 'en') as 'en' | 'th'
          document.documentElement.lang = defaultLang
          document.documentElement.classList.toggle('lang-th', defaultLang === 'th')
        }
        if (state?.themeColor) {
          const colors = ['emerald', 'sapphire', 'amethyst', 'ruby', 'amber']
          colors.forEach((c) => {
            document.documentElement.classList.toggle(`theme-${c}`, c === state.themeColor)
          })
        } else {
          document.documentElement.classList.add('theme-emerald')
        }
      },
    },
  ),
)
