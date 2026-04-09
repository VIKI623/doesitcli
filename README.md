# [doesitcli.com](https://doesitcli.com)

> Desktop app CLI directory, built for AI agents

Every desktop app's CLI, in one place — install commands, use-cases, and agent skill links.

## What is this?

doesitcli answers **"Does X have a CLI?"** for popular desktop apps.

Each entry has: install commands (official + community), what it can do, agent skill install if the vendor publishes one, and docs links. Machine-readable at `/{slug}.md`, `/{slug}.json`, `/llms.txt`.

## Add an app

One PR adds one app. Schema, acceptance criteria, and the agent rules live in
[CONTRIBUTING.md](CONTRIBUTING.md). Install method scope: **npm · bun · brew · shell script** only.

## Agent access

```sh
curl -fsSL https://doesitcli.com/agent-prompt | claude   # one-shot try
curl https://doesitcli.com/llms.txt                       # index
curl https://doesitcli.com/feishu.md                      # single app
```

## Tech stack

Astro 6 · Tailwind · Vue 3 · Fuse.js · YAML content collections

## License

[MIT](LICENSE) — forked from [doesitarm](https://github.com/ThatGuySam/doesitarm).
