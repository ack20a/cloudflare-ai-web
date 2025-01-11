import {handleErr, openaiParser, streamResponse} from "~/utils/helper";
import {OpenAIBody, OpenAIReq} from "~/utils/types";

export default defineEventHandler(async (event) => {
    const body = await readFormData(event);
    const model = body.get('model') as string;
    const messages = JSON.parse(body.get('messages') as string);
    const key = body.get('key') as string;
    const endpoint = body.get('endpoint') as string;
    const files = body.getAll('files') as File[];

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
            Authorization: key ? `Bearer ${key}` : `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAIBody),
    });

    if (!res.ok) {
        return handleErr(res);
    }

    return streamResponse(res, openaiParser);
});
