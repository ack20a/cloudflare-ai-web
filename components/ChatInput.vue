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
  <div class="relative w-full">
    <!-- Image Preview List -->
    <div v-if="fileList.length > 0" class="flex gap-2 mb-2 overflow-x-auto pb-2">
       <div v-for="file in fileList" :key="file.url" class="relative group shrink-0">
          <img :src="file.url" class="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
          <button @click="fileList.splice(fileList.indexOf(file), 1)" 
                  class="absolute -top-1 -right-1 bg-gray-900 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
          </button>
       </div>
    </div>

    <!-- Input Container -->
    <div class="relative flex items-end gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
      
      <!-- Attachment Button -->
      <UTooltip v-if="selectedModel.type === 'universal'" :text="$t('add_image')">
        <button @click="handleAddFiles" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <UIcon name="i-heroicons-paper-clip" class="w-5 h-5" />
        </button>
      </UTooltip>

      <!-- History Toggle -->
      <UTooltip :text="addHistory ? $t('with_history') : $t('without_history')">
        <button @click="addHistory = !addHistory" 
                class="p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="addHistory ? 'text-green-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'">
          <UIcon name="i-heroicons-clock" class="w-5 h-5" />
        </button>
      </UTooltip>

      <!-- Text Area -->
      <textarea 
        v-model="input"
        rows="1"
        class="flex-1 max-h-48 py-2.5 bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 scrollbar-hide text-base"
        :placeholder="$t('please_input_text')"
        @keydown.enter.prevent="handleInput($event)"
        @paste="handlePaste"
        style="min-height: 44px;"
        @input="(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }"
      ></textarea>

      <!-- Send Button -->
      <button 
        @click="handleInput($event as any)" 
        :disabled="loading || (!input.trim() && fileList.length === 0)"
        class="p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
        :class="input.trim() || fileList.length > 0 ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'"
      >
        <UIcon name="i-heroicons-arrow-up" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>