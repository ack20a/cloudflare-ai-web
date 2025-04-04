export interface Model {
    id: string
    name: string
    provider: 'openai'
    type: 'chat' | 'text-to-image' | 'universal'
    endpoint?: string
}

export interface HistoryItem {
    id?: number
    session: number
    type: 'text' | 'image' | 'image-prompt' | 'error'
    content: string
    role: 'user' | 'assistant'
    src?: Blob[]
    src_url?: string[]
    created_at: number
}

export interface TabItem {
    id?: number
    label: string
    created_at: number
}

export interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant'
    content: string | Array<{
        type: 'text' | 'image_url'
        text?: string
        image_url?: {
            url: string
        }
    }>
}

export interface OpenAIBody {
    model: string
    stream: boolean
    messages: OpenAIMessage[]
}

export interface OpenAIReq {
    model: string
    endpoint: string
    messages: OpenAIMessage[]
    files?: File[]
}

export interface OpenAIRes {
    choices: {
        index: number
        delta: {
            content?: string
        }
        finish_reason: 'stop' | null
    }[]
}