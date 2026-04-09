import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { renderLlmsTxt, renderAppMarkdown, approxTokens, slugOf } from '../lib/render-md'

export const prerender = true

export const GET: APIRoute = async ({ site }) => {
    const apps = await getCollection('apps')
    const origin = site?.origin ?? 'https://doesitcli.com'

    const perAppFull = new Map<string, number>()
    let fullTotal = 0
    for (const app of apps) {
        const md = renderAppMarkdown(app)
        const t = approxTokens(md)
        perAppFull.set(slugOf(app), t)
        fullTotal += t
    }

    return new Response(
        renderLlmsTxt(apps, origin, { full: fullTotal }, perAppFull),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
    )
}
