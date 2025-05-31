<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium">{{ $t('setting') }}</h3>
          <UButton 
            icon="i-heroicons-x-mark" 
            variant="ghost" 
            @click="isOpen = false"
          />
        </div>
      </template>

      <UTabs :items="tabs" class="w-full">
        <!-- 基本设置 -->
        <template #general="{ item }">
          <div class="space-y-6 p-4">
            <!-- 主题设置 -->
            <div>
              <label class="block text-sm font-medium mb-2">主题</label>
              <USelectMenu
                v-model="localConfig.theme"
                :options="themeOptions"
                @change="saveConfig"
              />
            </div>

            <!-- 语言设置 -->
            <div>
              <label class="block text-sm font-medium mb-2">语言</label>
              <USelectMenu
                v-model="localConfig.language"
                :options="languageOptions"
                @change="saveConfig"
              />
            </div>

            <!-- 默认模型 -->
            <div>
              <label class="block text-sm font-medium mb-2">默认模型</label>
              <USelectMenu
                v-model="localConfig.defaultModel"
                :options="modelOptions"
                @change="saveConfig"
              />
            </div>

            <!-- 自动保存 -->
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">自动保存</label>
              <UToggle
                v-model="localConfig.autoSave"
                @change="saveConfig"
              />
            </div>

            <!-- 自动保存间隔 -->
            <div v-if="localConfig.autoSave">
              <label class="block text-sm font-medium mb-2">
                自动保存间隔（分钟）
              </label>
              <UInput
                v-model.number="localConfig.autoSaveInterval"
                type="number"
                min="1"
                max="60"
                @change="saveConfig"
              />
            </div>
          </div>
        </template>

        <!-- 高级设置 -->
        <template #advanced="{ item }">
          <div class="space-y-6 p-4">
            <!-- API超时 -->
            <div>
              <label class="block text-sm font-medium mb-2">
                API超时（秒）
              </label>
              <UInput
                v-model.number="localConfig.apiTimeout"
                type="number"
                min="5"
                max="300"
                @change="saveConfig"
              />
            </div>

            <!-- 重试次数 -->
            <div>
              <label class="block text-sm font-medium mb-2">重试次数</label>
              <UInput
                v-model.number="localConfig.retryAttempts"
                type="number"
                min="0"
                max="10"
                @change="saveConfig"
              />
            </div>

            <!-- 最大历史长度 -->
            <div>
              <label class="block text-sm font-medium mb-2">
                最大历史记录数
              </label>
              <UInput
                v-model.number="localConfig.maxHistoryLength"
                type="number"
                min="100"
                max="10000"
                @change="saveConfig"
              />
            </div>

            <!-- 图片压缩 -->
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">压缩图片</label>
              <UToggle
                v-model="localConfig.compressImages"
                @change="saveConfig"
              />
            </div>

            <!-- 图片质量 -->
            <div v-if="localConfig.compressImages">
              <label class="block text-sm font-medium mb-2">
                图片质量 ({{ Math.round(localConfig.imageQuality * 100) }}%)
              </label>
              <URange
                v-model="localConfig.imageQuality"
                :min="0.1"
                :max="1"
                :step="0.1"
                @change="saveConfig"
              />
            </div>

            <!-- 最大文件大小 -->
            <div>
              <label class="block text-sm font-medium mb-2">
                最大文件大小（MB）
              </label>
              <UInput
                v-model.number="localConfig.maxFileSize"
                type="number"
                min="1"
                max="100"
                @change="saveConfig"
              />
            </div>
          </div>
        </template>

        <!-- 功能设置 -->
        <template #features="{ item }">
          <div class="space-y-6 p-4">
            <!-- 语音识别 -->
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium">语音识别</label>
                <p class="text-xs text-gray-500">启用语音输入功能</p>
              </div>
              <UToggle
                v-model="localConfig.enableSpeechRecognition"
                @change="saveConfig"
              />
            </div>

            <!-- 声音提示 -->
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium">声音提示</label>
                <p class="text-xs text-gray-500">消息发送和接收时播放声音</p>
              </div>
              <UToggle
                v-model="localConfig.enableSounds"
                @change="saveConfig"
              />
            </div>

            <!-- 通知 -->
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium">桌面通知</label>
                <p class="text-xs text-gray-500">新消息时显示桌面通知</p>
              </div>
              <UToggle
                v-model="localConfig.enableNotifications"
                @change="saveConfig"
              />
            </div>
          </div>
        </template>

        <!-- 快捷键设置 -->
        <template #shortcuts="{ item }">
          <div class="space-y-4 p-4">
            <div
              v-for="(action, key) in localConfig.shortcuts"
              :key="key"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <span class="font-medium">{{ getActionName(action) }}</span>
                <p class="text-xs text-gray-500">{{ getActionDescription(action) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <kbd class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
                  {{ key.replace(/\+/g, ' + ').toUpperCase() }}
                </kbd>
                <UButton
                  icon="i-heroicons-pencil"
                  size="xs"
                  variant="ghost"
                  @click="editShortcut(key, action)"
                />
              </div>
            </div>
          </div>
        </template>
      </UTabs>

      <template #footer>
        <div class="flex justify-between">
          <div class="flex gap-2">
            <UButton
              variant="outline"
              @click="exportConfig"
            >
              导出配置
            </UButton>
            <UButton
              variant="outline"
              @click="importConfig"
            >
              导入配置
            </UButton>
          </div>
          <div class="flex gap-2">
            <UButton
              variant="outline"
              @click="resetConfig"
            >
              重置
            </UButton>
            <UButton @click="isOpen = false">
              {{ $t('close') }}
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { useConfig, ConfigManager, type AppConfig } from '~/utils/config'
import { uniModals } from '~/utils/db'
import { ChatEnhancements } from '~/utils/chatEnhancements'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const toast = useToast()
const { config, updateConfig, resetConfig: resetAppConfig } = useConfig()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 本地配置副本
const localConfig = ref<AppConfig>({ ...config.value })

// 监听外部配置变化
watch(config, (newConfig) => {
  localConfig.value = { ...newConfig }
}, { deep: true })

// 选项配置
const tabs = [
  { key: 'general', label: '基本设置', icon: 'i-heroicons-cog' },
  { key: 'advanced', label: '高级设置', icon: 'i-heroicons-cog-6-tooth' },
  { key: 'features', label: '功能设置', icon: 'i-heroicons-sparkles' },
  { key: 'shortcuts', label: '快捷键', icon: 'i-heroicons-command-line' }
]

const themeOptions = [
  { label: '自动', value: 'auto' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
]

const languageOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' }
]

const modelOptions = uniModals.map(model => ({
  label: model.name,
  value: model.id
}))

// 保存配置
function saveConfig() {
  updateConfig(localConfig.value)
  toast.add({
    title: '设置已保存',
    icon: 'i-heroicons-check-circle'
  })
}

// 重置配置
function resetConfig() {
  resetAppConfig()
  localConfig.value = { ...config.value }
  toast.add({
    title: '设置已重置',
    icon: 'i-heroicons-arrow-path'
  })
}

// 导出配置
function exportConfig() {
  const configJson = ConfigManager.export()
  ChatEnhancements.downloadFile(
    configJson,
    `settings-${new Date().toISOString().split('T')[0]}.json`,
    'application/json'
  )
  toast.add({
    title: '配置已导出',
    icon: 'i-heroicons-arrow-down-tray'
  })
}

// 导入配置
function importConfig() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      try {
        const text = await file.text()
        if (ConfigManager.import(text)) {
          localConfig.value = { ...config.value }
          toast.add({
            title: '配置导入成功',
            icon: 'i-heroicons-check-circle'
          })
        } else {
          throw new Error('Invalid config format')
        }
      } catch {
        toast.add({
          title: '配置导入失败',
          description: '配置文件格式不正确',
          color: 'red'
        })
      }
    }
  }
  input.click()
}

// 快捷键相关
function getActionName(action: string): string {
  const names: Record<string, string> = {
    newChat: '新建对话',
    focusInput: '聚焦输入框',
    toggleSidebar: '切换侧边栏',
    search: '搜索',
    send: '发送消息'
  }
  return names[action] || action
}

function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    newChat: '创建新的对话会话',
    focusInput: '将焦点移动到输入框',
    toggleSidebar: '显示或隐藏侧边栏',
    search: '搜索消息内容',
    send: '发送当前输入的消息'
  }
  return descriptions[action] || ''
}

function editShortcut(key: string, action: string) {
  // TODO: 实现快捷键编辑功能
  toast.add({
    title: '功能开发中',
    description: '快捷键编辑功能即将推出'
  })
}
</script>
