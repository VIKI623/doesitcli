import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { slugOf } from '../lib/render-md'

export const prerender = true

export const GET: APIRoute = async ({ site }) => {
    const apps = await getCollection('apps')
    const origin = site?.origin ?? 'https://doesitcli.com'
    const urls = [
        `${origin}/`,
        `${origin}/llms.txt`,
        `${origin}/llms-mini.txt`,
        `${origin}/llms-full.txt`,
        `${origin}/agent-prompt`,
        ...apps.map((a) => `${origin}/${slugOf(a)}`),
    ]
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`
    return new Response(xml, {
        headers: { 'content-type': 'application/xml; charset=utf-8' },
    })
}
