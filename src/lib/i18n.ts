// Single source of truth for UI strings. Page templates use {t.key} on the
// server side (default zh) and a small inline runtime swaps text on the client
// when the user toggles to en. Content (yaml descriptions) is NOT translated —
// that lives in data files.

export type Lang = 'zh' | 'en'

export const STRINGS = {
    // Hero section
    'site.tagline': {
        zh: '每个 Desktop App，都有对应的 CLI 在这里。Agent 友好，结构化索引，开箱即用。',
        en: 'Every desktop app\'s CLI, in one place. Agent-friendly, structured, and ready to use.',
    },
    // Nav
    'nav.agent': { zh: 'Agent 接入', en: 'For Agents' },
    'nav.whyCli': { zh: '为什么需要 CLI？', en: 'Why we need CLI?' },
    'nav.github': { zh: 'GitHub', en: 'GitHub' },
    // H1 — phrased as the user's question, strongest possible hook
    'home.h1.a': { zh: '你的 App，有 ', en: 'Your app has a ' },
    'home.h1.b': { zh: 'CLI', en: 'CLI' },
    'home.h1.c': { zh: ' 吗？', en: '.' },
    'home.search.placeholder': { zh: '搜索 App、能力或场景…', en: 'Search apps, capabilities, or use cases…' },
    'home.cat.all': { zh: '全部', en: 'All' },
    // Hero installer copy
    'hero.installer.lead': {
        zh: '一行命令，让你的 Agent 掌握全目录',
        en: 'One line — your agent gets the whole directory',
    },
    'hero.installer.note': {
        zh: '一次性运行，不改任何配置。想永久使用？',
        en: 'One-shot, nothing modified. Want it permanently?',
    },
    'hero.installer.note2': {
        zh: '安装 /cli 技能',
        en: 'Install the /cli skill',
    },
    // List / misc
    'home.highlight': { zh: '✨ 精选推荐', en: '✨ Highlight' },
    'home.allApps': { zh: '全部 App', en: 'All apps' },
    'home.empty': { zh: '没找到匹配的 App，换个关键词试试', en: 'No match — try a different keyword.' },
    'app.install': { zh: '⌨️ 安装', en: '⌨️ Install' },
    'app.skills.h2': { zh: '能用它做什么', en: 'What can it do?' },
    'footer.tagline': {
        zh: '© {year} doesitcli.com — Desktop App CLI 目录 · Agent 友好',
        en: '© {year} doesitcli.com — Agent-friendly CLI directory for desktop apps',
    },
    'footer.basedOn': { zh: '开源项目', en: 'Open source' },
    'footer.friends': { zh: '友情链接', en: 'Friends' },
    'nav.addApp': { zh: '缺少某个 CLI？', en: 'Found a missing CLI?' },
    // App detail page
    'app.reportIssue': { zh: '📝 报告问题', en: '📝 Report issue' },
    'app.cli': { zh: 'CLI', en: 'CLI' },
    'app.skills': { zh: 'Skills', en: 'Skills' },
    'app.bundled': { zh: '内嵌在桌面应用中 — 从官网下载', en: 'Bundled with the desktop app — download from' },
    'app.similarTo': { zh: '类似于', en: 'Similar to' },
    'app.raw': { zh: '原始数据', en: 'Raw' },
    // Comments
    'comments.title': { zh: '评论', en: 'Comments' },
    'comments.rating': { zh: '评分', en: 'Rating' },
    'comments.placeholder': { zh: '分享你使用这个 CLI 的体验…（10–1000 字符）', en: 'Share your experience with this CLI… (10–1000 characters)' },
    'comments.chars': { zh: '字符', en: 'chars' },
    'comments.post': { zh: '发表评论', en: 'Post comment' },
    'comments.posting': { zh: '发送中…', en: 'Posting…' },
    'comments.posted': { zh: '✓ 已发表', en: '✓ Posted' },
    'comments.loading': { zh: '加载中…', en: 'Loading…' },
    'comments.loadError': { zh: '加载失败', en: 'Failed to load' },
    'comments.empty': { zh: '还没有评论，来抢沙发吧', en: 'No comments yet. Be the first.' },
    'comments.justNow': { zh: '刚刚', en: 'just now' },
    'comments.mAgo': { zh: '分钟前', en: 'm ago' },
    'comments.hAgo': { zh: '小时前', en: 'h ago' },
    'comments.dAgo': { zh: '天前', en: 'd ago' },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey, lang: Lang = 'zh', vars?: Record<string, string | number>): string {
    let s: string = STRINGS[key][lang]
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    return s
}
