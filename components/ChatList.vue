<script setup lang="ts">
import MarkdownIt from "markdown-it"
import markdownit from "markdown-it"
import hljs from "highlight.js";
import 'highlight.js/styles/github-dark-dimmed.min.css'
import markdownItKatex from "markdown-it-katex"
import "katex/dist/katex.min.css"

defineProps<{
  history: HistoryItem[]
  loading: boolean
}>()

// 复制功能
const {t} = useI18n()
const toast = useToast()

// 为代码块生成带复制按钮的HTML
function generateCodeBlock(code: string, language?: string): string {
  const highlightedCode = language && hljs.getLanguage(language) 
    ? hljs.highlight(code, {language}).value 
    : hljs.highlightAuto(code).value
  
  return `<pre class="hljs relative group"><code>${highlightedCode}</code><button class="copy-code-btn opacity-0 group-hover:opacity-100 absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-all z-10" onclick="copyCode(this)">${t('copy_code')}</button></pre>`
}

const md: MarkdownIt = markdownit({
  linkify: true,
  highlight: (code, language) => {
    return generateCodeBlock(code, language)
  },
}).use(markdownItKatex)

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.add({
      title: t('copied'),
      icon: 'i-heroicons-check-circle',
      timeout: 2000
    })
  }).catch(err => {
    console.error('复制失败:', err)
    toast.add({
      title: '复制失败',
      color: 'red',
      icon: 'i-heroicons-x-circle',
      timeout: 2000
    })
  })
}

function copyMessage(content: string) {
  // 移除HTML标签，只复制纯文本
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = content
  const plainText = tempDiv.textContent || tempDiv.innerText || ''
  copyToClipboard(plainText)
}

// 全局复制代码块函数
onMounted(() => {
  (window as any).copyCode = function(button: HTMLButtonElement) {
    const pre = button.closest('pre')
    const code = pre?.querySelector('code')
    if (code) {
      const text = code.textContent || ''
      navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent
        button.textContent = t('copied')
        setTimeout(() => {
          button.textContent = t('copy_code')
        }, 2000)
        
        // 全局toast提示
        if ((window as any).showCopyToast) {
          (window as any).showCopyToast()
        }
      }).catch(err => {
        console.error('复制失败:', err)
      })
    }
  }
  
  // 设置全局toast函数
  (window as any).showCopyToast = () => {
    toast.add({
      title: t('copied'),
      icon: 'i-heroicons-check-circle',
      timeout: 2000
    })
  }
  
  // 更新所有已存在的代码块复制按钮文本
  nextTick(() => {
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
      if (btn.textContent !== t('copied')) {
        btn.textContent = t('copy_code')
      }
    })
  })
})
</script>

<template>
  <ul class="overflow-y-auto overflow-x-hidden scrollbar-hide pt-24 pb-16 pl-1 flex flex-col space-y-1">
    <template v-for="(i,index) in history" :key="i.id">
      <template v-if="!i.content">
        <USkeleton class="loading-item"/>
      </template>
      <template v-else>
        <template v-if="i.role==='user'">
          <li v-if="i.type === 'text' || i.type === 'image-prompt'" class="user chat-item user-text">
            {{ i.content }}
          </li>
          <li v-else-if="i.type === 'image'" class="user image-item">
            <template v-for="img_url in i.src_url" :key="img_url">
              <img @click="handleImgZoom($event.target as HTMLImageElement)" :src="img_url" :alt="img_url" class="image"
                   :class="i.src_url?.length === 1 ? 'max-h-64' : (i.src_url?.length === 2 ? 'max-h-32': 'max-h-16')"/>
            </template>
          </li>
        </template>
        <template v-else>
          <li v-if="i.type === 'text'" class="assistant chat-item assistant-text prose prose-pre:break-words prose-pre:whitespace-pre-wrap relative group"
              :class="index+1===history.length && loading ?  'loading':''">
            <div v-html="md.render(i.content)"></div>
            <button @click="copyMessage(i.content)" 
                    class="copy-message-btn opacity-0 group-hover:opacity-100 absolute top-2 right-2 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs transition-all z-10">
              {{ t('copy_message') }}
            </button>
          </li>
          <li v-else-if="i.type === 'image'" class="assistant image-item">
            <template v-for="img_url in i.src_url" :key="img_url">
              <img @click="handleImgZoom($event.target as HTMLImageElement)" :src="img_url" :alt="img_url"
                   class="image"/>
            </template>
          </li>
          <li v-else-if="i.type==='error'" class="assistant chat-item assistant-error">
            {{ i.content }}
          </li>
        </template>
      </template>
    </template>
  </ul>
</template>

<style scoped lang="postcss">
.loading-item {
  @apply rounded-xl px-2 py-1.5 h-10 shrink-0 w-1/3 animate-pulse
}

.user {
  @apply self-end slide-top
}

.assistant {
  @apply slide-top
}

.chat-item {
  @apply break-words rounded-xl px-2 py-1.5 max-w-[95%] md:max-w-[80%]
}

.image-item {
  @apply flex rounded-xl space-x-1 max-w-[95%] md:max-w-[60%]
}

.image {
  @apply cursor-pointer hover:brightness-75 transition-all rounded-md
}

.user-text {
  @apply bg-green-500 text-white dark:bg-green-700 dark:text-gray-300
}

.assistant-text {
  @apply self-start bg-gray-200 text-black dark:bg-gray-400
}

.assistant-error {
  @apply self-start bg-red-200 dark:bg-red-400 dark:text-black
}

.user-text::selection {
  @apply text-neutral-900 bg-gray-300
}

.slide-top {
  animation: slide-top .25s cubic-bezier(.25, .46, .45, .94) both
}

@keyframes slide-top {
  0% {
    transform: translateY(0);
    opacity: 0
  }
  100% {
    transform: translateY(-16px);
    opacity: 1
  }
}
</style>