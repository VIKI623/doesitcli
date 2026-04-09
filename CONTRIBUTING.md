# Contributing

**English** | [中文](CONTRIBUTING.zh-CN.md)

doesitcli is a curated CLI directory for desktop apps. One PR adds one app.
Both **human contributors** and **AI agents** are welcome — the rules below
are short on purpose.

## TL;DR

1. Create `data/apps/<slug>.yaml` (kebab-case slug, e.g. `obsidian.yaml`).
2. Fill the schema below. **Every field is human-curated.** No bots, no scrapers.
3. Open a PR using the [app-submission template](.github/PULL_REQUEST_TEMPLATE/app-submission.md).
4. Maintainer reviews → merges → site auto-deploys.

## Schema (the only thing that matters)

```yaml
displayName: Obsidian
homepage: https://obsidian.md
cliType: standalone           # standalone | embedded
cliInstall:
  - command: brew install --cask obsidian
    official: true            # true = vendor-published, false = community
skillInstall:                 # same shape as cliInstall; [] if none
  - command: npx skills add obsidian-vault
    official: false           # true = vendor-published, false = community
openSourceDocsUrl: null       # github URL if open-source, else null
officialDocsUrl: https://help.obsidian.md/Obsidian+CLI
category: content             # coding | devops | infra | productivity |
                              # collaboration | design | content | other
tags: [pkm, markdown, notes]
oneLiner: A local-first knowledge base operating on plain Markdown files.
description: >
  Two to four sentences. Plain English. What the CLI does, who benefits.
useCases:
  - append a daily note from a shell script
  - let an agent search the vault and surface backlinks
alternativesTo: [Notion]
status: active                # active | beta | deprecated
```

> **Note:** The `highlight` and `region` fields are set by maintainers only.
> Do not include them in your PR — they will be added during review if needed.

## Acceptance criteria

A PR is mergeable when **all** of these hold:

- The CLI is **real and reachable** — install command works on a clean machine.
- `cliInstall` uses one of: `npm`, `bun`, `brew`, or a single shell script
  pulled over `curl … | sh`. No multi-step manual installs, no cargo, no go install.
- `oneLiner` ≤ 140 chars.
- `useCases` are **intents**, not commands. Three is enough.
- `category` matches the user task (a launcher is `productivity`, even if it's
  built in Rust). When in doubt, use `other`.
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
