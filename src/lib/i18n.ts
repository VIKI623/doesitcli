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
        zh: '存成 /cli 快捷指令',
        en: 'Save it as a /cli command',
    },
    // List / misc
    'home.highlight': { zh: '✨ Highlight', en: '✨ Highlight' },
    'home.highlight.global': { zh: '海外热门', en: 'Popular worldwide' },
    'home.highlight.china': { zh: '中国大陆常用', en: 'Popular in China' },
    'home.allApps': { zh: '全部 App', en: 'All apps' },
    'home.empty': { zh: '没找到匹配的 App，换个关键词试试', en: 'No match — try a different keyword.' },
    'app.install': { zh: '⌨️ 安装', en: '⌨️ Install' },
    'app.skills.h2': { zh: '能用它做什么', en: 'What can it do?' },
    'app.skills.count': { zh: '项能力', en: 'capabilities' },
    'app.agent.h2': { zh: '给你的 Agent', en: 'For your agent' },
    'app.agent.copy': { zh: '📋 复制给 Agent', en: '📋 Copy for agent' },
    'app.agent.copied': { zh: '✓ 已复制', en: '✓ Copied' },
    'app.raw.h2': { zh: '查看原始命令', en: 'Raw commands' },
    'app.lastSynced': { zh: '最后同步：', en: 'Last synced: ' },
    'theme.light': { zh: '☀️', en: '☀️' },
    'theme.dark': { zh: '🌙', en: '🌙' },
    'footer.tagline': {
        zh: '© {year} doesitcli.com — Desktop App CLI 目录 · Agent 友好',
        en: '© {year} doesitcli.com — Agent-friendly CLI directory for desktop apps',
    },
    'footer.basedOn': { zh: '开源项目', en: 'Open source' },
    'footer.friends': { zh: '友情链接', en: 'Friends' },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey, lang: Lang = 'zh', vars?: Record<string, string | number>): string {
    let s: string = STRINGS[key][lang]
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    return s
}
