<script setup lang="ts">
const systemPrompt = ref('You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture. Personality: v2. Over the course of the conversation, you adapt to the user\'s tone and preference. Try to match the user\'s vibe, tone, and generally how they are speaking. You want the conversation to feel natural. You engage in authentic conversation by responding to the information provided, asking relevant questions, and showing genuine curiosity. If natural, continue the conversation with casual conversation. Respond in Chinese.')
const enabled = ref(true)
const attrs = useAttrs()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modalOpen = computed({
  get: () => Boolean(attrs.modelValue),
  set: (value: boolean) => emit('update:modelValue', value)
})

onMounted(() => {
  const savedPrompt = localStorage.getItem('systemPrompt')
  if (savedPrompt) {
    systemPrompt.value = savedPrompt
  }
  
  const enabledState = localStorage.getItem('systemPromptEnabled')
  if (enabledState !== null) {
    enabled.value = enabledState === 'true'
  }
})

watch(systemPrompt, (value) => {
  localStorage.setItem('systemPrompt', value)
})

watch(enabled, (value) => {
  localStorage.setItem('systemPromptEnabled', String(value))
})

defineExpose({
  systemPrompt,
  enabled
})
</script>

<template>
  <UModal v-model="modalOpen">
    <div class="prompt-card">
      <div class="prompt-header">
        <h3 class="prompt-title">{{ $t('system_prompt') }}</h3>
        <label class="toggle-wrap">
          <input v-model="enabled" class="toggle-input" type="checkbox">
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
        </label>
      </div>

      <textarea
        v-model="systemPrompt"
        :placeholder="$t('enter_system_prompt')"
        :rows="10"
        class="textarea-field prompt-textarea"
      ></textarea>

      <div class="prompt-footer">
        <button @click="modalOpen = false" class="btn btn-secondary" type="button">
          {{ $t('close') }}
        </button>
      </div>
    </div>
  </UModal>
</template>

<style scoped>
.prompt-card {
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  background: var(--color-neutral-0);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prompt-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-neutral-900);
}

.prompt-textarea {
  min-height: calc(var(--space-16) * 4);
}

.prompt-footer {
  display: flex;
  justify-content: flex-end;
}

.toggle-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  width: var(--space-10);
  height: var(--space-6);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
  padding: var(--space-1);
  display: inline-flex;
  align-items: center;
  transition: background-color var(--duration-fast) ease, border-color var(--duration-fast) ease;
  cursor: pointer;
}

.toggle-thumb {
  width: var(--space-4);
  height: var(--space-4);
  border-radius: var(--radius-sm);
  background: var(--color-neutral-500);
  transition: transform var(--duration-fast) ease, background-color var(--duration-fast) ease;
}

.toggle-input:checked + .toggle-track {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(var(--space-4));
  background: var(--color-neutral-0);
}
</style>