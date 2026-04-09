// Tiny sponsor loader — read data/sponsors.yaml at build time, return at most
// one currently-active slot. Hand-curated, never auto-rotated.
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const path = join(here, '..', '..', 'data', 'sponsors.yaml')

export interface Sponsor {
    slug: string
    headline: string
    ctaLabel: string
    ctaUrl: string
    activeUntil?: string
}

// Cheap yaml-ish parser for our flat schema. We deliberately avoid pulling in
// js-yaml here so this stays a one-liner build dependency.
function parseSlots(text: string): Sponsor[] {
    const m = text.match(/^slots:\s*\n((?:\s+-[\s\S]*?)(?=^\S|\Z))/m)
    if (!m) return []
    const block = m[1]
    if (block.trim() === '[]') return []
    const slots: Sponsor[] = []
    const entries = block.split(/^\s*-\s+/m).slice(1)
    for (const e of entries) {
        const get = (k: string) => (e.match(new RegExp(`^\\s*${k}:\\s*"?([^"\\n]+)"?`, 'm')) ?? [])[1]?.trim()
        const slug = get('slug')
        if (!slug) continue
        slots.push({
            slug,
            headline: get('headline') ?? '',
            ctaLabel: get('ctaLabel') ?? 'Learn more',
            ctaUrl: get('ctaUrl') ?? '',
            activeUntil: get('activeUntil'),
        })
    }
    return slots
}

export function getActiveSponsor(): Sponsor | null {
    if (!existsSync(path)) return null
    const text = readFileSync(path, 'utf8')
    // Strip comments to keep the parser simple.
    const stripped = text
        .split('\n')
        .filter((l) => !/^\s*#/.test(l))
        .join('\n')
    const slots = parseSlots(stripped)
    if (slots.length === 0) return null
    const today = new Date().toISOString().slice(0, 10)
    const live = slots.filter((s) => !s.activeUntil || s.activeUntil >= today)
    return live[0] ?? null
}
