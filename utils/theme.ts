// 主题系统
export interface Theme {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    accent: string
  }
  fonts: {
    primary: string
    secondary: string
    mono: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
  }
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    accent: '#06b6d4'
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem'
  }
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#94a3b8',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    accent: '#22d3ee'
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem'
  }
}

export class ThemeManager {
  private static currentTheme: Theme = lightTheme
  private static listeners: ((theme: Theme) => void)[] = []

  static init(): void {
    const saved = localStorage.getItem('app_theme')
    if (saved) {
      try {
        const themeData = JSON.parse(saved)
        this.currentTheme = themeData
        this.applyTheme(this.currentTheme)
      } catch {
        this.setTheme(lightTheme)
      }
    } else {
      // 检测系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      this.setTheme(prefersDark ? darkTheme : lightTheme)
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme.name === 'auto') {
        this.setTheme(e.matches ? darkTheme : lightTheme)
      }
    })
  }

  static getCurrentTheme(): Theme {
    return this.currentTheme
  }

  static setTheme(theme: Theme): void {
    this.currentTheme = theme
    this.applyTheme(theme)
    localStorage.setItem('app_theme', JSON.stringify(theme))
    this.notifyListeners()
  }

  static setThemeByName(themeName: 'light' | 'dark'): void {
    const theme = themeName === 'dark' ? darkTheme : lightTheme
    this.setTheme(theme)
  }

  private static applyTheme(theme: Theme): void {
    const root = document.documentElement
    
    // 应用CSS变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
    
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value)
    })
    
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value)
    })
    
    root.style.setProperty('--font-primary', theme.fonts.primary)
    root.style.setProperty('--font-secondary', theme.fonts.secondary)
    root.style.setProperty('--font-mono', theme.fonts.mono)
  }

  static subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme))
  }

  // 创建自定义主题
  static createCustomTheme(name: string, overrides: Partial<Theme>): Theme {
    return {
      ...lightTheme,
      ...overrides,
      name,
      colors: { ...lightTheme.colors, ...overrides.colors },
      fonts: { ...lightTheme.fonts, ...overrides.fonts },
      spacing: { ...lightTheme.spacing, ...overrides.spacing },
      borderRadius: { ...lightTheme.borderRadius, ...overrides.borderRadius }
    }
  }
}

// Vue composable for theme
export function useTheme() {
  const currentTheme = ref(ThemeManager.getCurrentTheme())
  
  const unsubscribe = ThemeManager.subscribe((theme) => {
    currentTheme.value = theme
  })
  
  onUnmounted(() => {
    unsubscribe()
  })
  
  const setTheme = (theme: Theme) => {
    ThemeManager.setTheme(theme)
  }
  
  const setThemeByName = (name: 'light' | 'dark') => {
    ThemeManager.setThemeByName(name)
  }
  
  return {
    currentTheme: readonly(currentTheme),
    setTheme,
    setThemeByName,
    lightTheme,
    darkTheme
  }
}
