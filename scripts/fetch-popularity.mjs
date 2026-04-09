#!/usr/bin/env node
/**
 * Fetch third-party popularity signals for every app and write data/popularity.json.
 *
 * Sources (each optional, missing → 0):
 *   - npm last-month downloads     (https://api.npmjs.org/downloads/point/last-month/{pkg})
 *   - GitHub repo stars            (https://api.github.com/repos/{owner}/{repo})
 *   - Homebrew formula installs    (https://formulae.brew.sh/api/formula/{name}.json)
 *
 * Each app yaml may declare a `popularity:` block to point us at the right
 * upstream identifiers; if missing, we infer best-effort from the cli list.
 *
 * Run: node scripts/fetch-popularity.mjs
 * CI:  GitHub Action invokes this daily and commits data/popularity.json.
 *
 * Designed to be lightweight: pure Node, no deps. Failures are non-fatal —
 * a missing signal becomes 0 and the heat formula degrades gracefully.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const APPS_DIR = join(ROOT, 'data', 'apps')
const OUT_FILE = join(ROOT, 'data', 'popularity.json')

const UA = 'doesitcli-popularity-fetcher/1.0 (+https://doesitcli.com)'

async function fetchJson(url, headers = {}) {
    try {
        const res = await fetch(url, { headers: { 'user-agent': UA, ...headers } })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

async function npmDownloads(pkg) {
    if (!pkg) return 0
    const j = await fetchJson(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`)
    return j?.downloads ?? 0
}

async function githubStars(repo) {
    if (!repo) return 0
    const j = await fetchJson(`https://api.github.com/repos/${repo}`, {
        'accept': 'application/vnd.github+json',
        ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    })
    return j?.stargazers_count ?? 0
}

async function brewInstalls(name) {
    if (!name) return 0
    // Try formula first (CLI tools live here)
    const f = await fetchJson(`https://formulae.brew.sh/api/formula/${encodeURIComponent(name)}.json`)
    const fCount = f?.analytics?.install_on_request?.['30d']?.[name] ?? 0
    if (fCount > 0) return fCount
    // Then cask (GUI apps)
    const c = await fetchJson(`https://formulae.brew.sh/api/cask/${encodeURIComponent(name)}.json`)
    return c?.analytics?.install?.['30d']?.[name] ?? 0
}

// Parse popularity targets straight from the editor's cliInstall[] commands
// plus openSourceDocsUrl. Pure regex — no yaml parser dependency.
//
// Looks at every `command:` line under `cliInstall:` and extracts npm/brew
// package names. Also reads `openSourceDocsUrl:` for the github repo.
function extractFromYaml(text) {
    const result = { npm: null, github: null, brew: null }

    // GitHub repo from openSourceDocsUrl (most reliable signal we have)
    const docsUrl = text.match(/^openSourceDocsUrl:\s*(https?:\/\/\S+)/m)
    if (docsUrl) {
        const gh = docsUrl[1].match(/github\.com\/([^/\s]+\/[^/\s]+)/)
        if (gh) result.github = gh[1].replace(/\.git$/, '')
    }

    // Restrict parsing to the cliInstall: block. Stop when we hit the next
    // top-level key (skillInstall, openSourceDocsUrl, …) so skill commands
    // don't leak in.
    const cliBlock = text.match(/^cliInstall:\n([\s\S]*?)(?=\n[a-zA-Z]|\n*$)/m)
    if (!cliBlock) return result
    const commands = [...cliBlock[1].matchAll(/^\s*-\s*command:\s*(.+)$/gm)].map((m) => m[1].trim())

    for (const raw of commands) {
        // Strip surrounding quotes if present
        const cmd = raw.replace(/^['"]|['"]$/g, '')

        // Drop common flags (-g, --global, -D, --save-dev) so the next token
        // is always the package name.
        const stripFlags = (s) => s.replace(/\s+(?:-g|--global|-D|--save-dev|-y|--yes)\b/g, ' ')

        // npm install <pkg>  |  npm i <pkg>  |  npm add <pkg>
        if (!result.npm) {
            const m = stripFlags(cmd).match(/npm (?:install|i|add)\s+(@?[\w\-./]+)/)
            if (m && !m[1].startsWith('-')) result.npm = m[1]
        }
        // bun add <pkg>
        if (!result.npm) {
            const m = stripFlags(cmd).match(/bun (?:add|install)\s+(@?[\w\-./]+)/)
            if (m && !m[1].startsWith('-')) result.npm = m[1]
        }
        // npx <pkg>
        if (!result.npm) {
            const m = cmd.match(/npx\s+(@?[\w\-./]+)/)
            if (m && !m[1].startsWith('-')) result.npm = m[1]
        }
        // brew install [--cask] [tap/repo/]<name>
        if (!result.brew) {
            const m = cmd.match(/brew install\s+(?:--cask\s+)?([\w\-./]+)/)
            if (m) result.brew = m[1].split('/').pop()
        }
    }

    return result
}

async function main() {
    const files = (await readdir(APPS_DIR)).filter((f) => f.endsWith('.yaml'))
    const out = { generatedAt: new Date().toISOString(), apps: {} }

    for (const file of files) {
        const slug = file.replace(/\.yaml$/, '')
        const text = await readFile(join(APPS_DIR, file), 'utf8')
        const upstream = extractFromYaml(text)

        process.stderr.write(`[fetch] ${slug} ← npm:${upstream.npm || '—'} github:${upstream.github || '—'} brew:${upstream.brew || '—'}\n`)
        const [npm, stars, brew] = await Promise.all([
            npmDownloads(upstream.npm),
            githubStars(upstream.github),
            brewInstalls(upstream.brew),
        ])

        out.apps[slug] = {
            npm_downloads_30d: npm,
            github_stars: stars,
            brew_installs_30d: brew,
            agent_pings_30d: 0,
            human_clicks_30d: 0,
            heat: heatScore({ npm, stars, brew }),
        }
    }

    await mkdir(dirname(OUT_FILE), { recursive: true })
    await writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n')
    process.stderr.write(`\nWrote ${OUT_FILE}\n`)
}

/**
 * Heat formula. Each signal is log-scaled then weighted.
 * Missing signals contribute 0 — we DO NOT renormalize, because doing so would
 * unfairly inflate apps with thin coverage. Instead they just rank lower until
 * we have richer data sources, which is the honest behavior.
 */
function heatScore({ stars = 0 } = {}) {
    // Public heat is driven purely by GitHub stars. One honest signal beats
    // a composite that mixes npm / brew / first-party traffic — closed-source
    // apps transparently score zero (which the Stars component hides), and
    // the rating cannot be gamed by anything we control ourselves.
    //
    // log10 curve:  100★ ≈ 20,  1k★ ≈ 30,  10k★ ≈ 40,  100k★ ≈ 50, 1M★ ≈ 60.
    // Mapped onto a 0..100 scale with a soft cap so the bar is reachable.
    if (stars <= 0) return 0
    const raw = Math.log10(stars + 1)
    return Math.round(Math.min(100, raw * 16.5))
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
