<script setup lang="ts">
import {useGlobalState} from "~/utils/store";

const {openAside} = useGlobalState()

defineProps<{
  tabs: TabItem[]
  selected: number

  handleNewChat: () => void
  handleDelete: (tid: number) => void
  handleSwitchChat: (e: MouseEvent) => void
}>()
</script>

<template>
  <div :class="{mask:openAside}" @click="openAside=!openAside"></div>
  <aside class="sidebar" :class="{hide:!openAside}">
    <div class="sidebar-header">
      <div>
        <h2 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">
          {{ $t('history') }}
        </h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          管理你的所有灵感对话
        </p>
      </div>
      <UButton variant="ghost" size="xs" class="rounded-md border border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 hover:text-emerald-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
               @click="handleNewChat">
        <UIcon name="i-heroicons-plus" class="mr-1 h-3.5 w-3.5"/>
        {{ $t('new_chat') }}
      </UButton>
    </div>
    <ol id="tabEl" class="sidebar-list scrollbar-hide" @click="handleSwitchChat">
      <li v-for="i in tabs" :key="i.id" class="sidebar-item" :class="{'card-focus':i.id === selected }" :data-id="i.id">
        <div class="line-clamp-2 text-sm font-medium text-neutral-700 dark:text-neutral-200" :data-id="i.id">
          {{ i.label }}
        </div>
        <UButton v-if="i.id === selected" color="white" variant="ghost" size="xs"
                 class="rounded-md border border-neutral-200 bg-white text-neutral-600 hover:border-red-300 hover:text-red-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                 @click.stop="handleDelete(i.id)">
          <UIcon name="i-heroicons-trash" class="h-3.5 w-3.5"/>
        </UButton>
      </li>
    </ol>
  </aside>
</template>

<style scoped lang="postcss">
.sidebar {
  @apply mr-4 flex w-56 flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all dark:border-neutral-800 dark:bg-neutral-950;
}

.sidebar-header {
  @apply mb-4 flex items-start justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900;
}

.sidebar-list {
  @apply flex flex-1 flex-col gap-2 overflow-y-auto;
}

.sidebar-item {
  @apply flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-transparent bg-white p-3 transition duration-200 hover:border-emerald-300 hover:bg-emerald-50 dark:bg-neutral-900;
}

.card-focus {
  @apply border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-500/60 dark:bg-emerald-500/10;
}

.hide {
  @apply -translate-x-full opacity-0 w-0 m-0 invisible transition-all
}

@media not all and (min-width: 768px) {
  .sidebar {
    @apply fixed left-0 z-20 h-full w-72 rounded-r-xl border border-neutral-200 bg-white pb-6 pl-4 pr-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-950;
  }

  .mask {
    @apply fixed inset-0 z-10 bg-black opacity-40 backdrop-blur-sm;
  }
}
</style>