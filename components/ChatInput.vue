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
  addHistory.value = localStorage.getItem('addHistory') !== 'false'
})
watch(addHistory, () => {
  localStorage.setItem('addHistory', addHistory.value.toString())
})

function setInput(val: string) {
  input.value = val
  nextTick(() => {
     // Trigger height adjustment
     const textarea = document.querySelector('textarea')
     if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
        textarea.focus()
     }
  })
}

defineExpose({
  setInput
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
  p.handleSend(input.value, addHistory.value, toRaw(fileList.value))
  input.value = ''
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
    <div class="relative flex items-end gap-2 p-2 bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-[26px] transition-all focus-within:ring-1 focus-within:ring-black/5 dark:focus-within:ring-white/5 focus-within:bg-white dark:focus-within:bg-[#2f2f2f] focus-within:shadow-lg">
      
      <!-- Attachment Button -->
      <UTooltip v-if="selectedModel.type === 'universal'" :text="$t('add_image')">
        <button @click="handleAddFiles" class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10 mb-0.5">
          <UIcon name="i-heroicons-paper-clip" class="w-5 h-5" />
        </button>
      </UTooltip>

      <!-- Text Area -->
      <textarea 
        v-model="input"
        rows="1"
        class="flex-1 max-h-48 py-3 bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 scrollbar-hide text-base leading-relaxed"
        :placeholder="$t('please_input_text')"
        @keydown.enter="handleKeydown($event)"
        @paste="handlePaste"
        style="min-height: 48px;"
        @input="(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }"
      ></textarea>

      <!-- Send Button -->
      <button 
        @click="sendMessage" 
        :disabled="loading || (!input.trim() && fileList.length === 0)"
        class="p-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-1.5"
        :class="input.trim() || fileList.length > 0 ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80' : 'bg-transparent text-gray-400 dark:text-gray-500'"
      >
        <UIcon name="i-heroicons-arrow-up" class="w-5 h-5" />
      </button>
    </div>
    
    <div class="text-center mt-2">
       <button @click="addHistory = !addHistory" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center gap-1 mx-auto transition-colors">
          <UIcon :name="addHistory ? 'i-heroicons-clock' : 'i-heroicons-no-symbol'" class="w-3 h-3" />
          <span>{{ addHistory ? $t('with_history') : $t('without_history') }}</span>
       </button>
    </div>
  </div>
</template>