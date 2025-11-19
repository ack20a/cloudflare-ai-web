<script setup lang="ts">
import {useGlobalState} from "~/utils/store";
import {useDark, useToggle} from "@vueuse/core";

const {openAside} = useGlobalState()
const isDark = useDark()
const toggleDark = useToggle(isDark)

defineProps<{
  tabs: TabItem[]
  selected: number

  handleNewChat: () => void
  handleDelete: (tid: number) => void
  handleSwitchChat: (e: MouseEvent) => void
}>()
</script>

<template>
  <div :class="{mask:openAside}" @click="openAside=!openAside" class="md:hidden z-40"></div>
  <aside class="flex flex-col transition-all duration-300 bg-[#f9f9f9] dark:bg-[#171717] h-full"
         :class="[openAside ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden', 'fixed md:relative z-50 md:z-0']">
    
    <!-- Header / New Chat -->
    <div class="p-3 pb-0">
      <button @click="handleNewChat" 
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#212121] transition-colors text-sm text-gray-900 dark:text-gray-100 group">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-white dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-transparent">
             <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          </div>
          <span class="font-medium">{{ $t('new_chat') }}</span>
        </div>
        <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 opacity-0 group-hover:opacity-100 text-gray-500" />
      </button>
    </div>

    <!-- Chat List -->
    <div class="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      <div v-if="tabs.length > 0" class="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-500">Today</div>
      <div v-for="i in tabs" :key="i.id" 
           class="group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-colors"
           :class="[i.id === selected ? 'bg-gray-200 dark:bg-[#212121] text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#212121]']"
           @click="handleSwitchChat" :data-id="i.id">
        <div class="truncate flex-1" :data-id="i.id">{{ i.label }}</div>
        
        <!-- Delete Button -->
        <button v-if="i.id === selected" 
                @click.stop="handleDelete(i.id)"
                class="absolute right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <UIcon name="i-heroicons-trash" class="w-4 h-4" />
        </button>
        
        <!-- Fade effect -->
        <div v-if="i.id !== selected" class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#f9f9f9] dark:from-[#171717] to-transparent pointer-events-none group-hover:from-gray-200 dark:group-hover:from-[#212121]"></div>
      </div>
    </div>

    <!-- User Profile -->
    <div class="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-gray-200 dark:border-white/5">
      <button class="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#212121] transition-colors text-sm text-gray-700 dark:text-gray-200">
         <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium text-xs">
            AC
         </div>
         <div class="flex-1 text-left font-medium">牛永康</div>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.mask {
  @apply fixed inset-0 z-10 bg-black/50 backdrop-blur-sm
}
</style>