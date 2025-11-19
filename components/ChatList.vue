<script setup lang="ts">
import MarkdownIt from "markdown-it"
import hljs from "highlight.js";
import 'highlight.js/styles/github-dark-dimmed.min.css'
import markdownItKatex from "markdown-it-katex"
import "katex/dist/katex.min.css"

defineProps<{
  history: HistoryItem[]
  loading: boolean
}>()

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
</script>

<template>
  <div class="flex flex-col space-y-6 pb-32 pt-4">
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
        <div v-if="i.role==='user'" class="max-w-3xl mx-auto w-full px-4 flex justify-end">
           <div class="bg-gray-100 dark:bg-gray-700 rounded-2xl px-5 py-3 max-w-[85%]">
              <div v-if="i.type === 'text' || i.type === 'image-prompt'" class="whitespace-pre-wrap text-gray-800 dark:text-gray-100">
                {{ i.content }}
              </div>
              <div v-else-if="i.type === 'image'" class="flex flex-wrap gap-2">
                <template v-for="img_url in i.src_url" :key="img_url">
                  <img @click="handleImgZoom($event.target as HTMLImageElement)" :src="img_url" :alt="img_url" 
                       class="max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"/>
                </template>
              </div>
           </div>
        </div>

        <!-- Assistant Message -->
        <div v-else class="max-w-3xl mx-auto w-full px-4 flex gap-4">
           <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-1">
              <UIcon name="i-heroicons-sparkles" class="text-white w-5 h-5" />
           </div>
           <div class="flex-1 min-w-0 overflow-hidden">
              <div v-if="i.type === 'text'" v-html="md.render(i.content)"
                  class="prose dark:prose-invert max-w-none prose-pre:bg-gray-800 prose-pre:text-gray-100"
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