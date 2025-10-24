<script setup lang="ts">
import MarkdownIt from "markdown-it"
import hljs from "highlight.js";
import 'highlight.js/styles/github-dark-dimmed.min.css'
import markdownItKatex from "markdown-it-katex"
import "katex/dist/katex.min.css"

const props = defineProps<{
  history: HistoryItem[]
  loading: boolean
}>()

const history = toRef(props, 'history')

const emit = defineEmits<{(e: 'selectPrompt', prompt: string): void}>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  highlight: (code, language) => {
    if (language && hljs.getLanguage(language)) {
      return `<pre class="hljs"><code>${hljs.highlight(code, {language}).value}</code></pre>`;
    }
    return `<pre class="hljs"><code>${hljs.highlightAuto(code).value}</code></pre>`;
  },
}).use(markdownItKatex)

const quickPrompts = computed(() => [
  '帮我整理一份针对新员工的入职培训计划',
  '总结这周团队会议的要点并生成一封邮件',
  '为新的 AI 产品发布制作 3 条社交媒体文案'
])

const formatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  day: '2-digit'
})

function formatTimestamp(timestamp: number) {
  return formatter.format(new Date(timestamp))
}

function handlePrompt(prompt: string) {
  emit('selectPrompt', prompt)
}
</script>

<template>
  <div class="relative flex-1 overflow-hidden">
    <TransitionGroup name="fade-up" tag="ul"
                     class="flex flex-1 flex-col space-y-4 overflow-y-auto overflow-x-hidden px-1 pb-28 pt-6 scrollbar-hide">
      <template v-for="(i,index) in history" :key="i.id">
        <li v-if="!i.content" class="flex justify-start">
          <USkeleton class="loading-item"/>
        </li>
        <li v-else class="flex w-full gap-3" :class="{'flex-row-reverse text-right': i.role==='user'}">
          <div class="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/50 text-lg text-emerald-600 shadow-inner dark:border-white/10 dark:bg-emerald-500/10 dark:text-emerald-300">
            <UIcon :name="i.role==='user' ? 'i-heroicons-user-circle' : 'i-heroicons-sparkles-solid'" class="h-5 w-5"/>
          </div>
          <div class="flex max-w-[85%] flex-col gap-2">
            <div v-if="i.type === 'text' || i.type === 'image-prompt'"
                 class="message-bubble"
                 :class="i.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'">
              <article v-if="i.role !== 'assistant'" class="whitespace-pre-wrap text-left">
                {{ i.content }}
              </article>
              <article v-else class="prose prose-invert max-w-none prose-pre:break-words prose-pre:whitespace-pre-wrap"
                       v-html="md.render(i.content)"/>
            </div>
            <div v-else-if="i.type === 'image'"
                 class="message-image-grid" :class="{'self-end': i.role==='user'}">
              <template v-for="img_url in i.src_url" :key="img_url">
                <img @click="handleImgZoom($event.target as HTMLImageElement)" :src="img_url" :alt="img_url"
                     class="image" :class="i.src_url?.length === 1 ? 'max-h-64' : (i.src_url?.length === 2 ? 'max-h-40': 'max-h-28')"/>
              </template>
            </div>
            <div v-else-if="i.type==='error'"
                 class="message-bubble message-bubble-error">
              {{ i.content }}
            </div>
            <span class="timestamp" :class="{'self-end text-right': i.role==='user'}">
              {{ formatTimestamp(i.created_at) }}
            </span>
          </div>
        </li>
      </template>
    </TransitionGroup>

    <div v-if="!history.length"
         class="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div class="space-y-3">
        <span class="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Modern LLM Workspace
        </span>
        <h2 class="text-3xl font-semibold text-white drop-shadow-lg">
          准备好探索更聪明、更具表现力的对话体验了吗？
        </h2>
        <p class="text-sm text-neutral-200/80">
          选择一个提示快速开启对话，或直接输入你的想法。
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-3">
        <UButton v-for="prompt in quickPrompts" :key="prompt" variant="ghost"
                 class="group rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur transition hover:border-emerald-400/60 hover:bg-emerald-500/20"
                 size="lg" @click="handlePrompt(prompt)">
          <UIcon name="i-heroicons-sparkles-solid" class="mr-2 h-5 w-5 opacity-70 group-hover:opacity-100"/>
          {{ prompt }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.loading-item {
  @apply h-20 w-3/4 rounded-3xl bg-white/20 backdrop-blur animate-pulse dark:bg-white/10
}

.message-bubble {
  @apply rounded-3xl px-4 py-3 text-left shadow-lg ring-1 ring-black/5 transition-all duration-300 backdrop-blur
}

.message-bubble-user {
  @apply bg-emerald-500 text-white ring-emerald-400/40 dark:bg-emerald-500 dark:text-white
}

.message-bubble-assistant {
  @apply bg-white/80 text-neutral-900 ring-white/60 dark:bg-neutral-900/80 dark:text-neutral-100 dark:ring-white/10
}

.message-bubble-error {
  @apply bg-red-100/90 text-red-800 ring-red-300/60 dark:bg-red-500/20 dark:text-red-200 dark:ring-red-400/40 rounded-2xl px-4 py-3
}

.message-image-grid {
  @apply flex flex-wrap gap-2 rounded-3xl bg-white/10 p-2 backdrop-blur dark:bg-neutral-800/40
}

.image {
  @apply cursor-pointer rounded-2xl object-cover transition duration-300 hover:scale-[1.02] hover:brightness-95
}

.timestamp {
  @apply text-xs font-light text-neutral-400 dark:text-neutral-500
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all .25s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>