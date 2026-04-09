// Lightweight popularity loader. Reads data/popularity.json once at build time
// (Vite will tree-shake the import). Returns an empty fallback if the file is
// missing — the build is allowed to succeed without popularity data so a fresh
// clone doesn't need to run the fetcher first.
import data from '../../data/popularity.json' with { type: 'json' }

export interface AppPopularity {
    npm_downloads_30d: number
    github_stars: number
    brew_installs_30d: number
    agent_pings_30d: number
    human_clicks_30d: number
    heat: number
}

const apps = (data as { apps: Record<string, AppPopularity> }).apps ?? {}

export function getPopularity(slug: string): AppPopularity {
    return (
        apps[slug] ?? {
            npm_downloads_30d: 0,
            github_stars: 0,
            brew_installs_30d: 0,
            agent_pings_30d: 0,
            human_clicks_30d: 0,
            heat: 0,
        }
    )
}


export function getGeneratedAt(): string {
    return (data as { generatedAt?: string }).generatedAt ?? ''
}

/**
 * Map a 0–100 heat score to a 0–5 half-star scale.
 * Why half-stars: full stars throw away too much signal at the low end where
 * most apps cluster (heat 11–25); a 0.5 step keeps the visual gradient.
 * Bands tuned so that the current corpus actually distributes across the range
 * instead of pinning everything at 1 star.
 */
export function heatToStars(heat: number): number {
    if (heat <= 0) return 0
    if (heat >= 80) return 5
    // log-ish curve: heat 10 → 1.5★, 20 → 2.5★, 40 → 3.5★, 60 → 4.5★
    const stars = Math.log10(heat + 1) * 2.6
    return Math.min(5, Math.round(stars * 2) / 2)
}
