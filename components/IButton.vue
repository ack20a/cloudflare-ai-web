<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <button class="icon-btn" type="button">
    <UIcon class="icon-size" :name="name"/>
  </button>
</template>

<style scoped>
.icon-size {
  width: var(--space-5);
  height: var(--space-5);
}
</style>