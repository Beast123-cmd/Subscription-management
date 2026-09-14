#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null; then
  echo 'Node.js 24+ is required. Install it, then run this script again.' >&2
  exit 1
fi

if ! command -v pnpm >/dev/null; then
  echo 'pnpm is required. Run: corepack enable && corepack prepare pnpm@10.18.2 --activate' >&2
  exit 1
fi

pnpm install --frozen-lockfile

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo 'Created .env.local from .env.example.'
else
  echo '.env.local already exists; left unchanged.'
fi

cat <<'EOF'

Setup complete.

Next steps:
1. Set DATABASE_URL, DATABASE_URL_UNPOOLED, and JWT_SECRET in .env.local.
2. Select your Neon feature branch and pull its environment if your team uses the Neon CLI.
3. Run pnpm dev.

See docs/DEVELOPMENT_WORKFLOW.md for the shared Neon and migration workflow.
EOF
