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

# Generate Vanguard theme release packages in public/ and public/downloads/
mkdir -p public/downloads
zip -r public/vanguard.zip _layouts/ _data/ styles.css build.sh -x "*.DS_Store" 2>/dev/null || true
tar -czf public/vanguard.tar.gz _layouts/ _data/ styles.css build.sh 2>/dev/null || true
cp -f public/vanguard.zip public/downloads/vanguard.zip 2>/dev/null || true
cp -f public/vanguard.tar.gz public/downloads/vanguard.tar.gz 2>/dev/null || true

# Generate .html file fallbacks and stage ALL asset dependencies into subdirectories
find public -type f -name "index.html" | while read -r idx; do
  dir="$(dirname "$idx")"
  if [[ "$dir" != "public" && "$dir" != "public/downloads" ]]; then
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

# Python post-processing: strip any auto-injected <div lang="en"> bleeding blocks completely
python3 -c '
import glob, re
for path in glob.glob("public/**/*.html", recursive=True):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    cleaned = re.sub(r"<div lang=\"en\">.*?</div>", "", content, flags=re.DOTALL)
    cleaned = re.sub(r"&lt;div lang=\"en\"&gt;.*?&lt;/div&gt;", "", cleaned, flags=re.DOTALL)
    cleaned = re.sub(r"<meta [^>]*content=\"&amp;lt;div lang=&quot;en&quot; [^>]*>", "", cleaned)
    if cleaned != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(cleaned)
' 2>/dev/null || true

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
