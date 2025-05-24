<script setup lang="ts">
import {compressionFile, handleImgZoom} from "~/utils/tools";

const input = ref('')
const addHistory = ref(true)
const fileList = ref<{
  file: File
  url: string
}[]>([])
const {openModelSelect} = useGlobalState()

onMounted(() => {
  addHistory.value = localStorage.getItem('addHistory') === 'true'
})
watch(addHistory, () => {
  localStorage.setItem('addHistory', addHistory.value.toString())
})

const p = defineProps<{
  loading: boolean
  selectedModel: Model

  handleSend: (input: string, addHistory: boolean, files: {
    file: File
    url: string
  }[]) => void
}>()

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
  <div class="relative pb-16">
    <div class="absolute bottom-10 w-full flex flex-col z-10">
      <!-- Model Selector Button -->
      <UButton class="self-center mb-1 px-2 py-1 rounded-md
                      bg-transparent text-[var(--text-color-light)] hover:bg-[var(--card-hover-background-light)]
                      dark:text-[var(--text-color-dark)] dark:hover:bg-[var(--card-hover-background-dark)]"
               @click="openModelSelect = !openModelSelect">
        {{ selectedModel.name }}
        <template #trailing>
          <UIcon name="i-heroicons-chevron-down-solid" class="text-[var(--text-color-light)] dark:text-[var(--text-color-dark)]"/>
        </template>
      </UButton>
      <!-- Image Preview Area -->
      <ul v-if="selectedModel.type === 'universal'" style="margin: 0"
          class="flex flex-wrap bg-[var(--card-background-light)] dark:bg-[var(--card-background-dark)] rounded-t-md p-1">
        <li v-for="file in fileList" :key="file.url" class="relative group/img m-1">
          <button @click="fileList.splice(fileList.indexOf(file), 1)"
                  class="absolute z-10 hidden group-hover/img:flex items-center justify-center rounded-full bg-black/20 dark:bg-white/20 text-white dark:text-black hover:bg-black/30 dark:hover:bg-white/30 transition-all w-5 h-5 right-1 top-1">
            <UIcon name="i-heroicons-x-mark-20-solid" class="w-4 h-4"/>
          </button>
          <img :src="file.url"
               class="max-h-16 shadow-md cursor-pointer group-hover/img:brightness-90 transition-all rounded"
               alt="selected image" @click="handleImgZoom($event.target as HTMLImageElement)"/>
        </li>
      </ul>
    </div>
    <div class="flex items-end p-2">
      <!-- Toggle History Button -->
      <UTooltip :text="addHistory?$t('with_history'):$t('without_history')">
        <UButton class="m-1 p-2 rounded-full border-transparent
                        bg-transparent text-[var(--neutral-color-light)] hover:text-[var(--primary-color-light)]
                        dark:text-[var(--neutral-color-dark)] dark:hover:text-[var(--primary-color-dark)]"
                 @click="addHistory = !addHistory"
                 icon="i-heroicons-clock-solid"/>
      </UTooltip>
      <!-- Add Image Button -->
      <UTooltip v-if="selectedModel.type === 'universal'" :text="$t('add_image') + '(' + $t('support_paste') + ')'">
        <UButton @click="handleAddFiles"
                 class="m-1 p-2 rounded-full border-transparent
                        bg-transparent text-[var(--neutral-color-light)] hover:text-[var(--primary-color-light)]
                        dark:text-[var(--neutral-color-dark)] dark:hover:text-[var(--primary-color-dark)]"
                 icon="i-heroicons-paper-clip-16-solid"/>
      </UTooltip>
      <!-- Text Area -->
      <UTextarea v-model="input" :placeholder="$t('please_input_text') + '...' "
                 @keydown.prevent.enter="handleInput($event)"
                 @paste="handlePaste"
                 autofocus :rows="1" autoresize
                 class="flex-1 max-h-48 overflow-y-auto m-1 px-3 py-2 rounded-md
                        bg-[var(--input-background-light)] text-[var(--text-color-light)] border border-[var(--input-border-color-light)] focus:border-[var(--input-focus-border-color-light)]
                        dark:bg-[var(--input-background-dark)] dark:text-[var(--text-color-dark)] dark:border-[var(--input-border-color-dark)] dark:focus:border-[var(--input-focus-border-color-dark)]"
                 inputClass="!p-0"/> <!-- UTextarea might have internal padding, try to remove it with inputClass -->
      <!-- Send Button -->
      <UButton @click="handleInput($event)" :disabled="loading" icon="i-heroicons-paper-airplane-solid"
               class="m-1 p-2 rounded-full border-transparent
                      bg-transparent text-[var(--primary-color-light)] hover:bg-[var(--card-hover-background-light)]
                      dark:text-[var(--primary-color-dark)] dark:hover:bg-[var(--card-hover-background-dark)] disabled:opacity-50">
      </UButton>
    </div>
  </div>
</template>