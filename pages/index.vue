<script setup lang="ts">
import {openAIReq} from "~/utils/api";

const route = useRoute()
const router = useRouter()
const {t} = useI18n()

const tabs = ref<TabItem[]>([])
const history = ref<HistoryItem[]>([])
const selectedTab = ref(0)
const {selectedModel, openAside, openModelSelect} = useGlobalState()
const initializing = ref(true)
const loading = ref(false)
let session: number = 0

async function initDB() {
  session = await DB.addTab(t('new_chat')) as number
  tabs.value.unshift({
    id: session,
    label: t('new_chat'),
    created_at: Date.now()
  })
  selectedTab.value = session
  await router.push({query: {session}})
}

async function loadData() {
  [tabs.value, history.value] = await Promise.all([DB.getTabs(), DB.getHistory(session)]);
  selectedTab.value = session
}

async function getLatestData() {
  const tab = await DB.getLatestTab()
  if (tab) {
    session = tab.id!
    await loadData()
    await router.push({query: {session}})
  } else await initDB()
}

onMounted(async () => {
  let s = parseInt(route.query.session as string)
  if (Number.isNaN(s)) {
    await getLatestData()
  } else {
    const tab = await DB.tab.get(s)
    if (tab) {
      session = tab.id!
      await loadData()
    } else await getLatestData()
  }

  initializing.value = false
})

async function handleNewChat() {
  if (loading.value) return

  await initDB()
  history.value = []

  await nextTick(() => {
    const tabEl = document.getElementById('tabEl')
    scrollToTop(tabEl)
  })
}

async function handleSwitchChat(e: MouseEvent) {
  if (loading.value) return

  history.value.forEach(i => {
    if (i.src_url) {
      i.src_url.forEach(URL.revokeObjectURL)
    }
  })

  const target = e.target as HTMLElement
  const id = target.dataset.id
  if (!id) return
  if (parseInt(id) === selectedTab.value) return
  selectedTab.value = parseInt(id)
  history.value = await DB.getHistory(parseInt(id))
  await router.push({query: {session: id}})
  session = parseInt(id)
}

async function handleDelete(id: number) {
  if (loading.value) return

  if (tabs.value.length === 1) return
  tabs.value = tabs.value.filter(i => i.id !== id)
  DB.deleteTabAndHistory(id)

  const nid = tabs.value[0].id as number
  selectedTab.value = nid
  history.value = await DB.getHistory(nid)
  await router.push({query: {session: nid}})
  session = nid
}

function basicCatch(e: Error) {
  history.value[history.value.length - 1].content += e.message
  history.value[history.value.length - 1].type = 'error'
  nextTick(() => {
    const chatList = document.getElementById('chatList')
    scrollToTop(chatList)
  })
  DB.history.add(toRaw(history.value[history.value.length - 1]))
}

function basicFin() {
  loading.value = false
}

function basicDone() {
  DB.history.add(toRaw(history.value[history.value.length - 1]))
}

async function handleSend(input: string, addHistory: boolean, files: {
  file: File
  url: string
}[]) {
  loading.value = true
  const type = selectedModel.value.type

  if (history.value.length === 0) {
    const label = input.substring(0, 15)
    DB.tab.update(session, {label}).then(() => {
      tabs.value.find(i => i.id === session)!.label = label
    })
  }

  if (files.length) {
    await addFiles(files)
  }

  const historyItem: HistoryItem = {
    session,
    role: 'user',
    content: input,
    type: type === 'text-to-image' ? 'image-prompt' : 'text',
    created_at: Date.now()
  }
  const id = await DB.history.add(historyItem) as number
  history.value.push({
    id,
    ...historyItem
  })
  history.value.push({
    id: id + 1,
    session,
    role: 'assistant',
    content: '',
    type: (type === 'chat' || type === 'universal') ? 'text' : 'image',
    created_at: Date.now()
  })

  const chatList = document.getElementById('chatList') as HTMLElement
  nextTick(() => {
    scrollToTop(chatList)
  }).then(r => r)

  const req = {
    model: selectedModel.value.id,
    messages: getMessages(toRaw(history.value), {addHistory, type})
  }
  switch (selectedModel.value.provider) {
    case 'openai':
      openAIReq({
        ...req,
        endpoint: selectedModel.value.endpoint!,
        key: process.env.OPENAI_API_KEY || '',
        files: files.map(f => f.file)
      }, text => {
        history.value[history.value.length - 1].content += text
        scrollStream(chatList)
      }).then(basicDone).catch(basicCatch).finally(basicFin)
      break
  }
}

async function addFiles(files: {
  file: File
  url: string
}[]) {
  const historyItem: HistoryItem = {
    session,
    role: 'user',
    content: 'input image',
    type: 'image',
    created_at: Date.now(),
    src: files.map(i => i.file),
  }
  const id: number = await DB.history.add(historyItem)
  history.value.push({
    id,
    src_url: files.map(i => i.url),
    ...historyItem
  })
}

async function handleRetry() {
  if (loading.value) return
  
  const lastItem = history.value[history.value.length - 1]
  if (lastItem.role === 'assistant' || lastItem.type === 'error') {
     if (lastItem.id) {
         await DB.history.delete(lastItem.id)
     }
     history.value.pop()
  }
  
  loading.value = true
  const type = selectedModel.value.type
  
  history.value.push({
    id: (history.value[history.value.length-1]?.id || 0) + 1,
    session,
    role: 'assistant',
    content: '',
    type: (type === 'chat' || type === 'universal') ? 'text' : 'image',
    created_at: Date.now()
  })
  
  const chatList = document.getElementById('chatList') as HTMLElement
  nextTick(() => {
    scrollToTop(chatList)
  }).then(r => r)

  const req = {
    model: selectedModel.value.id,
    messages: getMessages(toRaw(history.value), {addHistory: true, type})
  }
  
  switch (selectedModel.value.provider) {
    case 'openai':
      openAIReq({
        ...req,
        endpoint: selectedModel.value.endpoint!,
        key: process.env.OPENAI_API_KEY || '',
        files: [] 
      }, text => {
        history.value[history.value.length - 1].content += text
        scrollStream(chatList)
      }).then(basicDone).catch(basicCatch).finally(basicFin)
      break
  }
}

const chatInputRef = ref()

const quickActions = [
  {
    key: 'image',
    icon: 'i-heroicons-photo',
    label: '生成图片',
    prompt: '生成一张赛博朋克风格的图片'
  },
  {
    key: 'code',
    icon: 'i-heroicons-code-bracket',
    label: '写代码',
    prompt: '写一段 Python 代码'
  },
  {
    key: 'explain',
    icon: 'i-heroicons-light-bulb',
    label: '解释概念',
    prompt: '解释一下量子纠缠'
  }
]

function handleQuote(text: string) {
  if (chatInputRef.value) {
    chatInputRef.value.setQuote(text)
  }
}
</script>

<template>
  <div class="page-shell">
    <Sidebar :tabs="tabs" :selected="selectedTab" :handle-delete="handleDelete" :handle-new-chat="handleNewChat"
             :handle-switch-chat="handleSwitchChat"/>

    <main class="page-main">
      <div class="top-bar">
        <div class="top-bar-left">
          <button @click="openAside = !openAside" class="icon-btn" type="button">
            <UIcon name="i-heroicons-bars-3" class="icon-20"/>
          </button>
          <button @click="openModelSelect = true" class="btn btn-secondary model-btn" type="button">
            <span>{{ selectedModel.name }}</span>
            <UIcon name="i-heroicons-chevron-down" class="icon-16"/>
          </button>
        </div>
        <button class="icon-btn" type="button">
          <UIcon name="i-heroicons-share" class="icon-20"/>
        </button>
      </div>

      <USkeleton v-if="initializing" class="init-skeleton"/>

      <template v-else>
        <div v-if="history.length === 0" class="welcome-screen">
          <div class="welcome-header">
            <div class="welcome-logo">
              <UIcon name="i-heroicons-sparkles" class="icon-20"/>
            </div>
            <h2 class="welcome-title">我们先从哪里开始呢？</h2>
          </div>

          <div class="welcome-input">
            <ChatInput ref="chatInputRef" :session="session" :loading="loading" :selected-model="selectedModel"
                       :handle-send="handleSend"/>
          </div>

          <div class="quick-actions">
            <button
              v-for="action in quickActions"
              :key="action.key"
              class="btn btn-secondary quick-action-btn"
              type="button"
              @click="handleSend(action.prompt, true, [])"
            >
              <UIcon :name="action.icon" class="icon-16"/>
              <span>{{ action.label }}</span>
            </button>
          </div>
        </div>

        <div v-else class="chat-area">
          <div class="chat-list" id="chatList">
            <ChatList :history="history" :loading="loading" @retry="handleRetry" @quote="handleQuote"/>
          </div>

          <div class="input-area">
            <div class="input-container">
              <ChatInput ref="chatInputRef" :session="session" :loading="loading" :selected-model="selectedModel"
                         :handle-send="handleSend"/>
              <div class="input-note">
                AI can make mistakes. Consider checking important information.
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <ModelSelect/>
      <Pass/>
    </main>
  </div>
</template>

<style scoped>
.page-shell {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--color-neutral-0);
}

.page-main {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  height: 100%;
  background: var(--color-neutral-0);
}

.top-bar {
  height: var(--space-14);
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
  padding-left: max(var(--space-4), env(safe-area-inset-left));
  padding-right: max(var(--space-4), env(safe-area-inset-right));
  border-bottom: 1px solid var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-neutral-0);
  z-index: 10;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.model-btn {
  height: var(--space-8);
  padding-right: var(--space-4);
  padding-left: var(--space-4);
}

.icon-16 {
  width: var(--space-4);
  height: var(--space-4);
}

.icon-20 {
  width: var(--space-5);
  height: var(--space-5);
}

.init-skeleton {
  margin-top: var(--space-12);
  align-self: center;
  width: 60%;
  height: var(--space-12);
  border-radius: var(--radius-md);
}

.welcome-screen {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-4);
  gap: var(--space-8);
}

.welcome-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.welcome-logo {
  width: var(--space-12);
  height: var(--space-12);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: var(--color-neutral-0);
}

.welcome-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-neutral-900);
}

.welcome-input {
  width: 100%;
  max-width: var(--layout-main-max);
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
}

.quick-action-btn {
  min-width: calc(var(--space-16) + var(--space-14));
}

.chat-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.chat-list {
  position: relative;
  flex: 1;
  overflow-y: auto;
}

.input-area {
  padding-top: var(--space-4);
  padding-right: var(--space-4);
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
  padding-left: var(--space-4);
  border-top: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-0);
}

.input-container {
  max-width: var(--layout-main-max);
  margin: 0 auto;
}

.input-note {
  margin-top: var(--space-2);
  text-align: center;
  color: var(--color-neutral-400);
  font-size: var(--text-xs);
}

</style>