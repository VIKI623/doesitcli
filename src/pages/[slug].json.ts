import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import { slugOf } from '../lib/render-md'

export const prerender = true

export const getStaticPaths: GetStaticPaths = async () => {
    const apps = await getCollection('apps')
    return apps.map((app) => ({ params: { slug: slugOf(app) }, props: { app } }))
}

export const GET: APIRoute = ({ props, site }) => {
    const app = props.app as Awaited<ReturnType<typeof getCollection<'apps'>>>[number]
    const origin = site?.origin ?? 'https://doesitcli.com'
    const slug = slugOf(app)
    const payload = {
        slug,
        canonical: `${origin}/${slug}`,
        markdown: `${origin}/${slug}.md`,
        ...app.data,
    }
    return new Response(JSON.stringify(payload, null, 2), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
    })
}
