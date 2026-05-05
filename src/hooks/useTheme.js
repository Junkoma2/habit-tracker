import { useState, useCallback } from 'react'
import { THEMES, applyTheme } from '../components/SettingsModal'

const THEME_STORAGE_KEY = 'habit-tracker-theme'

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved) return THEMES.find(t => t.id === saved) ?? THEMES[0]
  } catch {}
  return THEMES[0]
}

export function useTheme() {
  const [themeId, setThemeId] = useState(() => {
    const t = loadTheme()
    applyTheme(t)
    return t.id
  })

  const handleThemeSelect = useCallback((theme) => {
    applyTheme(theme)
    setThemeId(theme.id)
    localStorage.setItem(THEME_STORAGE_KEY, theme.id)
  }, [])

  return { themeId, handleThemeSelect }
}
