# Contributing

**English** | [中文](CONTRIBUTING.zh-CN.md)

doesitcli is a curated CLI directory for desktop apps. One PR adds one app.
Both **human contributors** and **AI agents** are welcome — the rules below
are short on purpose.

## TL;DR

1. Copy [`data/apps/_template.yaml`](data/apps/_template.yaml) → `data/apps/<slug>.yaml` (kebab-case slug, e.g. `obsidian.yaml`).
2. Fill the schema below. **Every field is human-curated.** No bots, no scrapers.
3. Open a PR using the [app-submission template](.github/PULL_REQUEST_TEMPLATE/app-submission.md).
4. Maintainer reviews → merges → site auto-deploys.

## Schema (the only thing that matters)

```yaml
# --- Identity ---
displayName: Obsidian             # human-readable app name
homepage: https://obsidian.md     # official product homepage
cliType: standalone               # standalone = separate install; embedded = ships with desktop app

# --- CLI install commands ---
cliInstall:                       # at least one entry; [] only for embedded apps
  - command: brew install --cask obsidian
    official: true                # true = vendor-published, false = community-maintained

# --- Agent skill install commands ---
skillInstall:                     # same shape as cliInstall; [] if none
  - command: npx skills add obsidian-vault
    official: false               # true = vendor-published, false = community-maintained

# --- Source & docs ---
openSourceDocsUrl: null           # GitHub repo URL if open-source, else null
officialDocsUrl: https://help.obsidian.md/Obsidian+CLI   # product docs page, or null

# --- Descriptions ---
categories: [notes]               # one or more; current values in the directory:
                                  # coding, collaboration, devops, security, api,
                                  # media, cloud, database, design, notes, productivity
tags: [pkm, markdown, notes]     # free-form, lowercase, 3–5 tags you choose
oneLiner: A local-first knowledge base operating on plain Markdown files.  # ≤ 140 chars
description: >                    # 2–4 sentences, plain English
  Two to four sentences. What the CLI does, who benefits.

# --- Intents & relations ---
intents:                          # what a user or agent would want to DO (not commands)
  - append a daily note from a shell script
  - let an agent search the vault and surface backlinks
alternativesTo: [Notion]          # other app names; [] if none

# --- Status ---
status: active                    # active | beta | deprecated
```


## Acceptance criteria

A PR is mergeable when **all** of these hold:

- The CLI is **real and reachable** — install command works on a clean machine.
- `cliInstall` uses one of: `npm`, `bun`, `brew`, or a single shell script
  pulled over `curl … | sh`. No multi-step manual installs, no cargo, no go install.
- `oneLiner` ≤ 140 chars.
- `categories` matches user tasks. An app can belong to more than one.
- For closed-source apps, `openSourceDocsUrl` MUST be `null` — never invent a repo.

## For AI agents submitting PRs

If you are an agent, you may open a PR provided that:

1. You read this file in full before drafting.
2. You verify the install command at least once. If you cannot run it, say so
   in the PR body and the maintainer will verify.
3. You **do not invent** flags, repos, or skill packages. If a field is unknown,
   leave it `null` / `[]` — empty is honest, fabrication is not.
4. The PR body explains why the app belongs here (1–2 sentences).

## Local dev

```sh
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # static dist/ for Cloudflare Pages
```
