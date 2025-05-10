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
{id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1|128K', provider: 'openai', type: 'chat' },
{id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash Preview 04-17|👁️|1M', provider: 'openai', type: 'universal' },
{id: 'gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro Preview 03-25|👁️|1M', provider: 'openai', type: 'universal' },
{id: 'nvidia/Llama-3_1-Nemotron-Ultra-253B-v1', name: 'Llama 3.1 Nemotron Ultra 253B V1|👁️|128k', provider: 'openai', type: 'universal' },
{id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3-235B-A22B|128K', provider: 'openai', type: 'chat' },
{id: 'deepseek-ai/DeepSeek-Prover-V2-671B', name: 'DeepSeek-Prover-V2-671B|128K', provider: 'openai', type: 'chat' },
];

export const textGenModels: Model[] = [
{id: 'nyk-dsr1', name: '牛永康(DeepSeek-R1)', provider: 'openai', type: 'chat'},
{id: 'flux', name: '生图(DeepSeek-R1)', provider: 'openai', type: 'chat'},
]

export const imageGenModels: Model[] = []

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]