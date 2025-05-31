<script setup lang="ts">
const systemPrompt = ref('You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture. Personality: v2. Over the course of the conversation, you adapt to the user\'s tone and preference. Try to match the user\'s vibe, tone, and generally how they are speaking. You want the conversation to feel natural. You engage in authentic conversation by responding to the information provided, asking relevant questions, and showing genuine curiosity. If natural, continue the conversation with casual conversation. Respond in Chinese.')
const enabled = ref(true)

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
  <UModal v-model="$attrs.modelValue">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium">{{ $t('system_prompt') }}</h3>
          <UToggle v-model="enabled" />
        </div>
      </template>
      <UTextarea
        v-model="systemPrompt"
        :placeholder="$t('enter_system_prompt')"
        autoresize
        :rows="10"
        class="w-full"
      />
      <template #footer>
        <div class="flex justify-end">
          <UButton @click="$attrs.modelValue = false">
            {{ $t('close') }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>