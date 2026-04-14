<script setup lang="ts">
import MarkdownIt from "markdown-it"
import hljs from "highlight.js";
import 'highlight.js/styles/github.min.css'
import markdownItKatex from "markdown-it-katex"
import "katex/dist/katex.min.css"
import { useClipboard } from '@vueuse/core'

defineProps<{
  history: HistoryItem[]
  loading: boolean
}>()

const emit = defineEmits(['retry', 'quote'])

const { copy } = useClipboard()
const copiedId = ref<number | null>(null)
const showQuote = ref(false)
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
    
    return `<div class="code-block-wrapper">
              <div class="code-block-header">
                <span class="code-lang">${language || 'code'}</span>
                <button class="copy-btn" data-code="${encodeURIComponent(code)}">Copy</button>
              </div>
              <pre class="hljs"><code class="${language}">${highlighted}</code></pre>
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
    btn.innerHTML = 'Copied'
    setTimeout(() => {
      btn.innerHTML = originalText
    }, 2000)
  }
}
</script>

<template>
  <div class="chat-list-root" @click="handleContentClick" @mouseup="handleMouseUp">
    <div v-if="showQuote" class="quote-float">
      <button @click.stop="handleQuote" class="btn btn-secondary quote-btn" type="button">
        <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="icon-16"/>
        <span>Quote</span>
      </button>
    </div>

    <template v-for="(i,index) in history" :key="i.id">
      <template v-if="!i.content">
        <div class="message-container loading-row">
          <div class="assistant-avatar assistant-avatar--loading">
            <UIcon name="i-heroicons-sparkles" class="icon-20"/>
          </div>
          <USkeleton class="loading-skeleton"/>
        </div>
      </template>

      <template v-else>
        <div v-if="i.role === 'user'" class="message-container user-message-group">
          <div class="user-bubble">
            <div v-if="i.type === 'text' || i.type === 'image-prompt'" class="user-text">
              {{ i.content }}
            </div>
            <div v-else-if="i.type === 'image'" class="image-grid">
              <template v-for="img_url in i.src_url" :key="img_url">
                <img
                  @click="handleImgZoom($event.target as HTMLImageElement)"
                  :src="img_url"
                  :alt="img_url"
                  class="chat-image"
                />
              </template>
            </div>
          </div>

          <div class="message-actions" :class="{'message-actions--visible': copiedId === index}">
            <button
              @click.stop="copyContent(i.content, index)"
              class="message-action-btn"
              :title="copiedId === index ? 'Copied' : 'Copy'"
              type="button"
            >
              <UIcon :name="copiedId === index ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="icon-16"/>
            </button>
            <button @click.stop="$emit('quote', i.content)" class="message-action-btn" title="Reply" type="button">
              <UIcon name="i-heroicons-arrow-turn-up-left" class="icon-16"/>
            </button>
          </div>
        </div>

        <div v-else class="message-container assistant-message-group">
          <div class="assistant-avatar">
            <UIcon name="i-heroicons-sparkles" class="icon-20"/>
          </div>

          <div class="assistant-content">
            <div
              v-if="i.type === 'text'"
              v-html="md.render(i.content)"
              class="markdown-content"
              :class="{'markdown-content--streaming': index + 1 === history.length && loading}"
            />

            <div v-else-if="i.type === 'image'" class="image-grid">
              <template v-for="img_url in i.src_url" :key="img_url">
                <img
                  @click="handleImgZoom($event.target as HTMLImageElement)"
                  :src="img_url"
                  :alt="img_url"
                  class="chat-image"
                />
              </template>
            </div>

            <div v-else-if="i.type === 'error'" class="error-box">
              {{ i.content }}
            </div>

            <div
              v-if="!loading || index !== history.length - 1"
              class="message-actions"
              :class="{'message-actions--visible': copiedId === index}"
            >
              <button @click.stop="copyContent(i.content, index)" class="message-action-text-btn" type="button">
                <UIcon :name="copiedId === index ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="icon-16"/>
                <span>{{ copiedId === index ? 'Copied' : 'Copy' }}</span>
              </button>
              <button @click.stop="$emit('quote', i.content)" class="message-action-text-btn" type="button">
                <UIcon name="i-heroicons-arrow-turn-up-left" class="icon-16"/>
                <span>Reply</span>
              </button>
              <button v-if="index === history.length - 1" @click.stop="$emit('retry')" class="message-action-text-btn" type="button">
                <UIcon name="i-heroicons-arrow-path" class="icon-16"/>
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
.chat-list-root {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-top: var(--space-4);
  padding-bottom: var(--space-16);
}

.quote-float {
  position: fixed;
  z-index: 50;
  left: 50%;
  bottom: var(--space-6);
  transform: translateX(-50%);
}

.quote-btn {
  box-shadow: var(--shadow-level-2);
}

.message-container {
  width: 100%;
  max-width: var(--layout-main-max);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.loading-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.loading-skeleton {
  width: 75%;
  height: var(--space-4);
}

.assistant-avatar {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-neutral-200);
  color: var(--color-secondary);
  background: var(--color-neutral-0);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.assistant-avatar--loading {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-neutral-0);
}

.user-message-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.assistant-message-group {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.user-bubble {
  max-width: 85%;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
  padding: var(--space-3) var(--space-4);
}

.user-text {
  color: var(--color-neutral-900);
  white-space: pre-wrap;
  line-height: 1.5;
}

.assistant-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chat-image {
  max-height: calc(var(--space-16) * 6);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
  cursor: pointer;
}

.error-box {
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
  background: var(--color-neutral-0);
  color: var(--color-error);
  padding: var(--space-3);
}

.message-actions {
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  opacity: 0;
  transition: opacity var(--duration-fast) ease;
}

.user-message-group:hover .message-actions,
.assistant-message-group:hover .message-actions,
.message-actions--visible {
  opacity: 1;
}

.message-action-btn {
  width: var(--space-6);
  height: var(--space-6);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-neutral-400);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.message-action-btn:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

.message-action-text-btn {
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-neutral-400);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.message-action-text-btn:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

.markdown-content {
  color: var(--color-neutral-900);
  line-height: 1.5;
}

.markdown-content--streaming {
  opacity: 0.85;
}

.icon-16 {
  width: var(--space-4);
  height: var(--space-4);
}

.icon-20 {
  width: var(--space-5);
  height: var(--space-5);
}

:deep(.markdown-content p) {
  margin: 0;
}

:deep(.markdown-content p + p) {
  margin-top: var(--space-3);
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  margin-top: var(--space-3);
  margin-bottom: var(--space-3);
  padding-left: var(--space-6);
}

:deep(.markdown-content li + li) {
  margin-top: var(--space-1);
}

:deep(.markdown-content .code-block-wrapper) {
  margin-top: var(--space-4);
  margin-bottom: var(--space-4);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-neutral-0);
}

:deep(.markdown-content .code-block-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-50);
}

:deep(.markdown-content .code-lang) {
  color: var(--color-neutral-500);
  font-size: var(--text-xs);
  font-family: Consolas, 'Courier New', monospace;
}

:deep(.markdown-content .copy-btn) {
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  background: var(--color-neutral-0);
  color: var(--color-neutral-500);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  cursor: pointer;
}

:deep(.markdown-content .copy-btn:hover) {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

:deep(.markdown-content pre.hljs) {
  margin: 0;
  padding: var(--space-4);
  overflow-x: auto;
  background: var(--color-neutral-0);
}

:deep(.markdown-content code) {
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-sm);
  background: var(--color-neutral-50);
  color: var(--color-neutral-900);
  font-size: var(--text-sm);
  padding: 0 var(--space-1);
}

:deep(.markdown-content pre code) {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
}
</style>