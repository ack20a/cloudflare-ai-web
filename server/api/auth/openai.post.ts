import {handleErr, openaiParser, streamResponse} from "~/utils/helper";
import {OpenAIBody, OpenAIReq} from "~/utils/types";

// 定义固定的系统提示词
const SYSTEM_PROMPT = "You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture. Personality: v2. Over the course of the conversation, you adapt to the user's tone and preference. Try to match the user's vibe, tone, and generally how they are speaking. You want the conversation to feel natural. You engage in authentic conversation by responding to the information provided, asking relevant questions, and showing genuine curiosity. If natural, continue the conversation with casual conversation. Respond in Chinese.";

export default defineEventHandler(async (event) => {
    const body = await readFormData(event);
    const model = body.get('model') as string;
    let messages = JSON.parse(body.get('messages') as string);
    const endpoint = body.get('endpoint') as string;
    const files = body.getAll('files') as File[];
    
    // 确保始终使用服务器端的系统提示词
    // 检查是否已经有系统提示词，如果有则替换，如果没有则添加
    let hasSystemPrompt = false;
    messages = messages.map(msg => {
        if (msg.role === 'system') {
            hasSystemPrompt = true;
            return {
                role: 'system',
                content: SYSTEM_PROMPT
            };
        }
        return msg;
    });
    
    // 如果没有系统提示词，则添加
    if (!hasSystemPrompt) {
        messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            },
            ...messages
        ];
    }

    const openAIBody: OpenAIBody = {
        stream: true,
        model,
        messages,
    };

    // Handle image attachments if present
    if (files.length > 0) {
        openAIBody.messages = await Promise.all(messages.map(async (msg) => {
            if (msg.role === 'user') {
                const content = [];
                content.push({ type: 'text', text: msg.content });
                
                for (const file of files) {
                    const base64Data = Buffer.from(await file.arrayBuffer()).toString('base64');
                    content.push({
                        type: 'image_url',
                        image_url: {
                            url: `data:${file.type};base64,${base64Data}`
                        }
                    });
                }
                
                return {
                    role: msg.role,
                    content
                };
            }
            return msg;
        }));
    }

    const apiUrl = process.env.OPENAI_API_URL ?
        `${process.env.OPENAI_API_URL}/v1/chat/completions` :
        `${process.env.CF_GATEWAY}/openai/${endpoint}`;

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAIBody),
    });

    if (!res.ok) {
        return handleErr(res);
    }

    return streamResponse(res, openaiParser);
});
