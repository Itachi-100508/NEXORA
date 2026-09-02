import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const THEMES = [
  { value: 'light', label: 'Light', description: 'Clean and bright' },
  { value: 'soft', label: 'Soft', description: 'Warm neutral surface' },
  { value: 'cool', label: 'Cool', description: 'Calm blue-grey' },
  { value: 'dark', label: 'Dark', description: 'Low-light navy' },
]

export const ACCENTS = [
  { value: 'blue', label: 'Blue', color: '#3157D5' },
  { value: 'indigo', label: 'Indigo', color: '#6366F1' },
  { value: 'purple', label: 'Purple', color: '#7C3AED' },
  { value: 'teal', label: 'Teal', color: '#0D9488' },
]

const THEME_KEY = 'examora_theme'
const ACCENT_KEY = 'examora_accent'

export function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (THEMES.some((t) => t.value === saved)) return saved
  return 'light'
}

export function getInitialAccent() {
  const saved = localStorage.getItem(ACCENT_KEY)
  if (ACCENTS.some((a) => a.value === saved)) return saved
  return 'blue'
}

export function applyThemeAttributes(theme, accent) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-accent', accent)
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const [accent, setAccent] = useState(getInitialAccent)

  useEffect(() => {
    applyThemeAttributes(theme, accent)
    localStorage.setItem(THEME_KEY, theme)
    localStorage.setItem(ACCENT_KEY, accent)
  }, [theme, accent])

  const value = useMemo(
    () => ({
      theme,
      accent,
      setTheme,
      setAccent,
      themes: THEMES,
      accents: ACCENTS,
    }),
    [theme, accent],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}