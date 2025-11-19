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
  <div :class="{mask:openAside}" @click="openAside=!openAside" class="md:hidden"></div>
  <aside class="flex flex-col transition-all duration-300 bg-gray-50 dark:bg-[#171717] border-r border-gray-200 dark:border-white/10 h-full"
         :class="[openAside ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden', 'fixed md:relative z-20']">
    
    <!-- New Chat Button -->
    <div class="p-3 mb-2">
      <button @click="handleNewChat" 
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-sm text-gray-700 dark:text-white text-left group">
        <div class="flex items-center gap-3">
          <div class="p-1 bg-white dark:bg-white/10 rounded-full shadow-sm group-hover:scale-110 transition-transform">
             <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
          </div>
          <span class="font-medium">{{ $t('new_chat') }}</span>
        </div>
        <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
      </button>
    </div>

    <!-- Chat List -->
    <div class="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      <div v-if="tabs.length > 0" class="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Today</div>
      <div v-for="i in tabs" :key="i.id" 
           class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all"
           :class="[i.id === selected ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/5']"
           @click="handleSwitchChat" :data-id="i.id">
        <div class="truncate flex-1" :data-id="i.id">{{ i.label }}</div>
        
        <!-- Delete Button (visible on hover or selected) -->
        <button v-if="i.id === selected" 
                @click.stop="handleDelete(i.id)"
                class="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-gray-300 dark:hover:bg-white/10">
          <UIcon name="i-heroicons-trash" class="w-4 h-4" />
        </button>
        
        <!-- Fade effect for long text -->
        <div v-if="i.id !== selected" class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 dark:from-[#171717] to-transparent pointer-events-none group-hover:from-gray-200 dark:group-hover:from-[#212121]"></div>
      </div>
    </div>

    <!-- Bottom Section (User/Settings) -->
    <div class="p-3 border-t border-gray-200 dark:border-white/10">
      <button class="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-sm text-gray-700 dark:text-gray-200 mb-1">
         <div class="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-medium text-xs">
            U
         </div>
         <div class="flex-1 text-left font-medium">User</div>
         <UIcon name="i-heroicons-ellipsis-horizontal" class="w-5 h-5 text-gray-500" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.mask {
  @apply fixed inset-0 z-10 bg-black/50 backdrop-blur-sm
}
</style>