import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import { renderAppMarkdown, slugOf } from '../lib/render-md'

export const prerender = true

export const getStaticPaths: GetStaticPaths = async () => {
    const apps = await getCollection('apps')
    return apps.map((app) => ({ params: { slug: slugOf(app) }, props: { app } }))
}

export const GET: APIRoute = ({ props, site }) => {
    const app = props.app as Awaited<ReturnType<typeof getCollection<'apps'>>>[number]
    const origin = site?.origin ?? 'https://doesitcli.com'
    const md = renderAppMarkdown(app, origin)
    return new Response(md, {
        headers: { 'content-type': 'text/markdown; charset=utf-8' },
    })
}
