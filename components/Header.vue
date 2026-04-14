<script setup lang="ts">
import {useGlobalState} from "~/utils/store";

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
  <header class="app-header">
    <UContainer class="app-header__inner">
      <IButton name="i-heroicons-bars-3-20-solid" @click="openAside = !openAside"/>
      <h1 @click="handleReload" class="app-header__title">永康 AI Web</h1>
    </UContainer>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  z-index: 30;
  width: 100%;
  height: var(--space-16);
  background: var(--color-neutral-0);
  border-bottom: 1px solid var(--color-neutral-200);
}

.app-header__inner {
  height: 100%;
  display: flex;
  align-items: center;
}

.app-header__title {
  margin-left: var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-neutral-900);
  cursor: pointer;
}
</style>