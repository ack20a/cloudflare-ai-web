<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-4xl' }">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium">性能监控</h3>
          <div class="flex gap-2">
            <UButton
              icon="i-heroicons-arrow-path"
              variant="outline"
              size="sm"
              @click="refreshMetrics"
            >
              刷新
            </UButton>
            <UButton 
              icon="i-heroicons-x-mark" 
              variant="ghost" 
              @click="isOpen = false"
            />
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- 实时指标 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ responseTime }}ms</div>
            <div class="text-sm text-gray-600">平均响应时间</div>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ requestCount }}</div>
            <div class="text-sm text-gray-600">总请求数</div>
          </div>
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div class="text-2xl font-bold text-yellow-600">{{ errorRate }}%</div>
            <div class="text-sm text-gray-600">错误率</div>
          </div>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{{ memoryUsage }}MB</div>
            <div class="text-sm text-gray-600">内存使用</div>
          </div>
        </div>

        <!-- 性能图表 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="border rounded-lg p-4">
            <h4 class="font-medium mb-4">响应时间趋势</h4>
            <div class="h-40 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center">
              <span class="text-gray-500">图表区域 - 可集成 Chart.js 等图表库</span>
            </div>
          </div>
          
          <div class="border rounded-lg p-4">
            <h4 class="font-medium mb-4">错误统计</h4>
            <div class="space-y-2">
              <div v-for="error in errorStats" :key="error.type" class="flex justify-between">
                <span class="text-sm">{{ error.type }}</span>
                <span class="text-sm font-medium">{{ error.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细指标 -->
        <div>
          <h4 class="font-medium mb-4">详细性能指标</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">操作</th>
                  <th class="text-left p-2">执行次数</th>
                  <th class="text-left p-2">平均耗时</th>
                  <th class="text-left p-2">最大耗时</th>
                  <th class="text-left p-2">最小耗时</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="metric in detailedMetrics" :key="metric.name" class="border-b">
                  <td class="p-2">{{ metric.name }}</td>
                  <td class="p-2">{{ metric.count }}</td>
                  <td class="p-2">{{ metric.avgTime }}ms</td>
                  <td class="p-2">{{ metric.maxTime }}ms</td>
                  <td class="p-2">{{ metric.minTime }}ms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 内存分析 -->
        <div>
          <h4 class="font-medium mb-4">内存使用分析</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="border rounded-lg p-4">
              <div class="text-lg font-semibold">{{ heapUsed }}MB</div>
              <div class="text-sm text-gray-600">已使用堆内存</div>
            </div>
            <div class="border rounded-lg p-4">
              <div class="text-lg font-semibold">{{ heapTotal }}MB</div>
              <div class="text-sm text-gray-600">总堆内存</div>
            </div>
            <div class="border rounded-lg p-4">
              <div class="text-lg font-semibold">{{ cacheSize }}个</div>
              <div class="text-sm text-gray-600">缓存项数量</div>
            </div>
          </div>
        </div>

        <!-- 建议优化 -->
        <div v-if="optimizationSuggestions.length > 0">
          <h4 class="font-medium mb-4">优化建议</h4>
          <div class="space-y-2">
            <div
              v-for="suggestion in optimizationSuggestions"
              :key="suggestion.id"
              class="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
            >
              <UIcon name="i-heroicons-light-bulb" class="text-yellow-500 mt-1" />
              <div>
                <div class="font-medium">{{ suggestion.title }}</div>
                <div class="text-sm text-gray-600">{{ suggestion.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton
            variant="outline"
            @click="exportMetrics"
          >
            导出数据
          </UButton>
          <UButton @click="isOpen = false">
            关闭
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { PerformanceMonitor } from '~/utils/performance'
import { ChatEnhancements } from '~/utils/chatEnhancements'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 性能指标数据
const responseTime = ref(0)
const requestCount = ref(0)
const errorRate = ref(0)
const memoryUsage = ref(0)
const heapUsed = ref(0)
const heapTotal = ref(0)
const cacheSize = ref(0)

const errorStats = ref([
  { type: '网络错误', count: 2 },
  { type: 'API错误', count: 1 },
  { type: '解析错误', count: 0 }
])

const detailedMetrics = ref([
  { name: 'basicFetch', count: 45, avgTime: 234, maxTime: 567, minTime: 123 },
  { name: 'chatRender', count: 12, avgTime: 56, maxTime: 89, minTime: 34 },
  { name: 'imageUpload', count: 3, avgTime: 1234, maxTime: 2345, minTime: 890 }
])

const optimizationSuggestions = ref([
  {
    id: 1,
    title: '启用图片压缩',
    description: '检测到大尺寸图片上传，建议启用自动压缩以提升性能'
  },
  {
    id: 2,
    title: '清理缓存',
    description: '缓存项数量较多，建议定期清理以释放内存'
  }
])

// 刷新指标
function refreshMetrics() {
  // 获取实际性能数据
  const metrics = PerformanceMonitor.getMetrics()
  
  // 模拟数据更新
  responseTime.value = Math.round(Math.random() * 500 + 100)
  requestCount.value = Object.keys(metrics).length
  errorRate.value = Math.round(Math.random() * 5 * 100) / 100
  
  // 获取内存信息（如果可用）
  if (performance.memory) {
    heapUsed.value = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
    heapTotal.value = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
    memoryUsage.value = heapUsed.value
  }
  
  // 模拟缓存大小
  cacheSize.value = Math.floor(Math.random() * 100 + 50)
  
  console.log('性能指标已刷新', metrics)
}

// 导出指标数据
function exportMetrics() {
  const data = {
    timestamp: new Date().toISOString(),
    metrics: {
      responseTime: responseTime.value,
      requestCount: requestCount.value,
      errorRate: errorRate.value,
      memoryUsage: memoryUsage.value
    },
    detailedMetrics: detailedMetrics.value,
    errorStats: errorStats.value,
    performanceEntries: PerformanceMonitor.getMetrics()
  }
  
  ChatEnhancements.downloadFile(
    JSON.stringify(data, null, 2),
    `performance-report-${new Date().toISOString().split('T')[0]}.json`,
    'application/json'
  )
}

// 初始化数据
onMounted(() => {
  refreshMetrics()
  
  // 定期刷新数据
  const interval = setInterval(refreshMetrics, 5000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>
