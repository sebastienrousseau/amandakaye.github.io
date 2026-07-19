#!/usr/bin/env python3
"""Static quality checks for bamidelealy.github.io."""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_HREFLANG = {"en-GB", "fr-FR", "de-DE", "x-default"}
REDIRECT_STUBS = {
    ROOT / "about.html",
    ROOT / "fr" / "a-propos.html",
    ROOT / "de" / "ueber.html",
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.lang: str | None = None
        self.refs: list[tuple[str, str, str]] = []
        self.meta_description = 0
        self.viewport = 0
        self.csp = 0
        self.canonical: list[str] = []
        self.alternates: list[tuple[str, str]] = []
        self.images: list[dict[str, str]] = []
        self.buttons: list[dict[str, str]] = []
        self.summaries = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        if tag == "html":
            self.lang = data.get("lang")
        if tag == "meta" and data.get("name") == "description":
            self.meta_description += 1
        if tag == "meta" and data.get("name") == "viewport":
            self.viewport += 1
        if tag == "meta" and data.get("http-equiv", "").lower() == "content-security-policy":
            self.csp += 1
        if tag == "link" and data.get("rel") == "canonical":
            self.canonical.append(data.get("href", ""))
        if tag == "link" and data.get("rel") == "alternate" and data.get("hreflang"):
            self.alternates.append((data["hreflang"], data.get("href", "")))
        if tag == "img":
            self.images.append(data)
        if tag == "button":
            self.buttons.append(data)
        if tag == "summary":
            self.summaries += 1
        for attr in ("href", "src", "action"):
            if attr in data:
                self.refs.append((tag, attr, data[attr]))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def local_target(page: Path, ref: str) -> Path | None:
    if ref.startswith(("http://", "https://", "mailto:", "tel:", "data:", "#", "//")):
        return None
    parsed = urlparse(ref)
    path = unquote(parsed.path)
    if not path:
        return None
    target = ROOT / path.lstrip("/") if path.startswith("/") else page.parent / path
    return target / "index.html" if path.endswith("/") else target


def check_structured_files() -> None:
    for path in [ROOT / "search-data.json", ROOT / "fr/search-data.json", ROOT / "de/search-data.json", ROOT / "manifest.json"]:
        json.loads(path.read_text())
    for path in [ROOT / "sitemap.xml", ROOT / "rss.xml", ROOT / "fr/rss.xml", ROOT / "de/rss.xml"]:
        ET.parse(path)


def hex_to_rgb(value: str) -> tuple[float, float, float]:
    value = value.strip().lstrip("#")
    if len(value) == 3:
        value = "".join(char * 2 for char in value)
    return tuple(int(value[i : i + 2], 16) / 255 for i in (0, 2, 4))


def linearize(channel: float) -> float:
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def luminance(rgb: tuple[float, float, float]) -> float:
    r, g, b = (linearize(channel) for channel in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(foreground: str, background: str) -> float:
    lighter, darker = sorted(
        (luminance(hex_to_rgb(foreground)), luminance(hex_to_rgb(background))),
        reverse=True,
    )
    return (lighter + 0.05) / (darker + 0.05)


def css_vars(block: str) -> dict[str, str]:
    return {
        name: value
        for name, value in re.findall(r"--([a-z-]+):\s*(#[0-9a-fA-F]{3,6})\s*;", block)
    }


def check_contrast_tokens() -> None:
    css = (ROOT / "styles.css").read_text()
    light_match = re.search(r":root,\s*:root\[data-theme=\"light\"\]\s*\{(?P<body>.*?)\n\s*\}", css, re.S)
    dark_match = re.search(r":root\[data-theme=\"dark\"\]\s*\{(?P<body>.*?)\n\s*\}", css, re.S)
    if not light_match or not dark_match:
        fail("styles.css missing light/dark theme variable blocks")
    for theme, values in [("light", css_vars(light_match.group("body"))), ("dark", css_vars(dark_match.group("body")))]:
        for foreground, background in [
            ("ink", "bg"),
            ("ink-soft", "bg"),
            ("ink-muted", "bg"),
            ("accent", "bg"),
            ("ink", "surface"),
            ("ink-soft", "surface"),
            ("ink-muted", "surface"),
            ("accent", "surface"),
        ]:
            ratio = contrast_ratio(values[foreground], values[background])
            if ratio < 7:
                fail(f"{theme} contrast {foreground}/{background} is {ratio:.2f}:1, below WCAG AAA normal text")


def check_html_pages() -> None:
    for page in sorted(ROOT.glob("**/*.html")):
        if ".git" in page.parts or ".lighthouseci" in page.parts:
            continue
        text = page.read_text(errors="replace")
        parser = PageParser()
        parser.feed(text)
        if not parser.lang:
            fail(f"{page.relative_to(ROOT)} missing html lang")
        if "<title>" not in text:
            fail(f"{page.relative_to(ROOT)} missing title")
        if "sebastienrousseau.com" not in text:
            fail(f"{page.relative_to(ROOT)} missing maker footer credit")
        if page not in REDIRECT_STUBS:
            if parser.meta_description != 1:
                fail(f"{page.relative_to(ROOT)} has {parser.meta_description} meta descriptions")
            if parser.viewport != 1:
                fail(f"{page.relative_to(ROOT)} has {parser.viewport} viewport tags")
            if parser.csp != 1:
                fail(f"{page.relative_to(ROOT)} has {parser.csp} CSP tags")
        if len(parser.canonical) != 1:
            fail(f"{page.relative_to(ROOT)} has {len(parser.canonical)} canonical links")
        if page not in REDIRECT_STUBS and "404.html" not in str(page):
            alternates = {lang for lang, _ in parser.alternates}
            if not EXPECTED_HREFLANG <= alternates:
                fail(f"{page.relative_to(ROOT)} missing hreflang set")
        h1_count = len(re.findall(r"<h1\b", text, re.I))
        if page not in REDIRECT_STUBS and h1_count != 1:
            fail(f"{page.relative_to(ROOT)} has {h1_count} h1 elements")
        for image in parser.images:
            if "alt" not in image:
                fail(f"{page.relative_to(ROOT)} image missing alt: {image.get('src', '')}")
            if not image.get("width") or not image.get("height"):
                fail(f"{page.relative_to(ROOT)} image missing dimensions: {image.get('src', '')}")
        for button_markup in re.findall(r"<button\b(?P<attrs>[^>]*)>(?P<body>.*?)</button>", text, re.I | re.S):
            attrs, body = button_markup
            has_attribute_name = re.search(r"\b(aria-label|aria-labelledby|title)\s*=", attrs, re.I)
            visible_text = re.sub(r"<[^>]+>", " ", body)
            visible_text = re.sub(r"\s+", " ", visible_text).strip()
            if not has_attribute_name and not visible_text:
                fail(f"{page.relative_to(ROOT)} button missing accessible name")
        if "<details" in text and parser.summaries != len(re.findall(r"<details\b", text, re.I)):
            fail(f"{page.relative_to(ROOT)} details element missing summary")
        for _, _, ref in parser.refs:
            target = local_target(page, ref)
            if target and not target.exists():
                fail(f"{page.relative_to(ROOT)} broken local ref {ref} -> {target.relative_to(ROOT)}")


def check_search_targets() -> None:
    for search_file, language in [
        (ROOT / "search-data.json", "en"),
        (ROOT / "fr/search-data.json", "fr"),
        (ROOT / "de/search-data.json", "de"),
    ]:
        entries = json.loads(search_file.read_text())["index"][language]
        for entry in entries:
            target = local_target(search_file, entry["u"])
            if target and not target.exists():
                fail(f"{search_file.relative_to(ROOT)} broken search target {entry['u']}")


def main() -> int:
    check_structured_files()
    check_contrast_tokens()
    check_html_pages()
    check_search_targets()
    print("Static quality checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
