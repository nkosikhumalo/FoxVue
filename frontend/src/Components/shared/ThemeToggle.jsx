import { useEffect, useState } from 'react'
import './ThemeToggle.css'

const THEME_KEY = 'foxvue_theme'

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
  return 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <span className="theme-toggle__sun" aria-hidden>☀</span>
      <span className="theme-toggle__track" aria-hidden>
        <span className="theme-toggle__thumb" />
      </span>
      <span className="theme-toggle__moon" aria-hidden>☾</span>
      <span className="theme-toggle__label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}
