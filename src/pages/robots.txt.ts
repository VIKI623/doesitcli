import type { APIRoute } from 'astro'

export const prerender = true

export const GET: APIRoute = ({ site }) => {
    const origin = site?.origin ?? 'https://doesitcli.com'
    const body = [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${origin}/sitemap-index.xml`,
        `# AI agents: machine-readable index at ${origin}/llms.txt`,
        `# Full corpus: ${origin}/llms-full.txt`,
        '',
    ].join('\n')
    return new Response(body, {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
}
