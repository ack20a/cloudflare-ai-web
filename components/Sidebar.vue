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
  <aside class="flex flex-col transition-all duration-300 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full"
         :class="[openAside ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden', 'fixed md:relative z-20']">
    
    <!-- New Chat Button -->
    <div class="p-3">
      <button @click="handleNewChat" 
              class="w-full flex items-center gap-3 px-3 py-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-200 text-left">
        <UIcon name="i-heroicons-plus" class="w-4 h-4" />
        <span>{{ $t('new_chat') }}</span>
      </button>
    </div>

    <!-- Chat List -->
    <div class="flex-1 overflow-y-auto px-3 pb-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      <div v-for="i in tabs" :key="i.id" 
           class="group relative flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer text-sm transition-colors"
           :class="[i.id === selected ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800']"
           @click="handleSwitchChat" :data-id="i.id">
        <UIcon name="i-heroicons-chat-bubble-left" class="w-4 h-4 shrink-0" />
        <div class="flex-1 truncate" :data-id="i.id">{{ i.label }}</div>
        
        <!-- Delete Button (visible on hover or selected) -->
        <button v-if="i.id === selected" 
                @click.stop="handleDelete(i.id)"
                class="absolute right-2 p-1 text-gray-400 hover:text-red-500 opacity-100 transition-opacity">
          <UIcon name="i-heroicons-trash" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Bottom Section (User/Settings) -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-800">
      <button @click="toggleDark()" 
              class="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-200">
        <UIcon :name="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-4 h-4" />
        <span>{{ isDark ? 'Dark mode' : 'Light mode' }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.mask {
  @apply fixed inset-0 z-10 bg-black/50 backdrop-blur-sm
}
</style>