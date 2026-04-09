import type { APIRoute } from 'astro'

export const prerender = true

export const GET: APIRoute = ({ site }) => {
    const origin = site?.origin ?? 'https://doesitcli.com'
    const body = [
        '# Crawlers',
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${origin}/sitemap.xml`,
        '',
        '# LLM / AI agents',
        '# See https://llmstxt.org for the llms.txt specification.',
        `# Index:        ${origin}/llms.txt`,
        `# By category:  ${origin}/llms-{category}.txt  (e.g. /llms-coding.txt)`,
        `# Full corpus:  ${origin}/llms-full.txt`,
        `# Single app:   ${origin}/{slug}.md`,
        `# Agent prompt: ${origin}/agent-prompt`,
        `# Install skill: curl -fsSL ${origin}/install | sh`,
        '',
    ].join('\n')
    return new Response(body, {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
}
