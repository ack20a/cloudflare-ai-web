// 应用配置管理
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh' | 'en'
  autoSave: boolean
  autoSaveInterval: number // 分钟
  maxHistoryLength: number
  enableSpeechRecognition: boolean
  enableSounds: boolean
  enableNotifications: boolean
  defaultModel: string
  apiTimeout: number // 秒
  retryAttempts: number
  compressImages: boolean
  imageQuality: number // 0-1
  maxFileSize: number // MB
  shortcuts: Record<string, string>
}

export const defaultConfig: AppConfig = {
  theme: 'auto',
  language: 'zh',
  autoSave: true,
  autoSaveInterval: 5,
  maxHistoryLength: 1000,
  enableSpeechRecognition: true,
  enableSounds: true,
  enableNotifications: true,
  defaultModel: 'gemini-2.0-flash-thinking-exp-01-21-search',
  apiTimeout: 30,
  retryAttempts: 3,
  compressImages: true,
  imageQuality: 0.8,
  maxFileSize: 10,
  shortcuts: {
    'ctrl+n': 'newChat',
    'ctrl+/': 'focusInput',
    'ctrl+b': 'toggleSidebar',
    'ctrl+k': 'search',
    'ctrl+enter': 'send'
  }
}

export class ConfigManager {
  private static config: AppConfig
  private static readonly STORAGE_KEY = 'app_config'
  private static listeners: ((config: AppConfig) => void)[] = []

  static init(): AppConfig {
    const saved = localStorage.getItem(this.STORAGE_KEY)
    this.config = saved ? { ...defaultConfig, ...JSON.parse(saved) } : { ...defaultConfig }
    return this.config
  }

  static get(): AppConfig {
    return this.config || this.init()
  }

  static set(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config))
    this.notifyListeners()
  }

  static reset(): void {
    this.config = { ...defaultConfig }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config))
    this.notifyListeners()
  }

  static subscribe(listener: (config: AppConfig) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config))
  }

  // 导出配置
  static export(): string {
    return JSON.stringify(this.config, null, 2)
  }

  // 导入配置
  static import(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson)
      // 验证配置格式
      if (this.validateConfig(importedConfig)) {
        this.set(importedConfig)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  private static validateConfig(config: any): config is Partial<AppConfig> {
    // 基本验证
    if (typeof config !== 'object' || config === null) return false
    
    // 可以添加更严格的验证逻辑
    return true
  }
}

// 响应式配置Hook
export function useConfig() {
  const config = ref(ConfigManager.get())
  
  const unsubscribe = ConfigManager.subscribe((newConfig) => {
    config.value = newConfig
  })
  
  onUnmounted(() => {
    unsubscribe()
  })
  
  const updateConfig = (updates: Partial<AppConfig>) => {
    ConfigManager.set(updates)
  }
  
  const resetConfig = () => {
    ConfigManager.reset()
  }
  
  return {
    config: readonly(config),
    updateConfig,
    resetConfig
  }
}
