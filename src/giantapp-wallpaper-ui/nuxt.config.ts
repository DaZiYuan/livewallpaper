// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  router: {
    options: {
      hashMode: true
    }
  },
  compatibilityDate: "2024-07-03",
  devtools: { enabled: true },
  extends: ['@nuxt/ui-pro'],
  modules: ['@nuxt/ui', '@vueuse/nuxt', '@nuxtjs/i18n'],
  future: {
    compatibilityVersion: 4
  },
  runtimeConfig: {
    public: {
      HUB_Address: process.env.HUB_Address
    }
  },
  i18n: {
    strategy: 'prefix_and_default',
    vueI18n: './i18n.config.ts',
    locales: [
      {
        code: 'zh',
        file: 'zh.json'
      },
      {
        code: 'en',
        file: 'en.json'
      },
      {
        code: 'ja',
        file: 'ja.json'
      },
      {
        code: 'ru',
        file: 'ru.json'
      },
      {
        code: 'es',
        file: 'es.json'
      },
    ],
    defaultLocale: 'zh',
    lazy: true,
    langDir: 'lang',
  },
})