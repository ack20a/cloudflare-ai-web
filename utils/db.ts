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
{id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', provider: 'openai', type: 'chat' },
{id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro 满血版', provider: 'openai', type: 'universal' },
{id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini Thinking 0121', provider: 'openai', type: 'universal' },
{id: 'bytedance/seed-oss-36b-instruct', name: '豆包 36B', provider: 'openai', type: 'chat' },
{id: 'qwen/qwen3-next-80b-a3b-thinking', name: 'Qwen 3 Next 80B', provider: 'openai', type: 'chat' },
{id: 'minimaxai/minimax-m2', name: 'MiniMax M2', provider: 'openai', type: 'chat' },
];

export const textGenModels: Model[] = [
]

export const imageGenModels: Model[] = []

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]
