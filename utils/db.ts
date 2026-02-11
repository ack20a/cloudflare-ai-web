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
{id: 'gemini-3-pro-high', name: 'Gemini 3 Pro High', provider: 'openai', type: 'universal' },
{id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'openai', type: 'universal' },
{id: 'gemini-3-pro-image', name: 'Nanobanana Pro', provider: 'openai', type: 'universal' },
{id: 'moonshotai/kimi-k2.5', name: 'Kimi K2.5', provider: 'openai', type: 'universal' },
{id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', provider: 'openai', type: 'chat' },
{id: 'deepseek-ai/deepseek-v3.2', name: 'DeepSeek-V3.2', provider: 'openai', type: 'chat' },
];

export const textGenModels: Model[] = [
]

export const imageGenModels: Model[] = []

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]
