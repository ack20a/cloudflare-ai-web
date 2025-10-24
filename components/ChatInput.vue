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
  <div class="composer-card">
    <div class="composer-toolbar">
      <div class="flex flex-wrap items-center gap-2">
        <UTooltip :text="addHistory?$t('with_history'):$t('without_history')">
          <UButton class="rounded-full" @click="addHistory = !addHistory" size="sm"
                   :color="addHistory?'primary':'gray'" icon="i-heroicons-clock-solid" variant="soft"/>
        </UTooltip>
        <UTooltip v-if="selectedModel.type === 'universal'" :text="$t('add_image') + '(' + $t('support_paste') + ')'">
          <UButton @click="handleAddFiles" color="white" variant="soft" class="rounded-full" size="sm"
                   icon="i-heroicons-paper-clip-16-solid"/>
        </UTooltip>
      </div>
      <UButton class="rounded-full border border-emerald-400/30 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/40"
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
                class="attachment-remove hidden group-hover:flex">
          <UIcon name="i-heroicons-x-mark" class="h-4 w-4"/>
        </button>
        <img :src="file.url" class="attachment-preview group-hover:brightness-95 group-hover:scale-105" alt="selected image"
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
               class="send-button" size="lg">
        <UIcon name="i-heroicons-paper-airplane-solid" class="h-5 w-5"/>
      </UButton>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.composer-card {
  @apply rounded-3xl border border-white/10 bg-white/80 p-4 shadow-xl backdrop-blur-xl transition-colors dark:border-white/5 dark:bg-neutral-900/70;
}

.composer-toolbar {
  @apply flex flex-wrap items-center justify-between gap-3 border-b border-white/20 pb-3 dark:border-white/10;
}

.composer-attachments {
  @apply mt-4 flex flex-wrap gap-3;
}

.attachment {
  @apply relative overflow-hidden rounded-2xl border border-white/30 bg-white/40 backdrop-blur dark:border-white/10 dark:bg-neutral-800/70;
}

.attachment-preview {
  @apply h-20 w-20 object-cover transition duration-300;
}

.attachment-remove {
  @apply absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition;
}

.composer-input {
  @apply mt-4 flex items-end gap-3;
}

.composer-textarea {
  @apply flex-1 max-h-48 overflow-y-auto rounded-2xl border border-transparent bg-white/90 px-4 py-3 text-base text-neutral-800 shadow-inner focus:border-emerald-400 focus:ring-emerald-400/60 dark:bg-neutral-800/70 dark:text-neutral-100;
}

.send-button {
  @apply h-12 w-12 rounded-full bg-emerald-500 text-white shadow-lg transition duration-300 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50;
}
</style>