# Amanda Kaye — Head of PMO & Enterprise Portfolio Leader

> Digital portfolio website for **Amanda Kaye**, Head of PMO & Enterprise Portfolio Leader (London, UK), compiled using **Static Site Generator (`ssg`)** and built on the [`portfolio`](https://github.com/sebastienrousseau/ssg-themes.github.io/tree/main/themes/portfolio) theme from `ssg-themes.github.io`.

Benchmarked against [sebastienrousseau.github.io](https://github.com/sebastienrousseau/sebastienrousseau.github.io).

---

## Architecture Overview

This project uses a content-first static site generation architecture:

```
amandakaye.github.io/
├── Makefile               # Build, serve, check, and clean tasks
├── build.sh               # Shell script executing SSG build pipeline
├── pyproject.toml         # Python build tool configuration
├── _data/                 # Site configuration & navigation data
│   ├── site.json
│   └── navigation.json
├── _layouts/              # Layout templates (from ssg-themes portfolio theme)
│   ├── index.html         # Executive homepage layout
│   ├── page.html          # Content page layout
│   ├── project.html       # Case study project layout
│   ├── frameworks.html    # PMO frameworks layout
│   ├── about.html         # Career history timeline layout
│   ├── contact.html       # Executive contact layout
│   └── styles.css         # Executive CSS design system
├── _posts/                # Content directory (Markdown files with Frontmatter)
│   ├── index.md           # Homepage content & frontmatter
│   ├── projects.md        # Case studies content & frontmatter
│   ├── frameworks.md      # Frameworks content & frontmatter
│   ├── about.md           # Biography & career timeline content
│   └── contact.md         # Contact form content
├── assets/                # Static image assets (portraits, icons)
└── public/                # Generated static HTML site output (git-ignored)
```

---

## Quick Start (How to Run using `ssg`)

### 1. Prerequisites
Ensure `ssg` (Static Site Generator) is installed on your system:
```bash
ssg --version
```

### 2. Build the Static Site
Compile all Markdown posts in `_posts/` with layouts in `_layouts/` into `public/`:
```bash
make build
# or
./build.sh
```

### 3. Build & Serve Locally
Compile the site and launch a local web server at `http://localhost:8080`:
```bash
make serve
# or
./build.sh --serve
```

### 4. Validate Content & Layouts
Run SSG build-time validators:
```bash
make check
```

---

## Editing Content & Frontmatter

All page content resides in `_posts/` as standard Markdown (`.md`) files. Each file begins with a YAML frontmatter block:

```yaml
---
author: "ahkaye75@googlemail.com (Amanda Kaye)"
copyright: "© Copyright 2026 - Amanda Kaye. All rights reserved."
date: "2026-08-05"
description: "Amanda Kaye is Head of PMO & Enterprise Portfolio Leader..."
id: "https://amandakaye.github.io"
image: "assets/amanda-kaye-portrait.jpg"
keywords: "Amanda Kaye, Head of PMO, Enterprise Portfolio Management"
language: "en-GB"
layout: "index"
name: "Amanda Kaye"
short_name: "AK"
permalink: "https://amandakaye.github.io"
title: "Amanda Kaye | Head of PMO & Enterprise Portfolio Leader"
---
```

To update page text, edit the respective `.md` file in `_posts/` and run `make build`.
