#!/usr/bin/env bash
set -euo pipefail

# Build amandakaye.github.io with Static Site Generator (SSG):
# Usage: ./build.sh          (build + compile site)
#        ./build.sh --serve  (build and serve public/ on :8080)

SERVE=0
[[ "${1:-}" == "--serve" ]] && SERVE=1

# Clean temporary build directory
rm -rf _posts_build
cp -R _posts _posts_build

# Strip non-content markdown
find _posts_build -name 'README.md' -delete

# Compile site using ssg
ssg build -c=_posts_build -t=_layouts -o=public

# Copy assets to public/assets
if [[ -d assets ]]; then
  mkdir -p public/assets
  cp -R assets/* public/assets/
fi

# Clean temporary directory
rm -rf _posts_build

echo "Site compiled successfully to public/"

if [[ "${SERVE}" -eq 1 ]]; then
  echo "Serving public/ on http://localhost:8080 ..."
  python3 -m http.server 8080 --directory public
fi
