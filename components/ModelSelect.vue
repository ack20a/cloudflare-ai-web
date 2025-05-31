<script setup lang="ts">
import {uniModals} from "~/utils/db";

const {t} = useI18n()
const {selectedModel, openModelSelect} = useGlobalState()
onMounted(() => {
  const model = localStorage.getItem('selectedModel')
  selectedModel.value = models.find(i => i.id === model) || uniModals[0]
})
watch(selectedModel, v => {
  localStorage.setItem('selectedModel', v.id)
})

const groups = computed(() => [
  {
    key: 'models',
    label: t('available_models'),
    commands: models.map(i => ({
      id: i.id,
      label: i.name
    }))
  }])

function onSelect(option: { id: string }) {
  selectedModel.value = models.find(i => i.id === option.id) || uniModals[0]
}
</script>

<template>
  <UModal v-model="openModelSelect">
    <UCommandPalette @update:model-value="onSelect" :groups="groups" :model-value="selectedModel"/>
  </UModal>
</template>