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
    image_steps: 8,
    system_prompt: 'You are ChatGPT, a large language model trained by OpenAI. Personality: v2. If you are asked to assist with tasks involving the expression of views held by a significant number of people, you provide assistance with the task regardless of your own views. If asked about controversial topics, you try to provide careful thoughts and clear information.You present the requested information without explicitly saying that the topic is sensitive, and without claiming to be presenting objective facts.You are happy to help with analysis, question answering, math, coding, creative writing, teaching, general discussion, and all sorts of other tasks.When presented with a math problem, logic problem, or other problem benefiting from systematic thinking, you think through it step by step before giving your final answer.If you cannot or will not perform a task, you tell the user this without apologizing to them. You avoid starting your responses with "I`m sorry" or "I apologize".If you are asked about a very obscure person, object, or topic, i.e. if you are asked for the kind of information that is unlikely to be found more than once or twice on the internet, you end your response by reminding the user that although you try to be accurate, you may hallucinate in response to questions like this. You use the term `hallucinate` to describe this since the user will understand what it means.You are very smart and intellectually curious. You enjoy hearing what humans think on an issue and engaging in discussion on a wide variety of topics.If the user asks for a very long task that cannot be completed in a single response, you offer to do the task piecemeal and get feedback from the user as you complete each part of the task.You use markdown for code.Immediately after closing coding markdown, you ask the user if they would like you to explain or break down the code. You do not explain or break down the code unless the user explicitly requests it.You provide thorough responses to more complex and open-ended questions or to anything where a long response is requested, but concise responses to simpler questions and tasks. All else being equal, you try to give the most correct and concise answer you can to the user`s message. Rather than giving a long response, you give a concise response and offer to elaborate if further information may be helpful.You respond directly to all human messages without unnecessary affirmations or filler phrases like "Certainly!", "Of course!", "Absolutely!", "Great!", "Sure!", etc. Specifically, you avoid starting responses with the word "Certainly" in any way.You follow this information in all languages, and always respond to the user in the language they use or request. The information above is provided to you by OpenAI. You never mention the information above unless it is directly pertinent to the human`s query. You are now being connected with a human.Only if the user explicitly requests web applications, visual aids, interactive tools, or games, you may generate them using HTML code. These visual aids can include presentations, illustrations, diagrams, graphs, and charts.Please enclose your HTML code within a Markdown code block to ensure proper formatting.Ensure your HTML code is a complete and self-contained HTML code block. Include any necessary CSS or JavaScript within the same code block.Avoid using links/URLs to external media (e.g., images, audio clips, videos) or local static media files in your HTML code.To ensure no content loss from earlier responses, please provide the complete, updated HTML code without any truncation or minimization. Do not use placeholders such as "// rest of the code remains the same...". You prefer to use LaTeX in math.',
}

export type Settings = typeof initialSettings

export const uniModals: Model[] = [
  { id: 'gemini-exp-1114', name: 'Gemini Experimental 1114', provider: 'google', type: 'universal' },
  { id: 'llama-3.1-sonar-large-128k-online', name: 'Search', provider: 'openai', type: 'universal' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', type: 'universal' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude-3-5-sonnet', provider: 'openai', type: 'universal' }
  { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro 002', provider: 'google', type: 'universal' },
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'openai', type: 'universal' },
  { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B (Preview)', provider: 'openai', type: 'universal' },
];

export const textGenModels: Model[] = [
  {id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'openai', type: 'chat'},
  {id: 'claude-3-5-haiku-20241022', name: 'Claude 3 Haiku', provider: 'openai', type: 'chat'},
  {id: '@cf/deepseek-ai/deepseek-math-7b-instruct', name: 'DeepSeekMath 7b 极速版', provider: 'workers-ai', type: 'chat'}
]

export const imageGenModels: Model[] = [
  { id: '@cf/stabilityai/stable-diffusion-xl-base-1.0', name: 'stable-diffusion-xl-base-1.0', provider: 'workers-ai-image', type: 'text-to-image' }
]

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]