.PHONY: help build docs serve check clean

help:
	@echo "Amanda Kaye - Executive PMO Website (SSG Build Pipeline)"
	@echo ""
	@echo "Commands:"
	@echo "  make build    Compile the static site into public/"
	@echo "  make docs     Rebuild docs/ (the GitHub Pages site) with CSP <meta> tags"
	@echo "  make serve    Build and launch local dev server on http://localhost:8080"
	@echo "  make check    Run SSG build-time validators"
	@echo "  make clean    Remove generated build files"

build:
	@bash build.sh

# ssg writes the per-page CSP only to docs/_headers, which GitHub Pages
# ignores; pages-postbuild.py copies it into each page as a <meta> tag.
docs:
	@ssg build
	@python3 scripts/pages-postbuild.py docs

serve:
	@bash build.sh --serve

check:
	@ssg check -c=_posts -t=_layouts

clean:
	@rm -rf public/ _posts_build/

# WCAG 2.2 Level AAA & Frontmatter Quality Targets
.PHONY: contrast validate
contrast:
	@/usr/bin/python3 scripts/audit-contrast.py

validate:
	@/usr/bin/python3 scripts/validate-frontmatter.py
