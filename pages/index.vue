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
</script>

<template>
  <div class="flex h-full w-full overflow-hidden bg-white dark:bg-gray-900">
    <Sidebar :tabs="tabs" :selected="selectedTab" :handle-delete="handleDelete" :handle-new-chat="handleNewChat"
             :handle-switch-chat="handleSwitchChat"/>
    
    <main class="flex-1 flex flex-col h-full relative min-w-0">
      <!-- Top Bar -->
      <div class="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
         <div class="flex items-center gap-2">
           <button @click="openAside = !openAside" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
              <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
           </button>
           <button @click="openModelSelect = true" class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-gray-700 dark:text-gray-200">
             <span>{{ selectedModel.name }}</span>
             <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-gray-500" />
           </button>
         </div>
         <div class="w-8"></div> 
      </div>

      <USkeleton v-if="initializing" class="h-24 w-3/5 self-center rounded-xl mt-20"/>

      <template v-else>
        <!-- Chat Area -->
        <div class="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700" id="chatList">
          <ChatList :history="history" :loading="loading"/>
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-white dark:bg-gray-900">
          <div class="max-w-3xl mx-auto">
             <ChatInput :session="session" :loading="loading" :selected-model="selectedModel"
                        :handle-send="handleSend"/>
             <div class="text-xs text-center text-gray-400 mt-2">
                AI can make mistakes. Consider checking important information.
             </div>
          </div>
        </div>
      </template>
      
      <ModelSelect/>
      <Pass/>
    </main>
  </div>
</template>