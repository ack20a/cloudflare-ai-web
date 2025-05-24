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
  <aside class="w-48 flex flex-col transition-all mobile-bar" :class="{hide:!openAside}">
    <div class="m-2">
      <UButton icon="i-heroicons-plus-solid"
               class="w-full py-2 px-3 rounded-md border-transparent 
                      bg-transparent text-[var(--text-color-light)] hover:bg-[var(--card-hover-background-light)] 
                      dark:text-[var(--text-color-dark)] dark:hover:bg-[var(--card-hover-background-dark)]"
               @click="handleNewChat">
        {{ $t('new_chat') }}
      </UButton>
    </div>
    <ol id="tabEl" class="flex flex-col space-y-1 overflow-y-auto h-full scrollbar-hide pt-2"
        @click="handleSwitchChat">
      <li v-for="i in tabs" :key="i.id" class="rounded-md p-1.5 mx-1 cursor-pointer transition-all flex items-center 
                      bg-transparent hover:bg-[var(--card-hover-background-light)] 
                      dark:hover:bg-[var(--card-hover-background-dark)]"
          :class="{'card-focus':i.id === selected }" :data-id="i.id">
        <div class="line-clamp-1 text-sm w-full" :data-id="i.id">
          {{ i.label }}
        </div>
        <UIcon name="i-heroicons-trash-20-solid" v-if="i.id === selected" @click="handleDelete(i.id)"
               class="shrink-0 hover:text-red-500 transition-all ml-1"/>
      </li>
    </ol>
  </aside>
</template>

<style scoped lang="postcss">
.hide {
  @apply -translate-x-full opacity-0 w-0 m-0 invisible transition-all
}

.card-focus {
  background-color: var(--card-hover-background-light);
}

@media (prefers-color-scheme: dark) {
  .card-focus {
    background-color: var(--card-hover-background-dark);
  }
}

@media not all and (min-width: 768px) {
  .mobile-bar {
    @apply fixed left-0 z-20 h-full shadow-xl pb-6 px-2 rounded-r;
    background-color: var(--neutral-background-light);
  }
  @media (prefers-color-scheme: dark) {
    .mobile-bar {
      background-color: var(--neutral-background-dark);
    }
  }

  .mask {
    @apply fixed inset-0 z-10 bg-black opacity-25
  }
}
</style>