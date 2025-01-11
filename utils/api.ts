import {streamFetchWithFile} from "~/utils/helper";

export function openAIReq(req: OpenAIReq, onStream: (data: unknown) => void) {
    const form = new FormData();
    form.append('model', req.model);
    form.append('messages', JSON.stringify(req.messages));
    if (req.key) form.append('key', req.key);
    if (req.endpoint) form.append('endpoint', req.endpoint);
    if (req.files) {
        req.files.forEach(file => form.append('files', file));
    }
    
    return streamFetchWithFile('/openai', form, onStream);
}

export function workersReq(req: WorkersReq, onStream: (data: unknown) => void) {
    return streamFetch('/workers', req, onStream)
}

export function workersImageReq(req: WorkersReqImage) {
    return postFetch('/workers/image', req)
}

export function geminiReq(req: FormData, onStream: (data: unknown) => void) {
    return streamFetchWithFile('/gemini', req, onStream)
}