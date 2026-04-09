import type { APIRoute } from 'astro'

export const prerender = true

/**
 * One-line installer: curl -fsSL https://doesitcli.com/install | sh
 *
 * Auto-detects which agent tools are present and installs the /cli skill
 * for each. Non-destructive — overwrites only the doesitcli command file.
 */
export const GET: APIRoute = ({ site }) => {
    const origin = site?.origin ?? 'https://doesitcli.com'
    const body = `#!/bin/sh
# doesitcli skill installer
# Usage: curl -fsSL ${origin}/install | sh
set -e

ORIGIN="${origin}"
INSTALLED=0

# Claude Code — slash command /cli
CLAUDE_DIR="\${HOME}/.claude/commands"
if [ -d "\${HOME}/.claude" ]; then
    mkdir -p "\${CLAUDE_DIR}"
    curl -fsSL "\${ORIGIN}/agent-prompt" > "\${CLAUDE_DIR}/cli.md"
    echo "✓ Claude Code: installed /cli command → \${CLAUDE_DIR}/cli.md"
    INSTALLED=\$((INSTALLED + 1))
fi

# Codex — prompt file
CODEX_DIR="\${HOME}/.codex/prompts"
if [ -d "\${HOME}/.codex" ]; then
    mkdir -p "\${CODEX_DIR}"
    curl -fsSL "\${ORIGIN}/agent-prompt" > "\${CODEX_DIR}/cli.md"
    echo "✓ Codex: installed cli prompt → \${CODEX_DIR}/cli.md"
    INSTALLED=\$((INSTALLED + 1))
fi

# Cursor — user rules
CURSOR_DIR="\${HOME}/.cursor"
if [ -d "\${CURSOR_DIR}" ]; then
    mkdir -p "\${CURSOR_DIR}/rules"
    curl -fsSL "\${ORIGIN}/agent-prompt" > "\${CURSOR_DIR}/rules/doesitcli.md"
    echo "✓ Cursor: installed rule → \${CURSOR_DIR}/rules/doesitcli.md"
    INSTALLED=\$((INSTALLED + 1))
fi

if [ "\${INSTALLED}" -eq 0 ]; then
    echo "No agent tool detected (~/.claude, ~/.codex, ~/.cursor)."
    echo "Manual install for Claude Code:"
    echo "  mkdir -p ~/.claude/commands"
    echo "  curl -fsSL \${ORIGIN}/agent-prompt > ~/.claude/commands/cli.md"
else
    echo ""
    echo "Done. \${INSTALLED} skill(s) installed."
    echo "Try: /cli does Figma have a CLI?"
fi
`
    return new Response(body, {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
}
