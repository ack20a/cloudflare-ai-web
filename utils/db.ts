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
    openaiKey: '',
    image_steps: 20,
    system_prompt: 'You are ChatGPT, a large language model trained by OpenAI.Respond using markdown.',
}

export type Settings = typeof initialSettings

export const uniModals: Model[] = [
  { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro 002', provider: 'google', type: 'universal' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', type: 'universal' },
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'openai', type: 'universal' },
  { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B (Preview)', provider: 'openai', type: 'universal' },
  { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash 002', provider: 'google', type: 'universal' },
  { id: 'ack-4o', name: 'ACK-4o', provider: 'openai', type: 'universal' },
  { id: 'ack-search', name: 'ACK-Search', provider: 'openai', type: 'universal' },
  { id: 'ack-3.5-sonnet', name: 'ACK-3.5-Sonnet', provider: 'openai', type: 'universal' }
];

export const textGenModels: Model[] = [{
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    type: 'chat'
}, {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'openai',
    type: 'chat'
}, {
    id: '@hf/google/gemma-7b-it',
    name: 'Gemma 7B',
    provider: 'workers-ai',
    type: 'chat'
}, {
    id: '@cf/deepseek-ai/deepseek-math-7b-instruct',
    name: 'DeepSeekMath 7b 极速版',
    provider: 'workers-ai',
    type: 'chat'
}]

export const imageGenModels: Model[] = [{
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'stable-diffusion-xl-base-1.0',
    provider: 'workers-ai-image',
    type: 'text-to-image'
}, {
    id: '@cf/black-forest-labs/flux-1-schnell',
    name: 'flux-1-schnell',
    provider: 'workers-ai-image',
    type: 'text-to-image'
}]

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]