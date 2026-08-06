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

# Copy layouts assets directly to public/
for f in styles.css main.js theme-init.js search.js search.css; do
  if [[ -f "_layouts/${f}" ]]; then
    cp -f "_layouts/${f}" "public/${f}"
  fi
done

# Copy static assets to public/assets
if [[ -d assets ]]; then
  mkdir -p public/assets
  cp -R assets/* public/assets/
fi

# Fix leading slashes in _csp asset references for subpath domain compatibility
if [[ "$(uname)" == "Darwin" ]]; then
  find public -type f -name "*.html" -exec sed -i '' -e 's|href="/_csp/|href="_csp/|g' -e 's|src="/_csp/|src="_csp/|g' {} + 2>/dev/null || true
else
  find public -type f -name "*.html" -exec sed -i -e 's|href="/_csp/|href="_csp/|g' -e 's|src="/_csp/|src="_csp/|g' {} + 2>/dev/null || true
fi

# Clean temporary directory
rm -rf _posts_build

echo "Site compiled and assets staged successfully to public/"

if [[ "${SERVE}" -eq 1 ]]; then
  echo "Serving public/ on http://localhost:8080 ..."
  python3 -m http.server 8080 --directory public
fi
