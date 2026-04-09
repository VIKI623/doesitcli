# [doesitcli.com](https://doesitcli.com)

[English](README.md) | **中文**

> 桌面应用 CLI 目录，为 AI Agent 而建

所有桌面应用的 CLI，集中在一个地方 — 安装命令、使用场景、Agent Skill 链接。

## 这是什么？

doesitcli 回答 **"X 有 CLI 吗？"** 这个问题。

每条收录包含：安装命令（官方 + 社区）、能做什么、厂商发布的 Agent Skill 安装方式、文档链接。机器可读：`/{slug}.md`、`/{slug}.json`、`/llms.txt`。

## 添加应用

一个 PR 添加一个应用。Schema、验收标准和 Agent 规则见
[CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md)。安装方式仅限：**npm · bun · brew · shell script**。

## Agent 接入

```sh
curl -fsSL https://doesitcli.com/agent-prompt | claude   # 一次性试用
curl https://doesitcli.com/llms.txt                       # 索引
curl https://doesitcli.com/feishu.md                      # 单个应用
```

## 技术栈

Astro 6 · Tailwind · Vue 3 · Fuse.js · YAML content collections

## 许可证

[MIT](LICENSE) — fork 自 [doesitarm](https://github.com/ThatGuySam/doesitarm)。
