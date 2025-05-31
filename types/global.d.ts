// 扩展全局类型定义
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
  
  interface Performance {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }
}

export {}
