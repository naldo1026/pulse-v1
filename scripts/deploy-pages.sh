#!/usr/bin/env bash
# Publishes dist/ to the gh-pages branch via a disposable git repo, rather
# than the gh-pages npm package — that package collects files with globby,
# which silently drops anything under a node_modules path by default, and
# Metro's web export puts fonts/icons at dist/assets/node_modules/..., so
# gh-pages was publishing a site with every custom font and icon missing.
set -euo pipefail

cd "$(dirname "$0")/.."

REMOTE_URL=$(git remote get-url origin)

rm -rf dist/.git
touch dist/.nojekyll

cd dist
git init -q
git checkout -q -B gh-pages
git add -A
git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f -q "$REMOTE_URL" gh-pages:gh-pages
