#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0 OR MIT
"""Static quality checks for the built amandakaye.github.io site.

Checks the output GitHub Pages serves (docs/ by default, or the
directory given as the first argument):

* the JSON and XML feeds, manifest and search index parse;
* every page has a lang, a title, one meta description, one viewport,
  one canonical link and one h1;
* every image has alt text, every button an accessible name and every
  details element a summary;
* every internal link, asset and #fragment resolves inside the site;
* every page carries a Content-Security-Policy <meta> tag, and that
  policy allows the page's own inline scripts and style attributes.

GitHub Pages cannot send custom HTTP headers, so a policy that only
lives in _headers is never applied there; the <meta> tag is the one
that counts.

Exits 0 when every check passes, 1 with one FAIL line per problem.
"""

from __future__ import annotations

import base64
import hashlib
import json
import re
import sys
import tomllib
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

REPO = Path(__file__).resolve().parents[1]
SKIP_DIRS = {"_csp", ".meta", ".ssg-cache", ".ssg", ".well-known", "api"}
JSON_FILES = ["manifest.json", "search-index.json", "feed.json"]
XML_FILES = ["sitemap.xml", "rss.xml", "atom.xml"]
EXTERNAL = ("mailto:", "tel:", "data:", "javascript:", "//")
SCRIPT_DATA_TYPES = {"application/ld+json", "application/json"}


class PageParser(HTMLParser):
    """Collects the facts the checks need from one HTML page."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang: str | None = None
        self.title = ""
        self.counts: dict[str, int] = {}
        self.csp: list[str] = []
        self.canonical: list[str] = []
        self.refs: list[str] = []
        self.ids: set[str] = set()
        self.images: list[dict[str, str]] = []
        self.style_attrs = 0
        self.inline_scripts: list[str] = []
        self._in: str | None = None
        self._buffer: list[str] = []

    def bump(self, key: str) -> None:
        self.counts[key] = self.counts.get(key, 0) + 1

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        self.bump(tag)
        self.ids.update(data[k] for k in ("id", "name") if data.get(k))
        self.style_attrs += "style" in data
        self.refs.extend(data[a] for a in ("href", "src", "action") if a in data)
        self.record_tag(tag, data)
        if tag in ("title", "script") and "src" not in data:
            self.start_capture(tag, data)

    def record_tag(self, tag: str, data: dict[str, str]) -> None:
        if tag == "html":
            self.lang = data.get("lang")
        elif tag == "meta":
            self.handle_meta(data)
        elif tag == "link" and data.get("rel") == "canonical":
            self.canonical.append(data.get("href", ""))
        elif tag == "img":
            self.images.append(data)

    def handle_meta(self, data: dict[str, str]) -> None:
        name = data.get("name", "").lower()
        if name in ("description", "viewport") and data.get("content", "").strip():
            self.bump(f"meta:{name}")
        if data.get("http-equiv", "").lower() == "content-security-policy":
            self.csp.append(data.get("content", ""))

    def start_capture(self, tag: str, data: dict[str, str]) -> None:
        if tag == "script" and data.get("type", "").lower() in SCRIPT_DATA_TYPES:
            tag = "data-script"
        self._in, self._buffer = tag, []

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_data(self, data: str) -> None:
        if self._in:
            self._buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        text = "".join(self._buffer)
        if self._in == "title" and tag == "title":
            self.title = text.strip()
        elif self._in == "script" and tag == "script" and text.strip():
            self.inline_scripts.append(text)
        if tag in ("title", "script"):
            self._in = None


class Checker:
    """Runs every check and records failures instead of stopping at one."""

    def __init__(self, site: Path, base_url: str) -> None:
        self.site = site
        self.base = base_url.rstrip("/")
        self.failures: list[str] = []
        self.pages: dict[Path, PageParser] = {}

    def fail(self, where: Path | str, message: str) -> None:
        where = where.relative_to(self.site) if isinstance(where, Path) else where
        self.failures.append(f"{where}: {message}")

    def html_pages(self) -> list[Path]:
        return sorted(
            page
            for page in self.site.rglob("*.html")
            if not SKIP_DIRS & set(page.relative_to(self.site).parts)
        )

    def parse(self, page: Path) -> PageParser:
        if page not in self.pages:
            parser = PageParser()
            parser.feed(page.read_text(encoding="utf-8", errors="replace"))
            self.pages[page] = parser
        return self.pages[page]

    def check_structured_files(self) -> None:
        for name in JSON_FILES + XML_FILES:
            path = self.site / name
            if not path.is_file():
                self.fail(name, "missing")
                continue
            try:
                json.loads(path.read_text()) if name.endswith(".json") else ET.parse(path)
            except (ValueError, ET.ParseError) as error:
                self.fail(name, f"does not parse: {error}")

    def check_structure(self, page: Path, doc: PageParser) -> None:
        if not doc.lang:
            self.fail(page, "missing <html lang>")
        if not doc.title:
            self.fail(page, "missing or empty <title>")
        expected = {"meta:description": 1, "meta:viewport": 1, "h1": 1}
        for key, want in expected.items():
            got = doc.counts.get(key, 0)
            if got != want:
                self.fail(page, f"has {got} {key} (expected {want})")
        if len(doc.canonical) != 1:
            self.fail(page, f"has {len(doc.canonical)} canonical links (expected 1)")

    def check_accessibility(self, page: Path, text: str, doc: PageParser) -> None:
        for image in doc.images:
            if "alt" not in image:
                self.fail(page, f"image missing alt: {image.get('src', '')}")
        for attrs, body in re.findall(
            r"<button\b([^>]*)>(.*?)</button>", text, re.IGNORECASE | re.DOTALL
        ):
            named = re.search(r"\b(aria-label|aria-labelledby|title)\s*=", attrs, re.IGNORECASE)
            visible = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)).strip()
            if not named and not visible:
                self.fail(page, "button missing accessible name")
        if doc.counts.get("details", 0) != doc.counts.get("summary", 0):
            self.fail(page, "details element missing summary")

    def resolve(self, page: Path, ref: str) -> tuple[Path, str] | None:
        if ref.startswith(self.base + "/") or ref == self.base:
            ref = ref[len(self.base) :] or "/"
        if ref.startswith(("http://", "https://") + EXTERNAL):
            return None
        parsed = urlparse(ref)
        path = unquote(parsed.path)
        if not path:
            return page, parsed.fragment
        target = self.site / path.lstrip("/") if path.startswith("/") else page.parent / path
        if path.endswith("/") or target.is_dir():
            target = target / "index.html"
        return target, parsed.fragment

    def check_links(self, page: Path, doc: PageParser) -> None:
        for ref in doc.refs:
            resolved = self.resolve(page, ref.strip())
            if resolved is None:
                continue
            target, fragment = resolved
            if not target.is_file():
                self.fail(page, f"broken local ref {ref}")
            elif fragment and target.suffix == ".html" and fragment not in self.parse(target).ids:
                self.fail(page, f"broken fragment {ref}")

    def check_csp(self, page: Path, doc: PageParser) -> None:
        if len(doc.csp) != 1:
            self.fail(page, f"has {len(doc.csp)} CSP <meta> tags (expected 1)")
            return
        directives = parse_policy(doc.csp[0])
        script_src = directives.get("script-src", directives.get("default-src", []))
        style_src = directives.get("style-src", directives.get("default-src", []))
        if "'unsafe-inline'" not in script_src:
            for script in doc.inline_scripts:
                if f"'sha256-{sha256(script)}'" not in script_src:
                    self.fail(page, "CSP blocks an inline script (hash not allowed)")
        if doc.style_attrs and "'unsafe-inline'" not in style_src:
            self.fail(page, f"CSP blocks {doc.style_attrs} inline style attribute(s)")

    def run(self) -> int:
        self.check_structured_files()
        pages = self.html_pages()
        if not pages:
            self.fail(self.site.name, "no HTML pages found")
        for page in pages:
            doc = self.parse(page)
            self.check_structure(page, doc)
            self.check_accessibility(page, page.read_text(errors="replace"), doc)
            self.check_links(page, doc)
            self.check_csp(page, doc)
        for failure in self.failures:
            print(f"FAIL: {failure}")
        if self.failures:
            print(f"{len(self.failures)} problem(s) in {len(pages)} page(s).")
            return 1
        print(f"Static quality checks passed ({len(pages)} pages).")
        return 0


def parse_policy(policy: str) -> dict[str, list[str]]:
    directives: dict[str, list[str]] = {}
    for part in policy.split(";"):
        tokens = part.split()
        if tokens:
            directives[tokens[0].lower()] = tokens[1:]
    return directives


def sha256(text: str) -> str:
    return base64.b64encode(hashlib.sha256(text.encode("utf-8")).digest()).decode()


def main(argv: list[str]) -> int:
    config = tomllib.loads((REPO / "ssg.toml").read_text())
    site = Path(argv[1]) if len(argv) > 1 else REPO / config.get("output_dir", "docs")
    return Checker(site.resolve(), config["base_url"]).run()


if __name__ == "__main__":
    sys.exit(main(sys.argv))
