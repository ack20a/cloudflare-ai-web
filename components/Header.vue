<script setup lang="ts">
import {useDark, useToggle} from "@vueuse/core";
import {useGlobalState} from "~/utils/store";

const isDark = useDark()
const toggleDark = useToggle(isDark)
const {openAside} = useGlobalState()

// 新增的弹窗状态
const showSettings = ref(false)
const showPerformance = ref(false)

onMounted(() => {
  const open = localStorage.getItem('openAside')
  openAside.value = open === 'true' || open === null
})
watch(openAside, (v) => {
  localStorage.setItem('openAside', v.toString())
})

function handleReload() {
  location.reload()
}
</script>

<template>
  <header class="blur-global dark:bg-neutral-800 shadow h-16 fixed w-full z-30 rounded-b-lg">
    <UContainer class="h-full flex items-center">
      <UButton variant="ghost" size="sm" @click="openAside = !openAside" 
               icon="i-heroicons-bars-3-20-solid" square />
      <h1 @click="handleReload" class="text-lg font-bold ml-2 hover:cursor-pointer">永康 AI Web</h1>
      
      <div class="ml-auto flex items-center gap-2">
        <!-- 性能监控 -->
        <UButton 
          variant="ghost" 
          size="sm" 
          icon="i-heroicons-chart-bar"
          @click="showPerformance = true"
          :title="'性能监控'"
          square 
        />
        
        <!-- 设置 -->
        <UButton 
          variant="ghost" 
          size="sm" 
          icon="i-heroicons-cog-6-tooth"
          @click="showSettings = true"
          :title="$t('setting')"
          square 
        />
        
        <!-- 主题切换 -->
        <UButton 
          variant="ghost" 
          size="sm" 
          :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
          @click="toggleDark()" 
          square 
        />
      </div>
    </UContainer>
    
    <!-- 设置面板 -->
    <SettingsPanel v-model="showSettings" />
    
    <!-- 性能监控面板 -->
    <PerformanceDashboard v-model="showPerformance" />
  </header>
</template>