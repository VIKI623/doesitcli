# 贡献指南

[English](CONTRIBUTING.md) | **中文**

doesitcli 是一个社区维护的桌面应用 CLI 目录。一个 PR 添加一个应用。
**人类贡献者**和 **AI Agent** 都欢迎 — 规则尽量精简。

## 快速开始

1. 复制 [`data/apps/_template.yaml`](data/apps/_template.yaml) → `data/apps/<slug>.yaml`（kebab-case 命名，如 `obsidian.yaml`）。
2. 按下方 Schema 填写。
3. 使用 [app-submission 模板](.github/PULL_REQUEST_TEMPLATE/app-submission.md) 提交 PR。
4. 维护者 review → 合并 → 站点自动部署。

## Schema（唯一需要关注的）

```yaml
# --- 基本信息 ---
displayName: Obsidian             # 应用显示名称
homepage: https://obsidian.md     # 官方主页
cliType: standalone               # standalone = 独立安装; embedded = 内嵌在桌面应用中

# --- CLI 安装命令 ---
cliInstall:                       # 至少一条; embedded 且无安装命令时填 []
  - command: brew install --cask obsidian
    official: true                # true = 厂商发布, false = 社区维护

# --- Agent Skill 安装命令 ---
skillInstall:                     # 和 cliInstall 同结构; 没有则填 []
  - command: npx skills add obsidian-vault
    official: false               # true = 厂商发布, false = 社区维护

# --- 源码与文档 ---
openSourceDocsUrl: null           # 开源则填 GitHub 仓库 URL，否则 null
officialDocsUrl: https://help.obsidian.md/Obsidian+CLI   # 产品文档页，或 null

# --- 描述 ---
categories: [notes]               # 一个或多个；目录中现有值：
                                  # coding, collaboration, devops, security, api,
                                  # media, cloud, database, design, notes, productivity
tags: [pkm, markdown, notes]     # 自由填写，小写，3–5 个标签
oneLiner: 基于本地纯文本文件的知识库应用。  # ≤ 140 字符
description: >                    # 两到四句话，说清楚这个 CLI 是什么、谁会用到
  两到四句话，简明扼要。

# --- 意图与关联 ---
intents:                          # 用户或 Agent 想要做什么（填意图，不是命令）
  - 通过 shell 脚本追加每日笔记
  - 让 Agent 搜索知识库并呈现反向链接
alternativesTo: [Notion]          # 同类应用名称; 没有则填 []

# --- 状态 ---
status: active                    # active | beta | deprecated
```


## 验收标准

PR 满足以下**全部**条件即可合并：

- CLI **真实可用** — 安装命令在干净环境下能跑通。
- `cliInstall` 仅使用：`npm`、`bun`、`brew` 或单行 `curl … | sh`。不接受多步手动安装、cargo、go install。
- `oneLiner` ≤ 140 字符。
- `categories` 对应用户任务,一个应用可以属于多个分类。
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
