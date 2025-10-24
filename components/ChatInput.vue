<script setup lang="ts">
import {compressionFile, handleImgZoom} from "~/utils/tools";

const input = ref('')
const addHistory = ref(true)
const fileList = ref<{
  file: File
  url: string
}[]>([])
const {openModelSelect} = useGlobalState()

const emit = defineEmits<{(e: 'update:draft', value: string): void, (e: 'clear-draft'): void}>()

onMounted(() => {
  addHistory.value = localStorage.getItem('addHistory') === 'true'
})
watch(addHistory, () => {
  localStorage.setItem('addHistory', addHistory.value.toString())
})

const p = defineProps<{
  loading: boolean
  selectedModel: Model
  draft?: string

  handleSend: (input: string, addHistory: boolean, files: {
    file: File
    url: string
  }[]) => void
}>()

const composerId = 'chat-composer'

function handleInput(e: KeyboardEvent) {
  if (e.shiftKey) {
    input.value += '\n'
  }
  if (e.isComposing || e.shiftKey) {
    return
  }

  if (input.value.trim() === '') return
  if (p.loading) return
  p.handleSend(input.value, addHistory.value, toRaw(fileList.value))
  input.value = ''
  fileList.value = []
  emit('clear-draft')
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

watch(() => p.draft, (value) => {
  if (typeof value === 'string' && value !== input.value) {
    input.value = value
    nextTick(() => {
      focusComposer()
    })
  }
})

watch(input, (value) => {
  emit('update:draft', value)
})

function focusComposer() {
  const el = document.getElementById(composerId) as HTMLTextAreaElement | null
  el?.focus()
}

defineExpose({
  focusComposer
})
</script>

<template>
  <div class="composer">
    <div class="composer-toolbar">
      <div class="flex flex-wrap items-center gap-2">
        <UTooltip :text="addHistory?$t('with_history'):$t('without_history')">
          <UButton class="rounded-md" @click="addHistory = !addHistory" size="sm"
                   :color="addHistory?'primary':'gray'" icon="i-heroicons-clock-solid" variant="soft"/>
        </UTooltip>
        <UTooltip v-if="selectedModel.type === 'universal'" :text="$t('add_image') + '(' + $t('support_paste') + ')'">
          <UButton @click="handleAddFiles" color="white" variant="ghost" class="rounded-md" size="sm"
                   icon="i-heroicons-paper-clip-16-solid"/>
        </UTooltip>
      </div>
      <UButton class="rounded-md border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-neutral-900 dark:text-emerald-300"
               size="sm" @click="openModelSelect = !openModelSelect">
        <UIcon name="i-heroicons-command-line" class="mr-1 h-4 w-4"/>
        {{ selectedModel.name }}
        <template #trailing>
          <UIcon name="i-heroicons-chevron-down-solid"/>
        </template>
      </UButton>
    </div>

    <ul v-if="selectedModel.type === 'universal' && fileList.length" class="composer-attachments">
      <li v-for="file in fileList" :key="file.url" class="attachment group">
        <button @click="fileList.splice(fileList.indexOf(file), 1)"
                class="attachment-remove">
          <UIcon name="i-heroicons-x-mark" class="h-4 w-4"/>
        </button>
        <img :src="file.url" class="attachment-preview" alt="selected image"
             @click="handleImgZoom($event.target as HTMLImageElement)"/>
      </li>
    </ul>

    <div class="composer-input">
      <UTextarea
        :id="composerId"
        v-model="input"
        :placeholder="$t('please_input_text') + '...' "
        @keydown.prevent.enter="handleInput($event)"
        @paste="handlePaste"
        autofocus
        :rows="1"
        autoresize
        class="composer-textarea"
      />
      <UButton @click="handleInput($event)" :disabled="loading"
               class="send-button" size="md" icon="i-heroicons-paper-airplane-solid">
        <span class="sr-only">{{ $t('send') }}</span>
      </UButton>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.composer {
  @apply rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition dark:border-neutral-800 dark:bg-neutral-900;
}

.composer-toolbar {
  @apply flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3 dark:border-neutral-800;
}

.composer-attachments {
  @apply mt-4 flex flex-wrap gap-2;
}

.attachment {
  @apply relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 transition hover:border-emerald-200 dark:border-neutral-700 dark:bg-neutral-800;
}

.attachment-preview {
  @apply h-16 w-16 object-cover transition duration-200 hover:scale-105;
}

.attachment-remove {
  @apply absolute right-1 top-1 hidden rounded-full bg-black/70 p-1 text-white transition group-hover:flex;
}

.composer-input {
  @apply mt-4 flex items-end gap-3;
}

.composer-textarea {
  @apply flex-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-800 shadow-inner focus:border-emerald-400 focus:ring-emerald-400/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100;
}

.send-button {
  @apply h-11 w-11 rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60;
}
</style>