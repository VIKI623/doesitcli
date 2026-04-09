import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { renderAppMini, approxTokens } from '../lib/render-md'

export const prerender = true

/**
 * Mini corpus tier — concept-level summary of every app.
 * No commands, no agent prompts. For agents that want to choose
 * before paying for the full corpus.
 */
export const GET: APIRoute = async ({ site }) => {
    const apps = (await getCollection('apps')).sort((a, b) =>
        a.data.displayName.localeCompare(b.data.displayName),
    )
    const origin = site?.origin ?? 'https://doesitcli.com'

    const byCat = new Map<string, typeof apps>()
    for (const app of apps) {
        const c = app.data.category
        if (!byCat.has(c)) byCat.set(c, [])
        byCat.get(c)!.push(app)
    }

    const sections: string[] = []
    for (const cat of [...byCat.keys()].sort()) {
        sections.push(`## ${cat}`)
        sections.push('')
        for (const app of byCat.get(cat)!) {
            sections.push(renderAppMini(app))
            sections.push(`> Full: ${origin}/${app.id.replace(/\.yaml$/, '')}.md`)
            sections.push('')
        }
    }

    const sectionsText = sections.join('\n')
    const tokens = approxTokens(sectionsText)
    const header = [
        '# doesitcli.com — mini corpus',
        '',
        '> Concept-level summary of every app: install line + skill labels.',
        '> No commands, no agent prompts. Use `/llms-full.txt` or `/{slug}.md` for the full payload.',
        '',
        `<!-- agent hint: this corpus is ~${(tokens / 1000).toFixed(1)}k tokens · ${apps.length} apps · generated ${new Date().toISOString()} -->`,
        '',
        '---',
        '',
    ].join('\n')

    return new Response(header + sectionsText, {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
}
