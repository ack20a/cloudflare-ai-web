<script setup lang="ts">
import {openAIReq} from "~/utils/api";

const route = useRoute()
const router = useRouter()
const {t} = useI18n()

const tabs = ref<TabItem[]>([])
const history = ref<HistoryItem[]>([])
const selectedTab = ref(0)
const composerDraft = ref('')
const chatInputRef = ref<{ focusComposer?: () => void } | null>(null)
const {selectedModel} = useGlobalState()
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
  composerDraft.value = ''

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
  composerDraft.value = ''
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
  composerDraft.value = ''
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
  composerDraft.value = ''
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

function handlePromptSelect(prompt: string) {
  composerDraft.value = prompt
  nextTick(() => {
    chatInputRef.value?.focusComposer?.()
  })
}
</script>

<template>
  <div class="relative flex-1 overflow-hidden">
    <div class="absolute inset-0 -z-20 bg-gradient-to-br from-emerald-600/30 via-slate-900 to-slate-950"/>
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_55%)]"/>

    <UContainer class="relative flex h-full w-full flex-col overflow-hidden py-6">
      <ModelSelect/>
      <Pass/>

      <div class="flex h-full w-full flex-1 gap-6 overflow-hidden">
        <Sidebar :tabs="tabs" :selected="selectedTab" :handle-delete="handleDelete" :handle-new-chat="handleNewChat"
                 :handle-switch-chat="handleSwitchChat"/>

        <main class="flex h-full w-full flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/5 dark:bg-black/40">
          <USkeleton v-if="initializing" class="h-24 w-3/5 self-end rounded-3xl"/>
          <USkeleton v-if="initializing" class="h-24 w-3/5 rounded-3xl mt-4"/>

          <template v-else>
            <ChatList id="chatList" :history="history" :loading="loading" @select-prompt="handlePromptSelect"/>
            <ChatInput ref="chatInputRef" class="mt-6" :session="session" :loading="loading"
                       :selected-model="selectedModel" :handle-send="handleSend" :draft="composerDraft"
                       @update:draft="composerDraft = $event" @clear-draft="composerDraft = ''"/>
          </template>
        </main>
      </div>
    </UContainer>
  </div>
</template>