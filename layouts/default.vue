<script setup lang="ts">
</script>

<template>
  <div class="layout-root">
    <slot/>
  </div>
</template>

<style scoped>
.layout-root {
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background: var(--color-neutral-0);
  color: var(--color-neutral-900);
}
</style>