<script setup lang="ts">
import {compressionFile} from "~/utils/tools";

const input = ref('')
const quote = ref('')
const addHistory = ref(true)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileList = ref<{
  file: File
  url: string
}[]>([])
onMounted(() => {
  addHistory.value = localStorage.getItem('addHistory') !== 'false'
})
watch(addHistory, () => {
  localStorage.setItem('addHistory', addHistory.value.toString())
})

function setInput(val: string) {
  input.value = val
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

function setQuote(val: string) {
  quote.value = val
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

defineExpose({
  setInput,
  setQuote
})

const p = defineProps<{
  loading: boolean
  selectedModel: Model

  handleSend: (input: string, addHistory: boolean, files: {
    file: File
    url: string
  }[]) => void
}>()

function sendMessage() {
  if (input.value.trim() === '' && fileList.value.length === 0) return
  if (p.loading) return

  let content = input.value
  if (quote.value) {
      const quoteText = quote.value.split('\n').map(line => `> ${line}`).join('\n') + '\n\n'
      content = quoteText + content
  }

  p.handleSend(content, addHistory.value, toRaw(fileList.value))
  input.value = ''
  quote.value = ''
  fileList.value = []
}

function handleKeydown(e: KeyboardEvent) {
  if (e.isComposing || e.shiftKey) {
    return
  }
  e.preventDefault()
  sendMessage()
}

const imageType = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'image/jpg']

function checkFile(file: File) {
  if (fileList.value.length >= 5) {
    alert('You can only upload up to 5 images')
    return false
  }
  if (imageType.indexOf(file.type) === -1) {
    alert(imageType.join(', ') + ' only')
    return false
  }
  return true
}

function handleAddFiles() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = imageType.join(',')
  input.multiple = true
  input.onchange = async () => {
    document.body.style.cursor = 'wait'

    const files = Array.from(input.files || [])
    for (const f of files) {
      if (!checkFile(f)) continue;
      const file = await compressionFile(f, f.type)
      const url = URL.createObjectURL(file)
      fileList.value.push({file, url})
    }

    document.body.style.cursor = 'auto'
  }
  input.click()
}

onUnmounted(() => {
  fileList.value.forEach(i => {
    URL.revokeObjectURL(i.url)
  })
})

const handlePaste = (e: ClipboardEvent) => {
  const files = Array.from(e.clipboardData?.files || [])
  files.forEach(file => {
    if (!checkFile(file)) return

    const url = URL.createObjectURL(file)
    fileList.value.push({file, url})
  })
}
</script>

<template>
  <div class="chat-input-root">
    <div v-if="quote" class="quote-preview">
      <div class="quote-content">
        {{ quote }}
      </div>
      <button @click="quote = ''" class="quote-clear-btn" type="button">
        <UIcon name="i-heroicons-x-mark" class="icon-16"/>
      </button>
    </div>

    <div v-if="fileList.length > 0" class="file-list">
      <div v-for="file in fileList" :key="file.url" class="file-item">
        <img :src="file.url" class="file-thumb"/>
        <button @click="fileList.splice(fileList.indexOf(file), 1)" class="file-remove-btn" type="button">
          <UIcon name="i-heroicons-x-mark" class="icon-16"/>
        </button>
      </div>
    </div>

    <div class="composer">
      <UTooltip v-if="selectedModel.type === 'universal'" :text="$t('add_image')">
        <button @click="handleAddFiles" class="composer-icon-btn" type="button">
          <UIcon name="i-heroicons-paper-clip" class="icon-20"/>
        </button>
      </UTooltip>

      <textarea
        ref="textareaRef"
        v-model="input"
        rows="1"
        class="composer-textarea"
        :placeholder="$t('please_input_text')"
        @keydown.enter="handleKeydown($event)"
        @paste="handlePaste"
      ></textarea>

      <button v-if="!input.trim()" class="composer-icon-btn" type="button">
        <UIcon name="i-heroicons-microphone" class="icon-20"/>
      </button>

      <button
        @click="sendMessage"
        :disabled="loading || (!input.trim() && fileList.length === 0)"
        class="send-btn"
        :class="input.trim() || fileList.length > 0 ? 'send-btn--active' : 'send-btn--idle'"
        type="button"
      >
        <UIcon name="i-heroicons-arrow-up" class="icon-20"/>
      </button>
    </div>

    <div class="history-toggle-wrap">
      <button @click="addHistory = !addHistory" class="history-toggle-btn" type="button">
        <UIcon :name="addHistory ? 'i-heroicons-clock' : 'i-heroicons-no-symbol'" class="icon-16"/>
        <span>{{ addHistory ? $t('with_history') : $t('without_history') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-input-root {
  width: 100%;
}

.quote-preview {
  margin-bottom: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-container);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.quote-content {
  flex: 1;
  color: var(--color-neutral-500);
  font-size: var(--text-sm);
  line-height: 1.5;
  font-style: italic;
  white-space: pre-wrap;
}

.quote-clear-btn {
  width: var(--space-6);
  height: var(--space-6);
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-neutral-400);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.quote-clear-btn:hover {
  background: var(--color-surface-high);
  color: var(--color-neutral-900);
}

.file-list {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-2);
}

.file-item {
  position: relative;
  flex-shrink: 0;
}

.file-thumb {
  width: var(--space-16);
  height: var(--space-16);
  object-fit: cover;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-level-1);
}

.file-remove-btn {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  width: var(--space-6);
  height: var(--space-6);
  border: 0;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-neutral-900) 80%, transparent);
  color: var(--color-neutral-0);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
  border: 1px solid var(--color-outline);
  border-radius: calc(var(--radius-md) + var(--space-1));
  background: var(--color-surface-low);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--color-neutral-0) 45%, transparent);
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}

.composer:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 24%, transparent);
}

.composer-icon-btn {
  width: calc(var(--space-8) + var(--space-1));
  height: calc(var(--space-8) + var(--space-1));
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-neutral-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.composer-icon-btn:hover {
  background: var(--color-surface-container);
  color: var(--color-neutral-900);
}

.composer-textarea {
  flex: 1;
  max-height: calc(var(--space-16) * 3);
  min-height: var(--space-12);
  border: 0;
  background: transparent;
  color: var(--color-neutral-900);
  font-size: var(--text-base);
  line-height: 1.5;
  padding-top: var(--space-3);
  padding-right: 0;
  padding-bottom: var(--space-2);
  padding-left: 0;
  resize: none;
  outline: none;
}

.composer-textarea::placeholder {
  color: var(--color-neutral-400);
}

.send-btn {
  width: calc(var(--space-8) + var(--space-1));
  height: calc(var(--space-8) + var(--space-1));
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease, border-color var(--duration-fast) ease, transform var(--duration-fast) ease;
}

.send-btn--idle {
  background: var(--color-surface-card);
  border-color: var(--color-outline-soft);
  color: var(--color-neutral-400);
}

.send-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-neutral-0);
  box-shadow: var(--shadow-level-1);
}

.send-btn--active:hover:not(:disabled) {
  background: var(--color-primary-strong);
  border-color: var(--color-primary-strong);
  transform: translateY(-1px);
}

.history-toggle-wrap {
  margin-top: var(--space-3);
  display: flex;
  justify-content: center;
}

.history-toggle-btn {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-pill);
  background: var(--color-surface-low);
  color: var(--color-neutral-400);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  font-size: var(--text-xs);
  transition: background-color var(--duration-fast) ease, border-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.history-toggle-btn:hover {
  border-color: var(--color-outline);
  background: var(--color-surface-container);
  color: var(--color-neutral-700);
}

.icon-16 {
  width: var(--space-4);
  height: var(--space-4);
}

.icon-20 {
  width: var(--space-5);
  height: var(--space-5);
}

@media (max-width: 767px) {
  .composer {
    border-radius: calc(var(--radius-md) + var(--space-2));
  }

  .file-thumb {
    width: var(--space-14);
    height: var(--space-14);
  }
}
</style>