// doesitcli comments API — Hono on Node, backed by SQLite.
//
// Endpoints (all under /api):
//   GET  /comments?slug=<slug>     → last 200 comments, oldest→newest? newest first
//   POST /comments                 → { slug, content, rating } from CF-Connecting-IP
//
// Identity is anonymous: SHA-256 of (HASH_SECRET + daily_salt + ip), truncated to
// 16 hex chars. The daily salt rotates the hash every UTC day so we can't track
// users across days. The HASH_SECRET (server-only) prevents rainbow-table attacks.
//
// Rate limit: 3 comments per user_hash per 10 minutes.
// Per-app retention: oldest comments evicted after 1000 entries.
// Display: newest 200 returned to clients.

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'

// ── env loading ─────────────────────────────────────────────────────────────
function loadEnv(path) {
    if (!existsSync(path)) return
    for (const line of readFileSync(path, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
        if (m) process.env[m[1]] ??= m[2]
    }
}
loadEnv('/home/www/doesitcli/.env')
loadEnv('.env')

const PORT = Number(process.env.PORT ?? 3000)
const DB_PATH = process.env.DB_PATH ?? './comments.db'
const HASH_SECRET = process.env.HASH_SECRET
if (!HASH_SECRET) {
    console.error('FATAL: HASH_SECRET not set')
    process.exit(1)
}

// ── db setup ────────────────────────────────────────────────────────────────
// node:sqlite is built into Node 22+. No native build step required.
const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA synchronous = NORMAL')
db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        user_hash TEXT NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER NOT NULL,
        created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_slug_time ON comments(slug, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_time ON comments(user_hash, created_at);
`)

const stmts = {
    insert: db.prepare(
        'INSERT INTO comments (slug, user_hash, content, rating, created_at) VALUES (?, ?, ?, ?, ?)'
    ),
    listBySlug: db.prepare(
        'SELECT id, user_hash, content, rating, created_at FROM comments WHERE slug = ? ORDER BY created_at DESC LIMIT 200'
    ),
    countRecentByUser: db.prepare(
        'SELECT COUNT(*) AS c FROM comments WHERE user_hash = ? AND created_at >= ?'
    ),
    countBySlug: db.prepare('SELECT COUNT(*) AS c FROM comments WHERE slug = ?'),
    pruneOldest: db.prepare(`
        DELETE FROM comments
        WHERE id IN (
            SELECT id FROM comments WHERE slug = ?
            ORDER BY created_at ASC
            LIMIT ?
        )
    `),
}

// ── identity / hashing ─────────────────────────────────────────────────────
function dailySalt() {
    return new Date().toISOString().slice(0, 10)
}
function userHashFor(ip) {
    const h = createHash('sha256').update(`${HASH_SECRET}:${dailySalt()}:${ip}`).digest('hex')
    return h.slice(0, 16)
}
function getClientIp(c) {
    // Trust CF-Connecting-IP first (set by Cloudflare), then X-Forwarded-For,
    // then the socket. nginx must populate $http_cf_connecting_ip.
    return (
        c.req.header('cf-connecting-ip') ??
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
        c.env?.incoming?.socket?.remoteAddress ??
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
    // Unique codepoint count (works for both Latin and CJK)
    const unique = new Set([...trimmed]).size
    if (unique < 4) return 'low_entropy'
    // All whitespace / punctuation only
    if (!/[\p{L}\p{N}]/u.test(trimmed)) return 'no_text'
    return null
}

// ── rate limit ─────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 3
function rateExceeded(userHash) {
    const since = Date.now() - RATE_WINDOW_MS
    const { c } = stmts.countRecentByUser.get(userHash, since)
    return c >= RATE_MAX
}

// ── per-app retention ──────────────────────────────────────────────────────
const RETAIN_PER_SLUG = 1000
function pruneIfNeeded(slug) {
    const { c } = stmts.countBySlug.get(slug)
    if (c > RETAIN_PER_SLUG) {
        stmts.pruneOldest.run(slug, c - RETAIN_PER_SLUG)
    }
}

// ── slug allowlist (only existing apps) ────────────────────────────────────
// We don't validate against the live yaml directory at runtime — too brittle.
// Instead: any slug that looks like a kebab-case identifier is allowed.
// If a comment is left for a slug that doesn't exist on the site, it's harmless;
// it simply won't be displayed.
function isValidSlug(s) {
    return typeof s === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(s)
}

// ── app ────────────────────────────────────────────────────────────────────
const app = new Hono()

// Same-origin in production; allow localhost during dev.
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

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))

app.get('/api/comments', (c) => {
    const slug = c.req.query('slug')
    if (!isValidSlug(slug)) return c.json({ error: 'invalid slug' }, 400)
    const rows = stmts.listBySlug.all(slug)
    return c.json({
        slug,
        count: rows.length,
        comments: rows.map((r) => ({
            id: r.id,
            user: r.user_hash, // safe to expose: not reversible to IP without secret
            content: r.content,
            rating: r.rating, // 1-10 (display as 0.5-5 stars)
            createdAt: r.created_at,
        })),
    })
})

app.post('/api/comments', async (c) => {
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
    const userHash = userHashFor(ip)
    if (rateExceeded(userHash)) {
        return c.json({ error: 'rate limited: max 3 comments per 10 minutes' }, 429)
    }

    const now = Date.now()
    const result = stmts.insert.run(slug, userHash, content.trim(), ratingInt, now)
    pruneIfNeeded(slug)

    return c.json({
        ok: true,
        id: result.lastInsertRowid,
        comment: { id: result.lastInsertRowid, user: userHash, content: content.trim(), rating: ratingInt, createdAt: now },
    })
})

// ── start ──────────────────────────────────────────────────────────────────
serve({ fetch: app.fetch, port: PORT, hostname: '127.0.0.1' }, (info) => {
    console.log(`[doesitcli-api] listening on ${info.address}:${info.port}`)
    console.log(`[doesitcli-api] db: ${DB_PATH}`)
})
