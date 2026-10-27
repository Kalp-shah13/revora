'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Enforce light theme on mount
  useEffect(() => {
    localStorage.setItem('rf-theme', 'light')
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
    setTheme('light')
    setMounted(true)
  }, [])

  function applyTheme(_t: Theme) {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
  }

  function toggle() {
    // Light-only theme enforced
    applyTheme('light')
  }

  // Prevent flash — hide until mounted
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
