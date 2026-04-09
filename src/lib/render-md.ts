import type { CollectionEntry } from 'astro:content'

type App = CollectionEntry<'apps'>

export function slugOf(app: App): string {
    return app.id.replace(/\.yaml$/, '')
}

export function approxTokens(text: string): number {
    return Math.round(text.length / 4)
}

function fmtTokens(n: number): string {
    if (n >= 1000) return `~${(n / 1000).toFixed(1)}k tok`
    return `~${n} tok`
}

/** Mini rendition: category, one install line, use-cases. No commands. */
export function renderAppMini(app: App): string {
    const d = app.data
    const primaryInstall = d.cliInstall[0]
    const isOpenSource = !!(d.openSourceDocsUrl)
    const out: string[] = [
        `### ${d.displayName}`,
        `> ${d.oneLiner}`,
        `- category: \`${d.category}\` · open-source: ${isOpenSource} · cli: ${d.cliType}`,
    ]
    if (primaryInstall) out.push(`- install: \`${primaryInstall.command}\``)
    if (d.useCases.length) out.push(`- use when: ${d.useCases.slice(0, 4).join(' · ')}`)
    if (d.alternativesTo.length) out.push(`- alt to: ${d.alternativesTo.join(', ')}`)
    return out.join('\n')
}

/** Full agent-friendly Markdown for a single app. */
export function renderAppMarkdown(app: App, siteOrigin = 'https://doesitcli.com'): string {
    const d = app.data
    const slug = slugOf(app)
    const url = `${siteOrigin}/${slug}`
    const isOpenSource = !!(d.openSourceDocsUrl)

    const lines: string[] = []
    lines.push(`# ${d.displayName}`)
    lines.push('')
    lines.push(`> ${d.oneLiner}`)
    lines.push('')
    lines.push(d.description)
    lines.push('')
    lines.push(`- Homepage: ${d.homepage}`)
    lines.push(`- Category: \`${d.category}\``)
    lines.push(`- CLI type: \`${d.cliType}\``)
    lines.push(`- Open source: ${isOpenSource}`)
    lines.push(`- Status: \`${d.status}\``)
    if (d.tags.length) lines.push(`- Tags: ${d.tags.map((t) => `\`${t}\``).join(', ')}`)
    if (d.alternativesTo.length) lines.push(`- Alternatives to: ${d.alternativesTo.join(', ')}`)
    if (d.officialDocsUrl) lines.push(`- Docs: ${d.officialDocsUrl}`)
    if (d.openSourceDocsUrl) lines.push(`- Source: ${d.openSourceDocsUrl}`)
    lines.push(`- Canonical: ${url}`)
    lines.push('')

    if (d.useCases.length) {
        lines.push('## When to suggest this')
        lines.push('')
        for (const u of d.useCases) lines.push(`- ${u}`)
        lines.push('')
    }

    // Install — editor-provided commands
    if (d.cliInstall.length) {
        lines.push('## Install the CLI')
        lines.push('')
        for (const c of d.cliInstall) {
            lines.push(`\`\`\`sh`)
            lines.push(c.command)
            lines.push('```')
            if (!c.official) lines.push('> Community-maintained.')
            lines.push('')
        }
    } else if (d.cliType === 'embedded') {
        lines.push('## Install the CLI')
        lines.push('')
        lines.push(`> The CLI is bundled with the desktop app. Download from ${d.homepage}`)
        lines.push('')
    }

    if (d.skillInstall.length) {
        lines.push('## Install as an agent skill')
        lines.push('')
        for (const cmd of d.skillInstall.map((s) => s.command)) {
            lines.push('```sh')
            lines.push(cmd)
            lines.push('```')
            lines.push('')
        }
    }

    lines.push('---')
    lines.push(`Source of truth: ${url}.md · JSON: ${url}.json`)
    lines.push('')

    // Insert an agent-readable token-cost hint right after the lede so the
    // model can decide whether to ingest the page in full or in pieces.
    const body = lines.join('\n')
    const tokens = approxTokens(body)
    const lede = `> ${d.oneLiner}`
    const hint = `> _agent hint: ${fmtTokens(tokens)} · safe to read in full_`
    return body.replace(lede, `${lede}\n${hint}`)
}

/** llms.txt root index. */
export function renderLlmsTxt(
    apps: App[],
    siteOrigin = 'https://doesitcli.com',
    tierBudgets?: { mini: number; full: number },
    perApp?: Map<string, number>,
): string {
    const lines: string[] = []
    lines.push('# doesitcli.com')
    lines.push('')
    lines.push('> This file lists desktop-app CLIs, plus how to install and use them.')
    lines.push('')
    lines.push('## How to consume (progressive disclosure)')
    lines.push('')
    lines.push('1. **This file** (`/llms.txt`, ~few hundred tok) — index only.')
    if (tierBudgets) {
        lines.push(`2. **Mini corpus** (\`/llms-mini.txt\`, ${fmtTokens(tierBudgets.mini)}) — concept-level summary per app.`)
        lines.push(`3. **Full corpus** (\`/llms-full.txt\`, ${fmtTokens(tierBudgets.full)}) — every app in full.`)
    } else {
        lines.push('2. **Mini corpus** (`/llms-mini.txt`) — install line + use-cases per app.')
        lines.push('3. **Full corpus** (`/llms-full.txt`) — every app in full.')
    }
    lines.push('4. **Per-app** (`/{slug}.md`) — smallest payload to act on a single app.')
    lines.push('')

    const byCategory = new Map<string, App[]>()
    for (const app of apps) {
        const cat = app.data.category
        if (!byCategory.has(cat)) byCategory.set(cat, [])
        byCategory.get(cat)!.push(app)
    }

    for (const cat of [...byCategory.keys()].sort()) {
        lines.push(`## ${cat}`)
        lines.push('')
        for (const app of byCategory.get(cat)!.sort((a, b) => a.data.displayName.localeCompare(b.data.displayName))) {
            const slug = slugOf(app)
            const tok = perApp?.get(slug)
            const tokLabel = tok ? ` (${fmtTokens(tok)})` : ''
            lines.push(`- [${app.data.displayName}](${siteOrigin}/${slug}.md)${tokLabel}: ${app.data.oneLiner}`)
        }
        lines.push('')
    }

    lines.push('## Optional')
    lines.push('')
    lines.push(`- [Full corpus](${siteOrigin}/llms-full.txt)`)
    lines.push(`- [Search index](${siteOrigin}/search-index.json)`)
    lines.push('')

    return lines.join('\n')
}
