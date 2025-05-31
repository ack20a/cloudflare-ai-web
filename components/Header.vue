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
  <header class="blur-global dark:bg-neutral-800 shadow h-16 fixed w-full z-30 rounded-b-lg">
    <UContainer class="h-full flex items-center">
      <UButton variant="ghost" size="sm" @click="openAside = !openAside" 
               icon="i-heroicons-bars-3-20-solid" square />
      <h1 @click="handleReload" class="text-lg font-bold ml-2 hover:cursor-pointer">永康 AI Web</h1>
      <UButton variant="ghost" size="sm" 
               :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
               @click="toggleDark()" square class="ml-auto" />
    </UContainer>
  </header>
</template>