<script setup lang="ts">
import MarkdownIt from "markdown-it"
import hljs from "highlight.js";
import 'highlight.js/styles/github-dark-dimmed.min.css'
import markdownItKatex from "markdown-it-katex"
import "katex/dist/katex.min.css"
import { useClipboard } from '@vueuse/core'

defineProps<{
  history: HistoryItem[]
  loading: boolean
}>()

const emit = defineEmits(['retry', 'quote'])

const { copy, copied } = useClipboard()
const copiedId = ref<number | null>(null)
const showQuote = ref(false)
const quotePos = ref({ x: 0, y: 0 })
const selectionText = ref('')

function handleMouseUp() {
  setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        showQuote.value = false
        return
      }
      
      const text = selection.toString().trim()
      selectionText.value = text
      
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      quotePos.value = {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
      showQuote.value = true
  }, 10)
}

function handleQuote() {
    emit('quote', selectionText.value)
    showQuote.value = false
    window.getSelection()?.removeAllRanges()
}

// Hide quote button on scroll
import { useEventListener } from '@vueuse/core'
useEventListener('scroll', () => {
    showQuote.value = false
}, { capture: true })

function copyContent(text: string, id: number) {
  copy(text)
  copiedId.value = id
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  highlight: (code, language) => {
    const validLang = !!(language && hljs.getLanguage(language));
    const highlighted = validLang
      ? hljs.highlight(code, { language }).value
      : hljs.highlightAuto(code).value;
    
    return `<div class="code-block-wrapper my-4 rounded-lg overflow-hidden bg-[#0d1117] border border-gray-700/50">
              <div class="flex items-center justify-between px-4 py-1.5 bg-[#161b22] text-gray-400 text-xs border-b border-gray-700/50">
                <span class="font-mono">${language || 'code'}</span>
                <button class="copy-btn flex items-center gap-1 hover:text-white transition-colors py-1" data-code="${encodeURIComponent(code)}">
                  <span class="i-heroicons-clipboard w-3.5 h-3.5"></span>
                  <span>Copy</span>
                </button>
              </div>
              <pre class="hljs !bg-transparent !p-4 !m-0 overflow-x-auto text-sm leading-relaxed"><code class="${language}">${highlighted}</code></pre>
            </div>`;
  },
}).use(markdownItKatex)

function handleContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const btn = target.closest('.copy-btn') as HTMLElement
  if (btn && btn.dataset.code) {
    const code = decodeURIComponent(btn.dataset.code)
    copy(code)
    
    // Visual feedback
    const originalText = btn.innerHTML
    btn.innerHTML = `<span class="i-heroicons-check w-3.5 h-3.5 text-green-500"></span><span class="text-green-500">Copied!</span>`
    setTimeout(() => {
      btn.innerHTML = originalText
    }, 2000)
  }
}
</script>

<template>
  <div class="flex flex-col space-y-6 pb-32 pt-4" @click="handleContentClick" @mouseup="handleMouseUp">
    <div v-if="showQuote" 
         class="fixed z-50 transform -translate-x-1/2 -translate-y-full px-2 py-1"
         :style="{ left: quotePos.x + 'px', top: (quotePos.y - 10) + 'px' }">
       <button @click.stop="handleQuote" 
               class="bg-black dark:bg-white text-white dark:text-black text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 hover:scale-105 transition-transform animate-in fade-in zoom-in duration-200">
          <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-4 h-4" />
          <span>Quote</span>
       </button>
    </div>
    <template v-for="(i,index) in history" :key="i.id">
      <template v-if="!i.content">
        <div class="max-w-3xl mx-auto w-full px-4 flex gap-4">
           <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-sparkles" class="text-white w-5 h-5" />
           </div>
           <USkeleton class="h-4 w-3/4"/>
        </div>
      </template>
      <template v-else>
        <!-- User Message -->
        <div v-if="i.role==='user'" class="max-w-3xl mx-auto w-full px-4 flex flex-col items-end group">
           <div class="bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-3xl px-5 py-3.5 max-w-[85%]">
              <div v-if="i.type === 'text' || i.type === 'image-prompt'" class="whitespace-pre-wrap text-gray-800 dark:text-gray-100 leading-relaxed">
                {{ i.content }}
              </div>
              <div v-else-if="i.type === 'image'" class="flex flex-wrap gap-2">
                <template v-for="img_url in i.src_url" :key="img_url">
                  <img @click="handleImgZoom($event.target as HTMLImageElement)" :src="img_url" :alt="img_url" 
                       class="max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"/>
                </template>
              </div>
           </div>
           <div class="flex gap-2 mt-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': copiedId === index}">
              <button @click.stop="copyContent(i.content, index)" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" :title="copiedId === index ? 'Copied!' : 'Copy'">
                 <UIcon :name="copiedId === index ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="w-4 h-4" />
              </button>
           </div>
        </div>

        <!-- Assistant Message -->
        <div v-else class="max-w-3xl mx-auto w-full px-4 flex gap-4 group">
           <div class="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 mt-1 bg-white dark:bg-transparent">
              <UIcon name="i-heroicons-sparkles" class="text-gray-600 dark:text-gray-300 w-5 h-5" />
           </div>
           <div class="flex-1 min-w-0 overflow-hidden">
              <div v-if="i.type === 'text'" v-html="md.render(i.content)"
                  class="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-li:marker:text-gray-400"
                  :class="index+1===history.length && loading ? 'animate-pulse':''"/>
              
              <div v-else-if="i.type === 'image'" class="flex flex-wrap gap-2">
                <template v-for="img_url in i.src_url" :key="img_url">
                  <img @click="handleImgZoom($event.target as HTMLImageElement)" :src="img_url" :alt="img_url"
                       class="max-h-96 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"/>
                </template>
              </div>
              
              <div v-else-if="i.type==='error'" class="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                {{ i.content }}
              </div>

              <div class="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': copiedId === index}" v-if="!loading || index !== history.length - 1">
                  <button @click.stop="copyContent(i.content, index)" class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                     <UIcon :name="copiedId === index ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="w-4 h-4" />
                     <span>{{ copiedId === index ? 'Copied' : 'Copy' }}</span>
                  </button>
                  <button v-if="index === history.length - 1" @click.stop="$emit('retry')" class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                     <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
                     <span>Retry</span>
                  </button>
              </div>
           </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
:deep(.prose pre) {
  @apply rounded-lg p-4 my-2 overflow-x-auto
}
:deep(.prose code) {
  @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-red-500 dark:text-red-400
}
:deep(.prose pre code) {
  @apply bg-transparent text-inherit p-0 text-sm
}
</style>