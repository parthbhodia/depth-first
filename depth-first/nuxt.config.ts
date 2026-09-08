import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  css: ['~/assets/css/base.css', '~/assets/css/site.css'],

  alias: {
    '#engine': fileURLToPath(new URL('./shared/engine', import.meta.url)),
    '#content': fileURLToPath(new URL('./content', import.meta.url)),
  },

  runtimeConfig: {
    public: {
      // Canonicals, sitemap and OG tags all read this.
      //   1. NUXT_PUBLIC_SITE_URL wins — set it once you have a real domain.
      //   2. On Vercel, fall back to the project's own production URL so a
      //      fresh deploy is self-consistent without any configuration.
      //   3. Otherwise the placeholder, which only matters locally.
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : 'https://depthfirst.dev'),
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#27488A', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0D1219', media: '(prefers-color-scheme: dark)' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=JetBrains+Mono:wght@400;500;700&family=Newsreader:opsz,wght@6..72,400..600&display=swap',
        },
      ],
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/sitemap.xml', '/robots.txt'],
      failOnError: false,
    },
  },
})
