# 贡献指南

[English](CONTRIBUTING.md) | **中文**

doesitcli 是一个人工维护的桌面应用 CLI 目录。一个 PR 添加一个应用。
**人类贡献者**和 **AI Agent** 都欢迎 — 规则尽量精简。

## 快速开始

1. 创建 `data/apps/<slug>.yaml`（kebab-case 命名，如 `obsidian.yaml`）。
2. 按下方 Schema 填写。**所有字段人工维护**，禁止爬虫自动生成。
3. 使用 [app-submission 模板](.github/PULL_REQUEST_TEMPLATE/app-submission.md) 提交 PR。
4. 维护者 review → 合并 → 站点自动部署。

## Schema（唯一需要关注的）

```yaml
displayName: Obsidian
homepage: https://obsidian.md
cliType: standalone           # standalone | embedded
cliInstall:
  - command: brew install --cask obsidian
    official: true            # true = 厂商发布, false = 社区维护
skillInstall:                 # 和 cliInstall 同结构；没有则填 []
  - command: npx skills add obsidian-vault
    official: false           # true = 厂商发布, false = 社区维护
openSourceDocsUrl: null       # 开源则填 GitHub URL，否则 null
officialDocsUrl: https://help.obsidian.md/Obsidian+CLI
category: content             # coding | devops | infra | productivity |
                              # collaboration | design | content | other
tags: [pkm, markdown, notes]
oneLiner: 基于本地纯文本文件的知识库应用。
description: >
  两到四句话，简明扼要，说清楚这个 CLI 是什么、谁会用到。
useCases:
  - 通过 shell 脚本追加每日笔记
  - 让 Agent 搜索知识库并呈现反向链接
alternativesTo: [Notion]
status: active                # active | beta | deprecated
```

> **注意：** `highlight` 和 `region` 字段由维护者设置。
> PR 中不要包含这两个字段 — 在 review 时会按需添加。

## 验收标准

PR 满足以下**全部**条件即可合并：

- CLI **真实可用** — 安装命令在干净环境下能跑通。
- `cliInstall` 仅使用：`npm`、`bun`、`brew` 或单行 `curl … | sh`。不接受多步手动安装、cargo、go install。
- `oneLiner` ≤ 140 字符。
- `useCases` 是**意图**，不是命令。三条足够。
- `category` 对应用户任务（启动器是 `productivity`，哪怕它用 Rust 写的）。拿不准就用 `other`。
- 闭源应用的 `openSourceDocsUrl` **必须**填 `null` — 不要编造仓库地址。

## AI Agent 提交 PR 的规则

如果你是 Agent，可以提交 PR，但需要满足：

1. 提交前完整阅读本文件。
2. 至少验证一次安装命令能否执行。无法执行的，在 PR 正文中说明，维护者会代为验证。
3. **不要编造**命令参数、仓库地址或 skill 包名。字段未知时填 `null` / `[]` — 留空是诚实的，捏造不是。
4. PR 正文说明这个应用为什么值得收录（1–2 句话）。

## 本地开发

```sh
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # 静态产物，部署到 Cloudflare Pages
```
