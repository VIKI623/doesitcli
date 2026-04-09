import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import { renderAppMini, approxTokens } from '../lib/render-md'

export const prerender = true

export const getStaticPaths: GetStaticPaths = async () => {
    const apps = await getCollection('apps')
    const cats = new Set<string>()
    for (const app of apps) for (const c of app.data.categories) cats.add(c)
    return [...cats].map((category) => ({ params: { category } }))
}

export const GET: APIRoute = async ({ params }) => {
    const category = params.category!
    const apps = (await getCollection('apps'))
        .filter((a) => a.data.categories.includes(category))
        .sort((a, b) => a.data.displayName.localeCompare(b.data.displayName))

    const lines = apps.map((app) => renderAppMini(app)).join('\n')
    const tokens = approxTokens(lines)
    const header = `# doesitcli · ${category} · ${apps.length} apps · ~${(tokens / 1000).toFixed(1)}k tok\n\n`

    return new Response(header + lines + '\n', {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
}
