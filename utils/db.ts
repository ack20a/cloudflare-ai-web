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

export const uniModals: Model[] = [
  { id: 'o3-mini', name: 'o3-mini', provider: 'openai', type: 'universal' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek-R1（超快）', provider: 'openai', type: 'universal' },
  { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek-R1（稳定）', provider: 'openai', type: 'universal' },
  { id: 'deepseek-r1', name: 'DeepSeek-R1（备用）', provider: 'openai', type: 'universal' },
  { id: 'deepseek-v3', name: 'DeepSeek-V3', provider: 'openai', type: 'universal' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', provider: 'openai', type: 'universal' },
  { id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Flash Thinking Experimental 01-21', provider: 'openai', type: 'universal' },
];

export const textGenModels: Model[] = [
  {id: 'nyk', name: '牛永康', provider: 'openai', type: 'universal'},
  {id: 'sonar', name: 'Search', provider: 'openai', type: 'chat'},
  {id: 'flux', name: 'GPT-4o mini Image', provider: 'openai', type: 'universal'},
  { id: 'glm-image', name: 'AI生图-智谱清言', provider: 'openai', type: 'universal' },
  { id: 'glm', name: '智谱清言(慢)', provider: 'openai', type: 'universal' },
  {id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'openai', type: 'universal'},
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', type: 'universal' },
]

export const imageGenModels: Model[] = []

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]