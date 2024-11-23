import {handleErr, openaiParser, streamResponse} from "~/utils/helper";
import {OpenAIBody, OpenAIReq, OpenAIMessage} from "~/utils/types";

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event)
    if (!formData) throw new Error('No form data')
    
    const model = formData.find(i => i.name === 'model')?.data.toString() || ''
    const messages = JSON.parse(formData.find(i => i.name === 'messages')?.data.toString() || '[]')
    const files = formData.filter(i => i.name === 'files')
    const endpoint = formData.find(i => i.name === 'endpoint')?.data.toString() || ''
    const key = formData.find(i => i.name === 'key')?.data.toString()

    // 处理消息中的图片
    const processedMessages = await Promise.all(messages.map(async (msg: OpenAIMessage) => {
        if (msg.role === 'user' && files.length > 0) {
            const contents: any[] = [{
                type: 'text',
                text: msg.content
            }]
            
            for (const file of files) {
                const base64 = Buffer.from(file.data).toString('base64')
                contents.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${file.type};base64,${base64}`
                    }
                })
            }
            
            return {
                role: msg.role,
                content: contents
            }
        }
        return msg
    }))

    const openAIBody: OpenAIBody = {
        stream: true,
        model,
        messages: processedMessages,
    };

    const apiUrl = process.env.OPENAI_API_URL ?
        `${process.env.OPENAI_API_URL}/v1/chat/completions` :
        `${process.env.CF_GATEWAY}/openai/${endpoint}`;

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Authorization: key === undefined ? `Bearer ${process.env.OPENAI_API_KEY}` : `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAIBody),
    });

    if (!res.ok) {
        return handleErr(res);
    }

    return streamResponse(res, openaiParser);
});
