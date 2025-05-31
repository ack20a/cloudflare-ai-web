// 统一错误处理工具
export interface AppError {
  code: string
  message: string
  details?: any
}

export class ErrorHandler {
  static handle(error: any): AppError {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络连接',
        details: error
      }
    }
    
    if (error.message?.includes('401')) {
      return {
        code: 'AUTH_ERROR',
        message: '认证失败，请检查API密钥',
        details: error
      }
    }
    
    if (error.message?.includes('429')) {
      return {
        code: 'RATE_LIMIT',
        message: 'API调用频率过高，请稍后重试',
        details: error
      }
    }
    
    if (error.message?.includes('500')) {
      return {
        code: 'SERVER_ERROR',
        message: '服务器内部错误，请稍后重试',
        details: error
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || '未知错误',
      details: error
    }
  }
}

// 重试机制
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i === maxRetries) break
      
      // 指数退避
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw lastError
}
