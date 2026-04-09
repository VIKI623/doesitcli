import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

export const APP_CATEGORIES = [
    'coding',
    'devops',
    'infra',
    'productivity',
    'collaboration',
    'design',
    'content',
    'other',
] as const

// An install command as provided by the editor.
const cliInstallEntry = z.object({
    command: z.string(),
    official: z.boolean().default(true),
})

// ---------------------------------------------------------------------------
// No bot block — all fields are editor-owned (human-curated).
// Auto-derived signals (isOpenSource, parsedInstalls, sourceUrl) are computed
// at build time from the editor fields; they are NOT stored in yaml.
// ---------------------------------------------------------------------------
const apps = defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './data/apps' }),
    schema: z.object({
        // ── Identity ──────────────────────────────────────────────────────────
        displayName: z.string(),
        homepage: z.string().url(),
        // standalone = CLI has its own installable package (npm/brew/etc)
        // embedded   = CLI ships inside the desktop app (cliInstall may be empty)
        cliType: z.enum(['standalone', 'embedded']),
        // global = popular outside China; china = popular in mainland China
        // Drives the two-row "Highlight" section on the homepage.
        region: z.enum(['global', 'china']).default('global'),
        // ── Install commands ──────────────────────────────────────────────────
        cliInstall: z.array(cliInstallEntry).default([]),
        skillInstall: z.array(cliInstallEntry).default([]),
        // ── Source & docs ─────────────────────────────────────────────────────
        // Non-null → isOpenSource = true; used to derive sourceUrl.
        openSourceDocsUrl: z.string().url().nullable().default(null),
        // Official product docs page (separate from the source repo).
        officialDocsUrl: z.string().url().nullable().default(null),
        // ── Human-written descriptions ────────────────────────────────────────
        category: z.enum(APP_CATEGORIES),
        tags: z.array(z.string()).default([]),
        oneLiner: z.string().max(140),
        description: z.string(),
        useCases: z.array(z.string()).default([]),
        alternativesTo: z.array(z.string()).default([]),
        // ── Editorial controls ────────────────────────────────────────────────
        status: z.enum(['active', 'beta', 'deprecated']).default('active'),
        // Manual boost (0-100) used *only* to order the Highlight section.
        // Higher = more prominent. When unset, the public heat score is used
        // as the fallback. This is our editorial lever — set it when we want
        // to feature a closed-source app that has no GitHub signal, or when
        // we want to override the star ranking for curation reasons.
        highlight: z.number().min(0).max(100).optional(),
    }),
})

export const collections = { apps }
