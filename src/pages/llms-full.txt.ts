import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { renderAppMarkdown, approxTokens } from '../lib/render-md'

export const prerender = true

// Codex review note: cap at ~50k tokens (~200KB) and switch to category shards.
// At <12 apps this is fine; we'll add /llms-{category}.txt when we approach the cap.
export const GET: APIRoute = async ({ site }) => {
    const apps = (await getCollection('apps')).sort((a, b) =>
        a.data.displayName.localeCompare(b.data.displayName),
    )
    const origin = site?.origin ?? 'https://doesitcli.com'

    const body = apps.map((app) => renderAppMarkdown(app, origin)).join('\n\n---\n\n')
    const tokens = approxTokens(body)

    const header = [
        '# doesitcli.com — full corpus',
        '',
        '> All apps concatenated as one Markdown file. Designed for one-shot agent ingestion.',
        '',
        `<!-- agent hint: this corpus is ~${(tokens / 1000).toFixed(1)}k tokens · ${apps.length} apps · generated ${new Date().toISOString()} -->`,
        '',
        '---',
        '',
    ].join('\n')

    return new Response(header + body, {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
}
