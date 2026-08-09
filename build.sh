#!/usr/bin/env bash
set -euo pipefail

# Clean temporary build directory
rm -rf _posts_build
cp -R _posts _posts_build

# Strip non-content markdown
find _posts_build -name 'README.md' -delete

# Compile site using ssg
ssg build -c=_posts_build -t=_layouts -o=public

# Copy layouts CSS and JS directly to public/ AFTER ssg build finishes
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

# Copy favicon.ico to public/
if [[ -f favicon.ico ]]; then
  cp -f favicon.ico public/favicon.ico
fi

# Generate .html file fallbacks and stage ALL asset dependencies into subdirectories
find public -type f -name "index.html" | while read -r idx; do
  dir="$(dirname "$idx")"
  if [[ "$dir" != "public" ]]; then
    cp -f "$idx" "${dir}.html" 2>/dev/null || true

    # Stage ALL JS, CSS, favicon, search index, and _csp assets into subdirectories for 100% 200 OK resolution
    parent="$(dirname "$dir")"
    cp -f "${parent}"/*.js "${dir}/" 2>/dev/null || true
    cp -f "${parent}"/*.css "${dir}/" 2>/dev/null || true
    cp -f "${parent}"/search-index*.json "${dir}/" 2>/dev/null || true
    if [[ -f "${parent}/favicon.ico" ]]; then
      cp -f "${parent}/favicon.ico" "${dir}/favicon.ico" 2>/dev/null || true
    fi

    if [[ -d "${parent}/_csp" ]]; then
      mkdir -p "${dir}/_csp"
      cp -R "${parent}/_csp/"* "${dir}/_csp/" 2>/dev/null || true
    fi
    if [[ -d "${parent}/assets" ]]; then
      mkdir -p "${dir}/assets"
      cp -R "${parent}/assets/"* "${dir}/assets/" 2>/dev/null || true
    fi
  fi
done

# Fix subpath URLs and remove SRI integrity attributes for CSP compatibility
if [[ "$(uname)" == "Darwin" ]]; then
  find public -type f -name "*.html" -exec sed -i '' \
    -e 's|href="/_csp/|href="_csp/|g' \
    -e 's|src="/_csp/|src="_csp/|g' \
    -e 's| integrity="[^"]*"||g' \
    -e 's|</head>|<link rel="icon" type="image/x-icon" href="favicon.ico"></head>|g' \
    {} + 2>/dev/null || true
else
  find public -type f -name "*.html" -exec sed -i \
    -e 's|href="/_csp/|href="_csp/|g' \
    -e 's|src="/_csp/|src="_csp/|g' \
    -e 's| integrity="[^"]*"||g' \
    -e 's|</head>|<link rel="icon" type="image/x-icon" href="favicon.ico"></head>|g' \
    {} + 2>/dev/null || true
fi

# Enforce noindex disallow rules in all robots.txt for client demo security
find public -name "robots.txt" -exec sh -c 'printf "User-agent: *\nDisallow: /\n" > "$1"' _ {} \;

# Clean temporary directory
rm -rf _posts_build

echo "Site compiled and assets staged successfully to public/"
