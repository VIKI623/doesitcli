import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import tailwind from '@astrojs/tailwind'

// https://astro.build/config
export default defineConfig({
    output: 'static',
    publicDir: './static',
    site: 'https://doesitcli.com/',
    integrations: [
        vue(),
        tailwind(),
    ],
})
