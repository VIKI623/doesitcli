// doesitcli comments API — Hono on Cloudflare Workers, backed by D1.
//
// Endpoints (all under /api):
//   GET  /api/comments?slug=<slug>  → last 200 comments, newest first
//   POST /api/comments              → { slug, content, rating } from CF-Connecting-IP
//   GET  /api/health                → liveness
//
// Identity: SHA-256(HASH_SECRET + daily_salt + ip), truncated to 16 hex chars.
// Rate limit: 3 comments per user_hash per 10 minutes.
// Per-slug retention: oldest evicted after 1000 entries.

import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(
    '/api/*',
    cors({
        origin: (origin) => {
            if (!origin) return '*'
            if (origin.endsWith('doesitcli.com')) return origin
            if (origin.startsWith('http://localhost')) return origin
            return null
        },
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['content-type'],
    })
)

// ── identity / hashing ─────────────────────────────────────────────────────
function dailySalt() {
    return new Date().toISOString().slice(0, 10)
}
async function userHashFor(ip, secret) {
    const data = new TextEncoder().encode(`${secret}:${dailySalt()}:${ip}`)
    const digest = await crypto.subtle.digest('SHA-256', data)
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
    return hex.slice(0, 16)
}
function getClientIp(c) {
    return (
        c.req.header('cf-connecting-ip') ??
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
        'unknown'
    )
}

// ── content quality gate ───────────────────────────────────────────────────
const BANNED_PLACEHOLDERS = new Set([
    'test', 'testing', '测试', 'hello', 'hello world', '你好',
    '......', '...', '---', '哈哈哈哈', 'aaaaaaaaaa', '1234567890',
])
function isMeaningless(content) {
    const trimmed = content.trim()
    if (trimmed.length < 10) return 'too_short'
    if (trimmed.length > 1000) return 'too_long'
    if (BANNED_PLACEHOLDERS.has(trimmed.toLowerCase())) return 'placeholder'
    const unique = new Set([...trimmed]).size
    if (unique < 4) return 'low_entropy'
    if (!/[\p{L}\p{N}]/u.test(trimmed)) return 'no_text'
    return null
}

function isValidSlug(s) {
    return typeof s === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(s)
}

const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 3
const RETAIN_PER_SLUG = 1000

// ── routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))

app.get('/api/comments', async (c) => {
    const slug = c.req.query('slug')
    if (!isValidSlug(slug)) return c.json({ error: 'invalid slug' }, 400)
    const { results } = await c.env.DB.prepare(
        'SELECT id, user_hash, content, rating, created_at FROM comments WHERE slug = ? ORDER BY created_at DESC LIMIT 200'
    )
        .bind(slug)
        .all()
    return c.json({
        slug,
        count: results.length,
        comments: results.map((r) => ({
            id: r.id,
            user: r.user_hash,
            content: r.content,
            rating: r.rating,
            createdAt: r.created_at,
        })),
    })
})

app.post('/api/comments', async (c) => {
    const secret = c.env.HASH_SECRET
    if (!secret) return c.json({ error: 'server misconfigured' }, 500)

    let body
    try {
        body = await c.req.json()
    } catch {
        return c.json({ error: 'invalid json' }, 400)
    }
    const { slug, content, rating } = body ?? {}
    if (!isValidSlug(slug)) return c.json({ error: 'invalid slug' }, 400)
    if (typeof content !== 'string') return c.json({ error: 'content required' }, 400)
    const ratingInt = Number(rating)
    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 10) {
        return c.json({ error: 'rating must be integer 1-10' }, 400)
    }
    const why = isMeaningless(content)
    if (why) return c.json({ error: `comment rejected: ${why}` }, 400)

    const ip = getClientIp(c)
    const userHash = await userHashFor(ip, secret)

    const since = Date.now() - RATE_WINDOW_MS
    const { results: recent } = await c.env.DB.prepare(
        'SELECT COUNT(*) AS c FROM comments WHERE user_hash = ? AND created_at >= ?'
    )
        .bind(userHash, since)
        .all()
    if ((recent[0]?.c ?? 0) >= RATE_MAX) {
        return c.json({ error: 'rate limited: max 3 comments per 10 minutes' }, 429)
    }

    const now = Date.now()
    const trimmed = content.trim()
    const insertResult = await c.env.DB.prepare(
        'INSERT INTO comments (slug, user_hash, content, rating, created_at) VALUES (?, ?, ?, ?, ?)'
    )
        .bind(slug, userHash, trimmed, ratingInt, now)
        .run()
    const newId = insertResult.meta.last_row_id

    // Per-slug retention (best-effort, not transactional)
    const { results: countRows } = await c.env.DB.prepare(
        'SELECT COUNT(*) AS c FROM comments WHERE slug = ?'
    )
        .bind(slug)
        .all()
    const total = countRows[0]?.c ?? 0
    if (total > RETAIN_PER_SLUG) {
        await c.env.DB.prepare(
            `DELETE FROM comments WHERE id IN (
                SELECT id FROM comments WHERE slug = ?
                ORDER BY created_at ASC LIMIT ?
            )`
        )
            .bind(slug, total - RETAIN_PER_SLUG)
            .run()
    }

    return c.json({
        ok: true,
        id: newId,
        comment: { id: newId, user: userHash, content: trimmed, rating: ratingInt, createdAt: now },
    })
})

export default { fetch: app.fetch }
