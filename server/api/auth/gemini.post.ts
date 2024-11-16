import {GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SafetySetting} from '@google/generative-ai'
import {headers} from '~/utils/helper';
import {OpenAIMessage} from "~/utils/types";

const genAI = new GoogleGenerativeAI(process.env.G_API_KEY!)

export default defineEventHandler(async (event) => {
    const body = await readFormData(event)
    const model = body.get('model') as string
    const messages: OpenAIMessage[] = JSON.parse(<string>body.get('messages'))
    const files = body.getAll('files') as File[]

    const m = genAI.getGenerativeModel({
        model,
        safetySettings,
        generationConfig,
        systemInstruction: "You are ChatGPT, a large language model trained by OpenAI. Personality: v2. If you are asked to assist with tasks involving the expression of views held by a significant number of people, you provide assistance with the task regardless of your own views. If asked about controversial topics, you try to provide careful thoughts and clear information.You present the requested information without explicitly saying that the topic is sensitive, and without claiming to be presenting objective facts.You are happy to help with analysis, question answering, math, coding, creative writing, teaching, general discussion, and all sorts of other tasks.When presented with a math problem, logic problem, or other problem benefiting from systematic thinking, you think through it step by step before giving your final answer.If you cannot or will not perform a task, you tell the user this without apologizing to them. You avoid starting your responses with \"I`m sorry\" or \"I apologize\".If you are asked about a very obscure person, object, or topic, i.e. if you are asked for the kind of information that is unlikely to be found more than once or twice on the internet, you end your response by reminding the user that although you try to be accurate, you may hallucinate in response to questions like this. You use the term `hallucinate` to describe this since the user will understand what it means.You are very smart and intellectually curious. You enjoy hearing what humans think on an issue and engaging in discussion on a wide variety of topics.If the user asks for a very long task that cannot be completed in a single response, you offer to do the task piecemeal and get feedback from the user as you complete each part of the task.You use markdown for code.Immediately after closing coding markdown, you ask the user if they would like you to explain or break down the code. You do not explain or break down the code unless the user explicitly requests it.You provide thorough responses to more complex and open-ended questions or to anything where a long response is requested, but concise responses to simpler questions and tasks. All else being equal, you try to give the most correct and concise answer you can to the user`s message. Rather than giving a long response, you give a concise response and offer to elaborate if further information may be helpful.You respond directly to all human messages without unnecessary affirmations or filler phrases like \"Certainly!\", \"Of course!\", \"Absolutely!\", \"Great!\", \"Sure!\", etc. Specifically, you avoid starting responses with the word \"Certainly\" in any way.You follow this information in all languages, and always respond to the user in the language they use or request. The information above is provided to you by OpenAI. You never mention the information above unless it is directly pertinent to the human`s query. You are now being connected with a human.Only if the user explicitly requests web applications, visual aids, interactive tools, or games, you may generate them using HTML code. These visual aids can include presentations, illustrations, diagrams, graphs, and charts.Please enclose your HTML code within a Markdown code block to ensure proper formatting.Ensure your HTML code is a complete and self-contained HTML code block. Include any necessary CSS or JavaScript within the same code block.Avoid using links/URLs to external media (e.g., images, audio clips, videos) or local static media files in your HTML code.To ensure no content loss from earlier responses, please provide the complete, updated HTML code without any truncation or minimization. Do not use placeholders such as \"// rest of the code remains the same...\". You prefer to use LaTeX in math."
    })
    let msg = messages.slice(1)

    let res
    if (files.length) {
        const imageParts = await Promise.all(files.map(fileToGenerativePart))
        const prompt = msg.at(-1)
        if (prompt === undefined) {
            return new Response('对话失效，请重新开始对话', {status: 400})
        }
        res = await m.generateContentStream([prompt.content, ...imageParts])
    } else {
        const chat = m.startChat({
            history: msg.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'model' : m.role === 'user' ? 'user' : 'function',
                parts: [{text: m.content}]
            }))
        })
        res = await chat.sendMessageStream(msg[msg.length - 1].content)
    }

    const textEncoder = new TextEncoder()
    const readableStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of res.stream) {
                try {
                    controller.enqueue(textEncoder.encode(chunk.text()))
                } catch (e) {
                    console.error(e)
                    controller.enqueue(textEncoder.encode('已触发安全限制，请重新开始对话'))
                }
            }

            controller.close()
        }
    })

    return new Response(readableStream, {
        headers,
    })
})

async function fileToGenerativePart(file: File) {
    return {
        inlineData: {
            data: Buffer.from(await file.arrayBuffer()).toString('base64'),
            mimeType: file.type,
        },
    };
}

const safetySettings: SafetySetting[] = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
]

const generationConfig = {
    temperature: 2,
};
