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
  <header class="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-white/30 backdrop-blur-xl dark:border-white/5 dark:bg-black/30">
    <UContainer class="flex h-20 items-center gap-6">
      <div class="flex items-center gap-2">
        <IButton name="i-heroicons-bars-3-20-solid" @click="openAside = !openAside"
                 class="rounded-full border border-white/30 bg-white/40 text-emerald-600 hover:bg-emerald-500/30 dark:border-white/10 dark:bg-neutral-900/60 dark:text-emerald-300"/>
        <div @click="handleReload" class="group flex cursor-pointer flex-col">
          <div class="flex items-center gap-2">
            <span class="text-xl font-semibold tracking-wide text-white drop-shadow group-hover:text-emerald-200">永康 AI Web</span>
            <span class="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Beta
            </span>
          </div>
          <p class="text-xs text-white/70">
            现代化大模型对话工作台
          </p>
        </div>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <UIcon name="i-heroicons-sparkles-solid" class="hidden h-5 w-5 text-emerald-300 sm:block"/>
        <span class="hidden text-sm text-white/80 sm:block">
          快速切换模型、整理灵感、驱动你的创意流程
        </span>
        <IButton class="rounded-full border border-white/30 bg-white/30 text-emerald-600 hover:bg-emerald-500/30 dark:border-white/10 dark:bg-neutral-900/60 dark:text-emerald-200"
                 :name="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                 @click="toggleDark()"/>
      </div>
    </UContainer>
  </header>
</template>