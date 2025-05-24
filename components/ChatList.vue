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

const md: MarkdownIt = markdownit({
  linkify: true,
  highlight: (code, language) => {
    if (language && hljs.getLanguage(language)) {
      return `<pre class="hljs"><code>${hljs.highlight(code, {language}).value}</code></pre>`;
    }
    return `<pre class="hljs"><code>${hljs.highlightAuto(code).value}</code></pre>`;
  },
}).use(markdownItKatex)
</script>

<template>
  <ul class="overflow-y-auto overflow-x-hidden scrollbar-hide pt-6 pb-6 px-4 flex flex-col space-y-4">
    <template v-for="(i,index) in history" :key="i.id">
      <template v-if="!i.content">
        <USkeleton class="loading-item"/>
      </template>
      <template v-else>
        <template v-if="i.role==='user'">
          <li v-if="i.type === 'text' || i.type === 'image-prompt'" class="user chat-item user-text">
            {{ i.content }}
          </li>
          <li v-else-if="i.type === 'image'" class="user image-item p-2">
            <template v-for="img_url in i.src_url" :key="img_url">
              <img @click="handleImgZoom($event.target as HTMLImageElement)" :src="img_url" :alt="img_url" class="image"
                   :class="i.src_url?.length === 1 ? 'max-h-64' : (i.src_url?.length === 2 ? 'max-h-32': 'max-h-16')"/>
            </template>
          </li>
        </template>
        <template v-else>
          <li v-if="i.type === 'text'" v-html="md.render(i.content)"
              class="assistant chat-item assistant-text prose prose-pre:break-words prose-pre:whitespace-pre-wrap"
              :class="index+1===history.length && loading ?  'loading':''"/>
          <li v-else-if="i.type === 'image'" class="assistant image-item p-2">
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
  /* USkeleton has this class, so we style it here. Tailwind classes from @apply were removed. */
  border-radius: 0.75rem; /* rounded-xl */
  height: 2.5rem; /* h-10 */
  width: 33.333333%; /* w-1/3 */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; /* animate-pulse */
  background-color: var(--card-hover-background-light);
}

@media (prefers-color-scheme: dark) {
  .loading-item {
    background-color: var(--card-hover-background-dark);
  }
}

.user {
  /* self-end removed to align left */
  @apply slide-top;
}

.assistant {
  @apply slide-top;
}

.chat-item {
  @apply break-words rounded-xl max-w-[95%] md:max-w-[80%];
  padding: 0.5rem 0.75rem; /* Equivalent to py-2 px-3 */
}

.image-item {
  @apply flex rounded-xl space-x-1 max-w-[95%] md:max-w-[60%];
  /* p-2 was added in template */
}

.image {
  @apply cursor-pointer hover:brightness-75 transition-all rounded-md;
}

.user-text {
  /* Removed background and text colors that made it look like a bubble */
  background-color: transparent;
  color: var(--text-color-light);
}

@media (prefers-color-scheme: dark) {
  .user-text {
    color: var(--text-color-dark);
  }
}

.assistant-text {
  align-self: flex-start;
  background-color: var(--card-background-light);
  color: var(--text-color-light);
}

@media (prefers-color-scheme: dark) {
  .assistant-text {
    background-color: var(--card-background-dark);
    color: var(--text-color-dark);
  }
}

.assistant-error {
  align-self: flex-start;
  /* Using more specific shades for errors */
  background-color: #FFEBEE; /* Approx red-100 */
  color: #D32F2F;       /* Approx red-700 */
}

@media (prefers-color-scheme: dark) {
  .assistant-error {
    background-color: #2C1A1D; /* Approx dark red-900 */
    color: #EF9A9A;        /* Approx light red-200 */
  }
}

.user-text::selection {
  /* Kept existing selection style, can be themed later if needed */
  @apply text-neutral-900 bg-gray-300;
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