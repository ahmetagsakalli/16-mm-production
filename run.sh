#!/bin/sh
set -eu
cd "$(dirname "$0")"
runtime_path="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies"
if ! command -v node >/dev/null 2>&1 && [ -x "$runtime_path/node/bin/node" ]; then
  export PATH="$runtime_path/node/bin:$PATH"
fi
if ! command -v pnpm >/dev/null 2>&1 && [ -x "$runtime_path/bin/fallback/pnpm" ]; then
  export PATH="$runtime_path/bin/fallback:$PATH"
fi
if ! command -v node >/dev/null 2>&1 || ! command -v pnpm >/dev/null 2>&1; then
  echo 'Node.js 24 ve pnpm 11 kurulu olmalıdır.' >&2
  exit 1
fi
# The local dependency cache has already been installed from the frozen lockfile.
if [ "$#" -eq 0 ]; then set -- dev; fi
if [ -L node_modules ]; then
  exec pnpm --config.verify-deps-before-run=false "$@"
fi
exec pnpm "$@"
