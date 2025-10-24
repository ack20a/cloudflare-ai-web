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
                     class="flex flex-1 flex-col space-y-4 overflow-y-auto overflow-x-hidden px-2 pb-28 pt-4 scrollbar-hide">
      <template v-for="(i,index) in history" :key="i.id">
        <li v-if="!i.content" class="flex justify-start">
          <USkeleton class="loading-item"/>
        </li>
        <li v-else class="flex w-full gap-3" :class="{'flex-row-reverse text-right': i.role==='user'}">
          <div class="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg text-emerald-500 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-emerald-300">
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
         class="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-neutral-600 dark:text-neutral-300">
      <UIcon name="i-heroicons-chat-bubble-left-right" class="h-12 w-12 text-emerald-400"/>
      <div>
        <h2 class="text-xl font-semibold">{{ $t('new_chat') }}</h2>
        <p class="mt-2 text-sm">
          选择一个提示快速开始，或在下方输入你的问题。
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton v-for="prompt in quickPrompts" :key="prompt" variant="soft" class="rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-emerald-300 hover:text-emerald-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                 size="sm" @click="handlePrompt(prompt)">
          {{ prompt }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.loading-item {
  @apply h-20 w-3/4 rounded-2xl bg-neutral-200/60 animate-pulse dark:bg-neutral-800/60;
}

.message-bubble {
  @apply rounded-xl px-4 py-3 text-left shadow-sm ring-1 ring-neutral-200 transition-all duration-200 dark:ring-neutral-800;
}

.message-bubble-user {
  @apply bg-emerald-500 text-white ring-emerald-400/50 dark:bg-emerald-500;
}

.message-bubble-assistant {
  @apply bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100;
}

.message-bubble-error {
  @apply rounded-xl bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/20 dark:text-red-100;
}

.message-image-grid {
  @apply flex flex-wrap gap-2 rounded-xl bg-neutral-100 p-2 dark:bg-neutral-800;
}

.image {
  @apply cursor-pointer rounded-lg object-cover transition duration-200 hover:scale-[1.02] hover:brightness-95;
}

.timestamp {
  @apply text-xs font-light text-neutral-400 dark:text-neutral-500;
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