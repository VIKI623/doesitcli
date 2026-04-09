<script setup>
// Comments island for app detail pages.
// Hydrates lazily (client:visible) so it doesn't hurt first paint.
//
// Props: { slug: string }
//
// API contract:
//   GET  /api/comments?slug=<slug>      → { count, comments: [...] }
//   POST /api/comments {slug, content, rating}  → { ok, comment }
//
// rating is 1-10 (= 0.5-5 stars). Display uses half-star SVG.

import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({ slug: { type: String, required: true } })

// --- i18n ---
const T = {
    'comments.title':       { en: 'Comments',       zh: '评论' },
    'comments.rating':      { en: 'Rating',          zh: '评分' },
    'comments.placeholder': { en: 'Share your experience with this CLI… (10–1000 characters)', zh: '分享你使用这个 CLI 的体验…（10–1000 字符）' },
    'comments.chars':       { en: 'chars',           zh: '字符' },
    'comments.post':        { en: 'Post comment',    zh: '发表评论' },
    'comments.posting':     { en: 'Posting…',        zh: '发送中…' },
    'comments.posted':      { en: '✓ Posted',        zh: '✓ 已发表' },
    'comments.loading':     { en: 'Loading…',        zh: '加载中…' },
    'comments.loadError':   { en: 'Failed to load',  zh: '加载失败' },
    'comments.empty':       { en: 'No comments yet. Be the first.', zh: '还没有评论，来抢沙发吧' },
    'comments.justNow':     { en: 'just now',        zh: '刚刚' },
    'comments.mAgo':        { en: 'm ago',           zh: '分钟前' },
    'comments.hAgo':        { en: 'h ago',           zh: '小时前' },
    'comments.dAgo':        { en: 'd ago',           zh: '天前' },
}

const lang = ref('en')
let observer
onMounted(() => {
    lang.value = document.documentElement.lang || 'en'
    observer = new MutationObserver(() => { lang.value = document.documentElement.lang || 'en' })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
})
onUnmounted(() => observer?.disconnect())

function t(key) { return T[key]?.[lang.value] ?? T[key]?.en ?? key }

const comments = ref([])
const loading = ref(true)
const error = ref(null)

// Form state
const draft = ref('')
const draftRating = ref(0) // 1-10, 0 = not selected
const hoverRating = ref(0)
const submitting = ref(false)
const submitError = ref(null)
const submitSuccess = ref(false)

const charCount = computed(() => draft.value.trim().length)
const canSubmit = computed(
    () => !submitting.value && draftRating.value > 0 && charCount.value >= 10 && charCount.value <= 1000,
)

async function load() {
    loading.value = true
    error.value = null
    try {
        const res = await fetch(`/api/comments?slug=${encodeURIComponent(props.slug)}`)
        if (!res.ok) throw new Error(`http ${res.status}`)
        const data = await res.json()
        comments.value = data.comments ?? []
    } catch (e) {
        error.value = e.message
    } finally {
        loading.value = false
    }
}

async function submit() {
    if (!canSubmit.value) return
    submitting.value = true
    submitError.value = null
    submitSuccess.value = false
    try {
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                slug: props.slug,
                content: draft.value.trim(),
                rating: draftRating.value,
            }),
        })
        const data = await res.json()
        if (!res.ok) {
            submitError.value = data.error ?? `http ${res.status}`
            return
        }
        comments.value = [data.comment, ...comments.value]
        draft.value = ''
        draftRating.value = 0
        submitSuccess.value = true
        setTimeout(() => (submitSuccess.value = false), 2000)
    } catch (e) {
        submitError.value = e.message
    } finally {
        submitting.value = false
    }
}

function starFraction(starIndex, rating) {
    const v = rating - (starIndex - 1) * 2
    if (v >= 2) return 1
    if (v >= 1) return 0.5
    return 0
}
function pickRating(starIndex, isLeftHalf) {
    draftRating.value = (starIndex - 1) * 2 + (isLeftHalf ? 1 : 2)
}
function previewRating(starIndex, isLeftHalf) {
    hoverRating.value = (starIndex - 1) * 2 + (isLeftHalf ? 1 : 2)
}
function clearPreview() {
    hoverRating.value = 0
}
function relativeTime(ts) {
    const diff = (Date.now() - ts) / 1000
    if (diff < 60) return t('comments.justNow')
    if (diff < 3600) return `${Math.floor(diff / 60)}${t('comments.mAgo')}`
    if (diff < 86400) return `${Math.floor(diff / 3600)}${t('comments.hAgo')}`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}${t('comments.dAgo')}`
    return new Date(ts).toLocaleDateString()
}

onMounted(load)
</script>

<template>
    <section class="comments mt-12 pt-8 border-t border-white/10">
        <h2 class="text-xl font-semibold text-white mb-4">{{ t('comments.title') }}</h2>

        <!-- Submit form -->
        <form @submit.prevent="submit" class="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div class="flex items-center gap-3">
                <span class="text-sm text-gray-400">{{ t('comments.rating') }}:</span>
                <div class="flex" @mouseleave="clearPreview">
                    <template v-for="i in 5" :key="i">
                        <div class="relative cursor-pointer" :style="{ width: '24px', height: '24px' }">
                            <div
                                class="absolute inset-0 w-1/2 z-10"
                                @mouseover="previewRating(i, true)"
                                @click="pickRating(i, true)"
                            ></div>
                            <div
                                class="absolute inset-0 left-1/2 w-1/2 z-10"
                                @mouseover="previewRating(i, false)"
                                @click="pickRating(i, false)"
                            ></div>
                            <svg viewBox="0 0 24 24" class="w-6 h-6 text-accent">
                                <defs>
                                    <linearGradient :id="`star-${i}-${slug}`">
                                        <stop
                                            :offset="`${starFraction(i, hoverRating || draftRating) * 100}%`"
                                            stop-color="currentColor"
                                        />
                                        <stop
                                            :offset="`${starFraction(i, hoverRating || draftRating) * 100}%`"
                                            stop-color="currentColor"
                                            stop-opacity="0.18"
                                        />
                                    </linearGradient>
                                </defs>
                                <path
                                    :fill="`url(#star-${i}-${slug})`"
                                    d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                                />
                            </svg>
                        </div>
                    </template>
                </div>
                <span v-if="draftRating > 0" class="text-xs text-gray-500">{{ (draftRating / 2).toFixed(1) }} / 5</span>
            </div>
            <textarea
                v-model="draft"
                rows="3"
                maxlength="1000"
                :placeholder="t('comments.placeholder')"
                class="w-full px-3 py-2 rounded-lg bg-darker border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-accent resize-y"
            ></textarea>
            <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500">{{ charCount }} / 1000 {{ t('comments.chars') }}</span>
                <button
                    type="submit"
                    :disabled="!canSubmit"
                    class="px-4 py-1.5 rounded-full bg-accent text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {{ submitting ? t('comments.posting') : submitSuccess ? t('comments.posted') : t('comments.post') }}
                </button>
            </div>
            <p v-if="submitError" class="text-xs text-red-400">{{ submitError }}</p>
        </form>

        <!-- List -->
        <div v-if="loading" class="text-sm text-gray-500">{{ t('comments.loading') }}</div>
        <div v-else-if="error" class="text-sm text-red-400">{{ t('comments.loadError') }}: {{ error }}</div>
        <div v-else-if="comments.length === 0" class="text-sm text-gray-500">{{ t('comments.empty') }}</div>
        <ul v-else class="space-y-4">
            <li v-for="c in comments" :key="c.id" class="p-3 rounded-lg bg-white/5 border border-white/10">
                <div class="flex items-center justify-between mb-1.5 text-xs text-gray-500">
                    <span class="flex items-center gap-2">
                        <span class="font-mono text-gray-400">{{ c.user.slice(0, 6) }}</span>
                        <span class="inline-flex">
                            <svg
                                v-for="i in 5"
                                :key="i"
                                viewBox="0 0 24 24"
                                class="w-3 h-3 text-accent"
                            >
                                <defs>
                                    <linearGradient :id="`v-${c.id}-${i}`">
                                        <stop :offset="`${starFraction(i, c.rating) * 100}%`" stop-color="currentColor" />
                                        <stop :offset="`${starFraction(i, c.rating) * 100}%`" stop-color="currentColor" stop-opacity="0.18" />
                                    </linearGradient>
                                </defs>
                                <path :fill="`url(#v-${c.id}-${i})`" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                        </span>
                    </span>
                    <span>{{ relativeTime(c.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-200 whitespace-pre-wrap">{{ c.content }}</p>
            </li>
        </ul>
    </section>
</template>
