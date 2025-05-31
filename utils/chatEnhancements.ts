// 聊天增强功能
export class ChatEnhancements {
  // 打字机效果
  static async typeWriter(
    element: HTMLElement,
    text: string,
    speed: number = 30
  ): Promise<void> {
    element.textContent = ''
    for (let i = 0; i < text.length; i++) {
      element.textContent += text.charAt(i)
      await new Promise(resolve => setTimeout(resolve, speed))
    }
  }
  
  // 语音输入
  static startSpeechRecognition(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void
  ): () => void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError?.('浏览器不支持语音识别')
      return () => {}
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      onResult(transcript)
    }
    
    recognition.onerror = (event: any) => {
      onError?.(event.error)
    }
    
    recognition.start()
    
    return () => recognition.stop()
  }
  
  // 消息搜索
  static searchMessages(
    messages: HistoryItem[],
    query: string
  ): HistoryItem[] {
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return messages
    
    return messages.filter(message =>
      message.content.toLowerCase().includes(searchTerm)
    )
  }
  
  // 导出聊天记录
  static exportChat(
    messages: HistoryItem[],
    format: 'txt' | 'md' | 'json' = 'md'
  ): string {
    switch (format) {
      case 'txt':
        return messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
      
      case 'md':
        return messages.map(msg => 
          `## ${msg.role === 'user' ? '用户' : 'AI助手'}\n\n${msg.content}\n`
        ).join('\n')
      
      case 'json':
        return JSON.stringify(messages, null, 2)
      
      default:
        return JSON.stringify(messages)
    }
  }
  
  // 下载文件
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  // 消息统计
  static getMessageStats(messages: HistoryItem[]): {
    totalMessages: number
    userMessages: number
    assistantMessages: number
    totalCharacters: number
    averageMessageLength: number
  } {
    const userMessages = messages.filter(m => m.role === 'user').length
    const assistantMessages = messages.filter(m => m.role === 'assistant').length
    const totalCharacters = messages.reduce((sum, m) => sum + m.content.length, 0)
    
    return {
      totalMessages: messages.length,
      userMessages,
      assistantMessages,
      totalCharacters,
      averageMessageLength: Math.round(totalCharacters / messages.length) || 0
    }
  }
}

// 快捷键管理
export class KeyboardShortcuts {
  private static shortcuts = new Map<string, () => void>()
  
  static register(key: string, callback: () => void): void {
    this.shortcuts.set(key, callback)
  }
  
  static init(): void {
    document.addEventListener('keydown', (e) => {
      const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.shiftKey ? 'shift+' : ''}${e.altKey ? 'alt+' : ''}${e.key.toLowerCase()}`
      const callback = this.shortcuts.get(key)
      if (callback) {
        e.preventDefault()
        callback()
      }
    })
  }
  
  static unregister(key: string): void {
    this.shortcuts.delete(key)
  }
}