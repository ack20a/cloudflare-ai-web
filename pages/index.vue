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

function handleQuote(text: string) {
  if (chatInputRef.value) {
    const quoteText = text.split('\n').map(line => `> ${line}`).join('\n') + '\n\n'
    chatInputRef.value.setInput(quoteText)
  }
}
</script>

<template>
  <div class="flex h-full w-full overflow-hidden bg-white dark:bg-[#212121]">
    <Sidebar :tabs="tabs" :selected="selectedTab" :handle-delete="handleDelete" :handle-new-chat="handleNewChat"
             :handle-switch-chat="handleSwitchChat"/>
    
    <main class="flex-1 flex flex-col h-full relative min-w-0">
      <!-- Top Bar -->
      <div class="h-14 flex items-center justify-between px-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] bg-white dark:bg-[#212121] z-10">
         <div class="flex items-center gap-2">
           <button @click="openAside = !openAside" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
              <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
           </button>
           <button @click="openModelSelect = true" class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2f2f2f] transition-colors font-medium text-gray-700 dark:text-gray-200 text-lg">
             <span>{{ selectedModel.name }}</span>
             <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-gray-500" />
           </button>
         </div>
         <div class="flex items-center gap-2">
            <button class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
               <UIcon name="i-heroicons-share" class="w-5 h-5" />
            </button>
         </div> 
      </div>

      <USkeleton v-if="initializing" class="h-24 w-3/5 self-center rounded-xl mt-20"/>

      <template v-else>
        <!-- Welcome Screen -->
        <div v-if="history.length === 0" class="flex-1 flex flex-col items-center justify-center p-4 text-center">
           <div class="mb-8">
              <div class="w-12 h-12 bg-white dark:bg-white/10 rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                 <UIcon name="i-heroicons-sparkles" class="w-6 h-6 text-gray-900 dark:text-white" />
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">我们先从哪里开始呢？</h2>
           </div>
           
           <div class="w-full max-w-3xl px-4">
              <ChatInput ref="chatInputRef" :session="session" :loading="loading" :selected-model="selectedModel"
                        :handle-send="handleSend"/>
           </div>
           
           <div class="mt-8 flex flex-wrap justify-center gap-2">
              <button @click="handleSend('生成一张赛博朋克风格的图片', true, [])" 
                      class="px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-600 dark:text-gray-300 transition-colors">
                 🎨 生成图片
              </button>
              <button @click="handleSend('写一段 Python 代码', true, [])" 
                      class="px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-600 dark:text-gray-300 transition-colors">
                 💻 写代码
              </button>
              <button @click="handleSend('解释一下量子纠缠', true, [])" 
                      class="px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-600 dark:text-gray-300 transition-colors">
                 🤔 解释概念
              </button>
           </div>
        </div>

        <!-- Chat Area -->
        <div v-else class="flex-1 flex flex-col h-full overflow-hidden">
          <div class="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700" id="chatList">
            <ChatList :history="history" :loading="loading" @retry="handleRetry" @quote="handleQuote"/>
          </div>

          <!-- Input Area -->
          <div class="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white dark:bg-[#212121]">
            <div class="max-w-3xl mx-auto">
               <ChatInput ref="chatInputRef" :session="session" :loading="loading" :selected-model="selectedModel"
                          :handle-send="handleSend"/>
               <div class="text-xs text-center text-gray-400 mt-2">
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