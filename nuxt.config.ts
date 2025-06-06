// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
    devtools: {enabled: false},
    modules: ['@nuxt/ui', '@nuxtjs/i18n'],
    css: ['~/assets/css/style.css'],
    devServer: {
        port: 3001,
    },
    routeRules: {
        '/': {
            prerender: true,
        }
    },
    app: {
        head: {
            title: '永康 AI Web',
            meta: [
                {
                    name: 'keywords',
                    content: '永康 AI Web, AI, OpenAI, ChatGPT'
                },
                {
                    name: 'description',
                    content: 'Integrated web platform supporting OpenAI/ChatGPT'
                }
            ],
            link: [
                {
                    rel: 'manifest',
                    href: '/manifest.json'
                }
            ]
        }
    },
    i18n: {
        vueI18n: './i18n.config.ts',
        strategy: 'no_prefix',
        defaultLocale: 'zh',
    },
    nitro: {
        vercel: {
            regions: ["sin1", "syd1", "sfo1", "iad1", "pdx1", "cle1"]
        }
    }
})
