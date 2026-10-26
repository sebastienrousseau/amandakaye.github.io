#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0 OR MIT
"""Post-build fixes for the GitHub Pages output that ssg leaves out.

Run after `ssg build` on the output directory (docs/ by default):

1. CSP as a <meta> tag. ssg writes each page's Content-Security-Policy
   (with the sha256 hashes of that page's inline scripts) only to
   _headers, which Netlify reads and GitHub Pages ignores, so the site
   is served with no policy. This copies each page's policy from
   _headers into a <meta http-equiv="Content-Security-Policy"> placed
   first in <head>, dropping the directives a <meta> policy cannot
   carry (as ssg's own csp::policy_for_meta does). Pages that already
   have a CSP <meta> are left alone, so the step is idempotent.

2. RSS item titles and authors. ssg's RSS aggregate plugin writes the
   <title> and <author> of each item without XML escaping, so a title
   containing "&" makes rss.xml malformed. Bare ampersands in those
   two elements are escaped; existing entities are left alone.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

META_INELIGIBLE = {"frame-ancestors", "report-uri", "report-to", "sandbox"}
BARE_AMP = re.compile(r"&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)")
RSS_TEXT = re.compile(r"(<(title|author)>)(.*?)(</\2>)", re.DOTALL)
HEAD_OPEN = re.compile(r"<head(\s[^>]*)?>", re.IGNORECASE)
CSP_META = re.compile(r"<meta[^>]+http-equiv=[\"']content-security-policy[\"']", re.IGNORECASE)


def read_header_policies(headers: Path) -> dict[str, str]:
    """Maps each _headers path pattern to its Content-Security-Policy."""
    policies: dict[str, str] = {}
    current = None
    for line in headers.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            current = line.strip()
            continue
        name, _, value = line.strip().partition(":")
        if current and name.lower() == "content-security-policy":
            policies[current] = value.strip()
    return policies


def policy_for_meta(policy: str) -> str:
    directives = (d.strip() for d in policy.split(";"))
    return "; ".join(d for d in directives if d and d.split()[0].lower() not in META_INELIGIBLE)


def page_route(site: Path, page: Path) -> str:
    rel = page.relative_to(site).as_posix()
    route = "/" + rel.removesuffix("index.html")
    return route


def inject_csp(site: Path) -> int:
    policies = read_header_policies(site / "_headers")
    fallback = policies.get("/*")
    changed = 0
    for page in sorted(site.rglob("*.html")):
        if "_csp" in page.relative_to(site).parts:
            continue
        policy = policies.get(page_route(site, page), fallback)
        html = page.read_text(encoding="utf-8")
        if policy is None or CSP_META.search(html) or not HEAD_OPEN.search(html):
            continue
        meta = f'<meta http-equiv="Content-Security-Policy" content="{policy_for_meta(policy)}">'
        end = HEAD_OPEN.search(html).end()
        html = html[:end] + meta + html[end:]
        page.write_text(html, encoding="utf-8")
        changed += 1
    return changed


def escape_rss(site: Path) -> int:
    rss = site / "rss.xml"
    if not rss.is_file():
        return 0
    text = rss.read_text(encoding="utf-8")
    fixed = RSS_TEXT.sub(
        lambda m: m.group(1) + BARE_AMP.sub("&amp;", m.group(3)) + m.group(4), text
    )
    if fixed == text:
        return 0
    rss.write_text(fixed, encoding="utf-8")
    return 1


def main(argv: list[str]) -> int:
    site = Path(argv[1] if len(argv) > 1 else "docs")
    if not (site / "_headers").is_file():
        print(f"{site}/_headers not found; run ssg build first", file=sys.stderr)
        return 1
    print(f"CSP <meta> added to {inject_csp(site)} page(s); rss.xml fixed: {escape_rss(site)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
