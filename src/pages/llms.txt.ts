import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { renderLlmsTxt, renderAppMarkdown, renderAppMini, approxTokens, slugOf } from '../lib/render-md'

export const prerender = true

export const GET: APIRoute = async ({ site }) => {
    const apps = await getCollection('apps')
    const origin = site?.origin ?? 'https://doesitcli.com'

    // Compute tier sizes so /llms.txt can advertise budgets honestly.
    const perAppFull = new Map<string, number>()
    let fullTotal = 0
    let miniTotal = 0
    for (const app of apps) {
        const md = renderAppMarkdown(app, origin)
        const t = approxTokens(md)
        perAppFull.set(slugOf(app), t)
        fullTotal += t
        miniTotal += approxTokens(renderAppMini(app))
    }

    return new Response(
        renderLlmsTxt(apps, origin, { mini: miniTotal, full: fullTotal }, perAppFull),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
    )
}
