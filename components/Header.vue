<script setup lang="ts">
import {useDark, useToggle} from "@vueuse/core";
import {useGlobalState} from "~/utils/store";

const isDark = useDark()
const toggleDark = useToggle(isDark)
const {openAside} = useGlobalState()
onMounted(() => {
  const open = localStorage.getItem('openAside')
  openAside.value = open === 'true' || open === null
})
watch(openAside, (v) => {
  localStorage.setItem('openAside', v.toString())
})

function handleReload() {
  location.reload()
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
    <UContainer class="flex h-16 items-center gap-6">
      <div class="flex items-center gap-2">
        <IButton name="i-heroicons-bars-3-20-solid" @click="openAside = !openAside"
                 class="rounded-md border border-neutral-200 bg-white text-emerald-500 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-emerald-300"/>
        <div @click="handleReload" class="group flex cursor-pointer flex-col">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold tracking-wide text-neutral-900 group-hover:text-emerald-600 dark:text-neutral-100 dark:group-hover:text-emerald-300">永康 AI Web</span>
            <span class="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              Beta
            </span>
          </div>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            轻量、专注的智能对话体验
          </p>
        </div>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <UIcon name="i-heroicons-sparkles-solid" class="hidden h-5 w-5 text-emerald-400 sm:block"/>
        <span class="hidden text-sm text-neutral-600 sm:block dark:text-neutral-300">
          快速切换模型，高效完成每一次对话
        </span>
        <IButton class="rounded-md border border-neutral-200 bg-white text-emerald-500 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-emerald-200"
                 :name="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                 @click="toggleDark()"/>
      </div>
    </UContainer>
  </header>
</template>