<template>
  <div class="enhanced-chat-controls flex flex-wrap gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
    <!-- 搜索框 -->
    <div class="flex-1 min-w-64">
      <UInput
        v-model="searchQuery"
        :placeholder="$t('search_messages')"
        icon="i-heroicons-magnifying-glass"
        size="sm"
        @input="handleSearch"
      />
    </div>
    
    <!-- 语音输入按钮 -->
    <UButton
      :icon="isRecording ? 'i-heroicons-stop' : 'i-heroicons-microphone'"
      :color="isRecording ? 'red' : 'gray'"
      variant="outline"
      size="sm"
      @click="toggleSpeechRecognition"
      :title="isRecording ? $t('speech_recognition_stop') : $t('speech_recognition_start')"
    />
    
    <!-- 导出按钮 -->
    <UDropdown :items="exportItems">
      <UButton
        icon="i-heroicons-arrow-down-tray"
        variant="outline"
        size="sm"
        :title="$t('export_chat')"
      />
    </UDropdown>
    
    <!-- 统计按钮 -->
    <UButton
      icon="i-heroicons-chart-bar"
      variant="outline"
      size="sm"
      @click="showStats = true"
      :title="$t('message_stats')"
    />
    
    <!-- 快捷键帮助 -->
    <UButton
      icon="i-heroicons-question-mark-circle"
      variant="outline"
      size="sm"
      @click="showShortcuts = true"
      :title="$t('shortcuts')"
    />
  </div>

  <!-- 统计弹窗 -->
  <UModal v-model="showStats">
    <UCard>
      <template #header>
        <h3 class="text-lg font-medium">{{ $t('message_stats') }}</h3>
      </template>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <div class="text-2xl font-bold">{{ stats.totalMessages }}</div>
            <div class="text-sm text-gray-600">{{ $t('total_messages') }}</div>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <div class="text-2xl font-bold">{{ stats.userMessages }}</div>
            <div class="text-sm text-gray-600">{{ $t('user_messages') }}</div>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <div class="text-2xl font-bold">{{ stats.assistantMessages }}</div>
            <div class="text-sm text-gray-600">{{ $t('ai_messages') }}</div>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <div class="text-2xl font-bold">{{ stats.averageMessageLength }}</div>
            <div class="text-sm text-gray-600">{{ $t('average_length') }}</div>
          </div>
        </div>
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
          <div class="text-2xl font-bold">{{ stats.totalCharacters.toLocaleString() }}</div>
          <div class="text-sm text-gray-600">{{ $t('total_characters') }}</div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end">
          <UButton @click="showStats = false">{{ $t('close') }}</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <!-- 快捷键帮助弹窗 -->
  <UModal v-model="showShortcuts">
    <UCard>
      <template #header>
        <h3 class="text-lg font-medium">{{ $t('shortcuts') }}</h3>
      </template>
      
      <div class="space-y-2">
        <div class="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
          <span>{{ $t('new_chat_shortcut') }}</span>
          <kbd class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+N</kbd>
        </div>
        <div class="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
          <span>{{ $t('focus_input') }}</span>
          <kbd class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+/</kbd>
        </div>
        <div class="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
          <span>{{ $t('toggle_sidebar') }}</span>
          <kbd class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+B</kbd>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end">
          <UButton @click="showShortcuts = false">{{ $t('close') }}</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ChatEnhancements } from '~/utils/chatEnhancements'

const props = defineProps<{
  messages: HistoryItem[]
}>()

const emit = defineEmits<{
  search: [query: string]
  speechInput: [text: string]
}>()

const { t } = useI18n()
const toast = useToast()

// 响应式数据
const searchQuery = ref('')
const isRecording = ref(false)
const showStats = ref(false)
const showShortcuts = ref(false)

// 统计数据
const stats = computed(() => ChatEnhancements.getMessageStats(props.messages))

// 搜索处理
function handleSearch() {
  emit('search', searchQuery.value)
}

// 语音识别
let stopRecognition: (() => void) | null = null

function toggleSpeechRecognition() {
  if (isRecording.value) {
    stopRecognition?.()
    isRecording.value = false
  } else {
    stopRecognition = ChatEnhancements.startSpeechRecognition(
      (transcript) => {
        emit('speechInput', transcript)
      },
      (error) => {
        toast.add({
          title: t('speech_not_supported'),
          description: error,
          color: 'red'
        })
        isRecording.value = false
      }
    )
    isRecording.value = true
  }
}

// 导出功能
const exportItems = [
  [{
    label: t('export_as_md'),
    icon: 'i-heroicons-document-text',
    click: () => exportChat('md')
  }],
  [{
    label: t('export_as_txt'),
    icon: 'i-heroicons-document',
    click: () => exportChat('txt')
  }],
  [{
    label: t('export_as_json'),
    icon: 'i-heroicons-code-bracket',
    click: () => exportChat('json')
  }]
]

function exportChat(format: 'md' | 'txt' | 'json') {
  const content = ChatEnhancements.exportChat(props.messages, format)
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `chat-export-${timestamp}.${format}`
  
  const mimeTypes = {
    md: 'text/markdown',
    txt: 'text/plain',
    json: 'application/json'
  }
  
  ChatEnhancements.downloadFile(content, filename, mimeTypes[format])
  
  toast.add({
    title: t('export_chat'),
    description: `已导出为 ${filename}`,
    icon: 'i-heroicons-check-circle'
  })
}

// 清理
onUnmounted(() => {
  if (isRecording.value) {
    stopRecognition?.()
  }
})
</script>
