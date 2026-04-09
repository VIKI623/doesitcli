import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { slugOf } from '../lib/render-md'
import { getPopularity } from '../lib/popularity'

export const prerender = true

/**
 * Static search corpus consumed by Fuse.js on the homepage.
 * Per Codex review: index install package/bin names so power users can search
 * "lark-cli" or "@larksuite/lark-cli", but do NOT index task command bodies
 * (we want humans to discover capabilities, not raw shell incantations).
 */
export const GET: APIRoute = async () => {
    const apps = await getCollection('apps')
    const docs = apps.map((app) => {
        const d = app.data
        // Extract package names from install commands for search
        const installNames = d.cliInstall.map((c) => c.command)
        const slug = slugOf(app)
        return {
            slug,
            displayName: d.displayName,
            oneLiner: d.oneLiner,
            categories: d.categories,
            tags: d.tags,
            installNames,
            intents: d.intents,
            alternativesTo: d.alternativesTo,
            heat: getPopularity(slug).heat,
        }
    })
    return new Response(JSON.stringify({ docs }), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
    })
}
