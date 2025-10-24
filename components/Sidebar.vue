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
        <h2 class="text-base font-semibold text-white">
          {{ $t('history') }}
        </h2>
        <p class="text-xs text-white/70">
          管理你的所有灵感对话
        </p>
      </div>
      <UButton variant="ghost" size="xs" class="rounded-full border border-white/20 bg-white/10 text-white hover:bg-emerald-500/20"
               @click="handleNewChat">
        <UIcon name="i-heroicons-plus" class="mr-1 h-3.5 w-3.5"/>
        {{ $t('new_chat') }}
      </UButton>
    </div>
    <ol id="tabEl" class="sidebar-list scrollbar-hide" @click="handleSwitchChat">
      <li v-for="i in tabs" :key="i.id" class="sidebar-item" :class="{'card-focus':i.id === selected }" :data-id="i.id">
        <div class="line-clamp-2 text-sm font-medium text-white/90" :data-id="i.id">
          {{ i.label }}
        </div>
        <UButton v-if="i.id === selected" color="white" variant="ghost" size="xs"
                 class="rounded-full border border-white/10 bg-white/10 text-white hover:bg-red-500/50"
                 @click.stop="handleDelete(i.id)">
          <UIcon name="i-heroicons-trash" class="h-3.5 w-3.5"/>
        </UButton>
      </li>
    </ol>
  </aside>
</template>

<style scoped lang="postcss">
.sidebar {
  @apply mr-2 flex w-56 flex-col rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl transition-all dark:border-white/5 dark:bg-black/30;
}

.sidebar-header {
  @apply mb-4 flex items-start justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5;
}

.sidebar-list {
  @apply flex flex-1 flex-col gap-2 overflow-y-auto;
}

.sidebar-item {
  @apply flex cursor-pointer items-center justify-between gap-2 rounded-2xl border border-transparent bg-white/10 p-3 transition duration-300 hover:border-emerald-400/40 hover:bg-emerald-500/20 hover:text-white dark:bg-white/5;
}

.card-focus {
  @apply border-emerald-400/60 bg-emerald-500/30 shadow-lg dark:bg-emerald-500/20;
}

.hide {
  @apply -translate-x-full opacity-0 w-0 m-0 invisible transition-all
}

@media not all and (min-width: 768px) {
  .sidebar {
    @apply fixed left-0 z-20 h-full w-72 rounded-r-3xl border border-white/10 bg-white/20 pb-6 pl-4 pr-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/40;
  }

  .mask {
    @apply fixed inset-0 z-10 bg-black opacity-30 backdrop-blur-sm;
  }
}
</style>