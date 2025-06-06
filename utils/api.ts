import {streamFetchWithFile} from "./helper";
import {OpenAIReq} from "./types";

export function openAIReq(req: OpenAIReq, onStream: (data: unknown) => void) {
    const form = new FormData();
    form.append('model', req.model);
    form.append('messages', JSON.stringify(req.messages));
    if (req.endpoint) form.append('endpoint', req.endpoint);
    if (req.files) {
        req.files.forEach(file => form.append('files', file));
    }
    
    return streamFetchWithFile('/openai', form, onStream);
} 