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
  <header class="blur-global shadow h-14 fixed w-full z-30 rounded-b-lg">
    <UContainer class="h-full flex items-center">
      <IButton name="i-heroicons-bars-3-20-solid" @click="openAside = !openAside" class="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"/>
      <h1 class="text-base font-normal ml-2">永康 AI Web</h1>
      <IButton class="ml-auto p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" :name="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
               @click="toggleDark()"/>
    </UContainer>
  </header>
</template>