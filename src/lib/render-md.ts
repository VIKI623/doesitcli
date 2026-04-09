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

/** Mini rendition: name, oneLiner, install, detail path. Enough to pick and act. */
export function renderAppMini(app: App): string {
    const d = app.data
    const slug = slugOf(app)
    const primaryInstall = d.cliInstall[0]
    const out: string[] = [
        `- **${d.displayName}** → /${slug}.md: ${d.oneLiner}`,
    ]
    if (primaryInstall) out.push(`  install: \`${primaryInstall.command}\``)
    if (d.alternativesTo.length) out.push(`  alt: ${d.alternativesTo.join(', ')}`)
    return out.join('\n')
}

/** Full agent-friendly Markdown for a single app. */
export function renderAppMarkdown(app: App): string {
    const d = app.data
    const slug = slugOf(app)
    const url = `/${slug}`
    const isOpenSource = !!(d.openSourceDocsUrl)

    const lines: string[] = []
    lines.push(`# ${d.displayName}`)
    lines.push('')
    lines.push(`> ${d.oneLiner}`)
    lines.push('')
    lines.push(d.description)
    lines.push('')
    lines.push(`- Homepage: ${d.homepage}`)
    lines.push(`- Categories: ${d.categories.map(c => `\`${c}\``).join(', ')}`)
    lines.push(`- CLI type: \`${d.cliType}\``)
    lines.push(`- Open source: ${isOpenSource}`)
    lines.push(`- Status: \`${d.status}\``)
    if (d.tags.length) lines.push(`- Tags: ${d.tags.map((t) => `\`${t}\``).join(', ')}`)
    if (d.alternativesTo.length) lines.push(`- Alternatives to: ${d.alternativesTo.join(', ')}`)
    if (d.officialDocsUrl) lines.push(`- Docs: ${d.officialDocsUrl}`)
    if (d.openSourceDocsUrl) lines.push(`- Source: ${d.openSourceDocsUrl}`)
    lines.push(`- Canonical: ${url}`)
    lines.push('')

    if (d.intents.length) {
        lines.push('## When to suggest this')
        lines.push('')
        for (const u of d.intents) lines.push(`- ${u}`)
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
    tierBudgets?: { full: number },
    perApp?: Map<string, number>,
): string {
    const lines: string[] = []
    lines.push('# doesitcli.com')
    lines.push('')
    lines.push(`> Base URL: ${siteOrigin} — all paths below are relative to it.`)
    lines.push('')
    lines.push('## Progressive disclosure')
    lines.push('')
    lines.push('1. **This file** (`/llms.txt`) — index by category, one line per app.')
    lines.push('2. **By category** (`/llms-{category}.txt`) — one category with install commands.')
    if (tierBudgets) {
        lines.push(`3. **Full corpus** (\`/llms-full.txt\`, ${fmtTokens(tierBudgets.full)}) — every app in full.`)
    } else {
        lines.push('3. **Full corpus** (`/llms-full.txt`) — every app in full.')
    }
    lines.push('4. **Single app** (`/{slug}.md`) — one app, full detail.')
    lines.push('')

    const byCategory = new Map<string, App[]>()
    for (const app of apps) {
        const cat = app.data.categories[0] ?? 'uncategorized'
        if (!byCategory.has(cat)) byCategory.set(cat, [])
        byCategory.get(cat)!.push(app)
    }

    for (const cat of [...byCategory.keys()].sort()) {
        lines.push(`## ${cat} → /llms-${cat}.txt`)
        lines.push('')
        for (const app of byCategory.get(cat)!.sort((a, b) => a.data.displayName.localeCompare(b.data.displayName))) {
            const slug = slugOf(app)
            const tok = perApp?.get(slug)
            const tokLabel = tok ? ` (${fmtTokens(tok)})` : ''
            lines.push(`- [${app.data.displayName}](/${slug}.md)${tokLabel}: ${app.data.oneLiner}`)
        }
        lines.push('')
    }

    lines.push('## Optional')
    lines.push('')
    lines.push('- [Full corpus](/llms-full.txt)')
    lines.push('- [Search index](/search-index.json)')
    lines.push('')

    return lines.join('\n')
}
