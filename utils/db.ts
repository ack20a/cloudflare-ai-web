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

export const uniModals: Model[] = [
{id: 'GPT-5', name: 'GPT-5', provider: 'openai', type: 'universal' },
{id: 'gpt-oss-120b', name: 'GPT OSS Ultra', provider: 'openai', type: 'chat' },
{id: 'openai/gpt-oss-120b', name: 'GPT OSS', provider: 'openai', type: 'chat' },
{id: 'gemini-2.5-pro', name: '🖼️Gemini 2.5 Pro', provider: 'openai', type: 'universal' },
{id: 'gemini-2.5-pro-search', name: '🖼️2.5 Pro Search', provider: 'openai', type: 'universal' },
{id: 'gemini-2.0-flash-thinking-exp-01-21', name: '🖼️Gemini Thinking 0121', provider: 'openai', type: 'universal' },
{id: 'gemini-2.0-flash-thinking-exp-01-21-search', name: '🖼️0121 Search', provider: 'openai', type: 'universal' },
{id: 'gemini-2.0-flash-exp-image', name: '🎨Gemini Image', provider: 'openai', type: 'universal' },
{id: 'moonshotai/kimi-k2-instruct', name: 'Kimi K2', provider: 'openai', type: 'chat' },
{id: 'qwen-3-235b-a22b-thinking-2507', name: 'Qwen 32a Thinking 2507', provider: 'openai', type: 'chat' },
{id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', provider: 'openai', type: 'chat' },
];

export const textGenModels: Model[] = [
{id: 'nyk-dsr1', name: '牛永康(DeepSeek-R1)', provider: 'openai', type: 'chat'},
]

export const imageGenModels: Model[] = []

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]
