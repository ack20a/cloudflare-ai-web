import {createGlobalState} from "@vueuse/shared"
import {ref} from "vue"
import {uniModals} from "./db"

export const useGlobalState = createGlobalState(() => {
    const openModelSelect = ref(false)
    const passModal = ref(false)
    const openAside = ref(false)
    const selectedModel = ref(uniModals[0])
    const openSystemPrompt = ref(false)

    return {
        openModelSelect,
        passModal,
        openAside,
        selectedModel,
        openSystemPrompt
    }
})