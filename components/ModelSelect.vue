<script setup lang="ts">
import {imageGenModels, textGenModels, uniModals} from "~/utils/db";

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
    key: 'universal',
    label: t('universal'),
    commands: uniModals.map(i => ({
      id: i.id,
      label: i.name
    }))
  }, {
    key: 'text generation',
    label: t('text_generation'),
    commands: textGenModels.map(i => ({
      id: i.id,
      label: i.name
    }))
  }, {
    key: 'image generation',
    label: t('image_generation'),
    commands: imageGenModels.map(i => ({
      id: i.id,
      label: i.name
    }))
  }])

function onSelect(option: { id: string }) {
  selectedModel.value = models.find(i => i.id === option.id) || textGenModels[0]
}
</script>

<template>
  <UModal v-model="openModelSelect">
    <div class="model-panel">
      <div v-for="group in groups" :key="group.key" class="model-group">
        <h3 class="model-group-title">{{ group.label }}</h3>

        <div class="model-options">
          <button
            v-for="option in group.commands"
            :key="option.id"
            class="model-option"
            :class="{'model-option--active': selectedModel.id === option.id}"
            type="button"
            @click="onSelect(option); openModelSelect = false"
          >
            <span>{{ option.label }}</span>
            <UIcon v-if="selectedModel.id === option.id" name="i-heroicons-check" class="icon-16"/>
          </button>
        </div>
      </div>
    </div>
  </UModal>
</template>

<style scoped>
.model-panel {
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  background: var(--color-neutral-0);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-height: calc(var(--space-16) * 8);
  overflow-y: auto;
}

.model-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.model-group-title {
  color: var(--color-neutral-500);
  font-size: var(--text-sm);
  font-weight: 600;
}

.model-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.model-option {
  width: 100%;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  background: var(--color-neutral-0);
  color: var(--color-neutral-900);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color var(--duration-fast) ease, border-color var(--duration-fast) ease;
}

.model-option:hover {
  background: var(--color-neutral-100);
}

.model-option--active {
  border-color: var(--color-primary);
  background: var(--color-neutral-50);
}

.icon-16 {
  width: var(--space-4);
  height: var(--space-4);
  color: var(--color-primary);
}
</style>