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
    system_prompt: 'You are ChatGPT, a large language model trained by OpenAI. Follow the user\'s instructions carefully. Respond using markdown.',
}

export type Settings = typeof initialSettings

export const uniModals: Model[] = [
  { id: 'gemini-1.5-pro-exp-0827', name: 'Gemini 1.5 Pro Experiment 0827', provider: 'google', type: 'universal' },
  { id: 'gemini-1.5-pro-search', name: 'Gemini 1.5 Pro Search', provider: 'google', type: 'universal' },
  { id: 'gemini-1.5-flash-exp-0827', name: 'Gemini 1.5 flash Experiment 0827', provider: 'google', type: 'universal' }
];

export const textGenModels: Model[] = [{
    id: '@cf/qwen/qwen1.5-14b-chat-awq',
    name: '通义千问1.5 14b',
    provider: 'workers-ai',
    type: 'chat'
}, {
    id: '@cf/google/gemma-7b-it',
    name: 'Gemma 7B',
    provider: 'workers-ai',
    type: 'chat'
}, {
    id: '@cf/deepseek-ai/deepseek-math-7b-instruct',
    name: 'DeepSeekMath 7b 极速版',
    provider: 'workers-ai',
    type: 'chat'
}, {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8b 极速版',
    provider: 'workers-ai',
    type: 'chat'
}, {
    id: '@cf/mistral/mistral-7b-instruct-v0.2',
    name: 'Mistral 7B 极速版',
    provider: 'workers-ai',
    type: 'chat'
}]

export const imageGenModels: Model[] = [{
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'stable-diffusion-xl-base-1.0',
    provider: 'workers-ai-image',
    type: 'text-to-image'
}, {
    id: '@cf/lykon/dreamshaper-8-lcm',
    name: 'dreamshaper-8-lcm',
    provider: 'workers-ai-image',
    type: 'text-to-image'
}]

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]
