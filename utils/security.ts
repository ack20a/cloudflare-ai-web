// 安全工具类
export class SecurityUtils {
  // 输入内容清理
  static sanitizeInput(input: string): string {
    // 移除潜在的XSS攻击代码
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }

  // 验证文件类型
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  // 验证文件大小
  static validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  // 生成随机会话ID
  static generateSessionId(): string {
    return crypto.randomUUID()
  }

  // 敏感信息检测
  static detectSensitiveInfo(content: string): {
    hasSensitiveInfo: boolean
    types: string[]
  } {
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(?:\+?86)?1[3-9]\d{9}\b/g,
      idCard: /\b\d{15}|\d{18}\b/g,
      creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      apiKey: /\b(?:sk-|pk_|rk_)[a-zA-Z0-9]{20,}\b/g
    }

    const detectedTypes: string[] = []
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(content)) {
        detectedTypes.push(type)
      }
    }

    return {
      hasSensitiveInfo: detectedTypes.length > 0,
      types: detectedTypes
    }
  }

  // 内容长度限制
  static validateContentLength(content: string, maxLength: number = 50000): boolean {
    return content.length <= maxLength
  }

  // 频率限制检查
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests: number[] = []
    
    return (): boolean => {
      const now = Date.now()
      const cutoff = now - windowMs
      
      // 清理过期请求
      while (requests.length > 0 && requests[0] < cutoff) {
        requests.shift()
      }
      
      // 检查是否超出限制
      if (requests.length >= maxRequests) {
        return false
      }
      
      requests.push(now)
      return true
    }
  }

  // 本地存储加密
  static encryptData(data: string, key: string): string {
    // 简单的XOR加密（实际应用中应使用更强的加密算法）
    let result = ''
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      )
    }
    return btoa(result)
  }

  static decryptData(encryptedData: string, key: string): string {
    try {
      const data = atob(encryptedData)
      let result = ''
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }
      return result
    } catch {
      return ''
    }
  }
}

// 内容安全策略
export class ContentSecurityPolicy {
  private static bannedDomains = [
    'example-malicious.com',
    'spam-site.org'
  ]

  private static suspiciousPatterns = [
    /(?:password|pwd|pass)\s*[:=]\s*\S+/gi,
    /(?:token|key|secret)\s*[:=]\s*\S+/gi,
    /\b(?:admin|root|administrator)\b/gi
  ]

  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return !this.bannedDomains.includes(urlObj.hostname)
    } catch {
      return false
    }
  }

  static scanContent(content: string): {
    safe: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // 检查可疑模式
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        issues.push('检测到可能的敏感信息')
        break
      }
    }

    // 检查恶意URL
    const urlPattern = /https?:\/\/[^\s]+/g
    const urls = content.match(urlPattern) || []
    for (const url of urls) {
      if (!this.validateUrl(url)) {
        issues.push('检测到可疑链接')
        break
      }
    }

    return {
      safe: issues.length === 0,
      issues
    }
  }
}

// 使用示例
export function useSecureChat() {
  const rateLimiter = SecurityUtils.createRateLimiter(10, 60000) // 每分钟最多10次请求

  const secureInput = (input: string): {
    content: string
    warnings: string[]
  } => {
    const warnings: string[] = []
    
    // 清理输入
    const cleanContent = SecurityUtils.sanitizeInput(input)
    
    // 检查敏感信息
    const sensitiveCheck = SecurityUtils.detectSensitiveInfo(cleanContent)
    if (sensitiveCheck.hasSensitiveInfo) {
      warnings.push(`检测到敏感信息: ${sensitiveCheck.types.join(', ')}`)
    }
    
    // 检查内容安全
    const securityCheck = ContentSecurityPolicy.scanContent(cleanContent)
    if (!securityCheck.safe) {
      warnings.push(...securityCheck.issues)
    }
    
    // 检查长度
    if (!SecurityUtils.validateContentLength(cleanContent)) {
      warnings.push('内容长度超出限制')
    }
    
    return {
      content: cleanContent,
      warnings
    }
  }

  const checkRateLimit = (): boolean => {
    return rateLimiter()
  }

  return {
    secureInput,
    checkRateLimit
  }
}
