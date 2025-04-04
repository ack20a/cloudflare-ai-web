import Dexie, {type Table} from 'dexie';

export class Database extends Dexie {
    history!: Table<HistoryItem>
    tab!: Table<TabItem>

    constructor() {
        super('ai')
        this.version(4).stores({
            history: '++id, session, type, role, content, src',
            tab: '++id, label'
        })
        this.version(5).stores({
            tab: '++id, label, created_at',
            history: '++id, session, type, role, content, src, created_at',
        }).upgrade(trans => {
            return trans.table('history').toCollection().modify(async i => {
                if (i.type === 'image') {
                    i.content = ''
                    i.src = [i.src]
                }
            })
        })
    }

    getLatestTab() {
        return DB.tab.orderBy('id').last();
    }

    getTabs() {
        return DB.tab.limit(100).reverse().toArray()
    }

    async getHistory(session: number) {
        const arr = await DB.history.where('session').equals(session).limit(100).toArray()
        arr.forEach(i => {
            if (i.type === 'image') {
                i.src_url = []
                i.src?.forEach(src => {
                    i.src_url!.push(URL.createObjectURL(src))
                })
                i.content = 'image'
            }
        })
        return arr
    }

    addTab(label: string) {
        return DB.tab.add({label, created_at: Date.now()})
    }

    deleteTabAndHistory(id: number) {
        return DB.transaction('rw', DB.tab, DB.history, async () => {
            await DB.tab.delete(id)
            await DB.history.where('session').equals(id).delete()
        })
    }
}

export const DB = new Database();

export const initialSettings = {
    openaiKey: process.env.OPENAI_API_KEY || '',
    image_steps: 20,
    system_prompt: 'You are ChatGPT, a large language model trained by OpenAI. Personality: v2.',
}

export type Settings = typeof initialSettings

// 所有模型都已设置为OpenAI提供商
export const uniModals: Model[] = [
  { id: 'unsloth/gemma-3-27b-it', name: 'Gemma 3 27b It', provider: 'openai', type: 'universal' },
  { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek-R1（稳定）', provider: 'openai', type: 'chat' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', provider: 'openai', type: 'universal' },
  { id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Flash Thinking Experimental 01-21', provider: 'openai', type: 'universal' },
];

export const textGenModels: Model[] = [
  {id: 'nyk-dsr1', name: '牛永康（DeepSeek-R1）', provider: 'openai', type: 'chat'},
  {id: 'flux', name: 'DeepSeek-R1 Image', provider: 'openai', type: 'universal'},
  {id: 'sonar', name: 'Search', provider: 'openai', type: 'chat'},
  { id: 'openai-large', name: 'GPT-4o', provider: 'openai', type: 'universal' },
]

export const imageGenModels: Model[] = []

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]