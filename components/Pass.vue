<script setup lang="ts">
import {useGlobalState} from "~/utils/store";

const {passModal} = useGlobalState()
const access_pass = ref('')

function handlePass() {
  if (!access_pass.value) return
  localStorage.setItem('access_pass', access_pass.value)
  passModal.value = false
}
</script>

<template>
  <UModal v-model="passModal">
    <div class="pass-panel">
      <div class="pass-label">
        {{ $t('input_password') }}
      </div>

      <div class="pass-row">
        <input v-model.trim="access_pass" type="password" @keydown.enter="handlePass" class="input-field pass-input">
        <button @click="handlePass" class="btn btn-primary pass-submit" type="button">{{ $t('confirm') }}</button>
      </div>
    </div>
  </UModal>
</template>

<style scoped>
.pass-panel {
  padding: var(--space-4);
  background: var(--color-surface-card);
  border: 1px solid var(--color-outline-soft);
  border-radius: calc(var(--radius-md) + var(--space-1));
  box-shadow: var(--shadow-level-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.pass-label {
  color: var(--color-neutral-500);
  font-size: var(--text-sm);
  font-weight: 600;
}

.pass-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pass-input {
  flex: 1;
  border-radius: var(--radius-pill);
  padding-right: var(--space-4);
  padding-left: var(--space-4);
}

.pass-submit {
  min-width: calc(var(--space-16) + var(--space-6));
  border-radius: var(--radius-pill);
}
</style>