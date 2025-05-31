// 性能优化工具
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map()
  
  static startTimer(label: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.metrics.set(label, duration)
      if (duration > 1000) {
        console.warn(`⚠️ Performance warning: ${label} took ${duration.toFixed(2)}ms`)
      }
    }
  }
  
  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }
}

// 内存缓存
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number
  
  constructor(ttlMinutes: number = 10) {
    this.ttl = ttlMinutes * 60 * 1000
  }
  
  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.cache.clear()
  }
}

// 请求去重
export class RequestDeduplicator {
  private static pendingRequests = new Map<string, Promise<any>>()
  
  static async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>
    }
    
    const promise = fn().finally(() => {
      this.pendingRequests.delete(key)
    })
    
    this.pendingRequests.set(key, promise)
    return promise
  }
}
