.PHONY: help build serve check clean

help:
	@echo "Amanda Kaye - Executive PMO Website (SSG Build Pipeline)"
	@echo ""
	@echo "Commands:"
	@echo "  make build    Compile the static site into public/"
	@echo "  make serve    Build and launch local dev server on http://localhost:8080"
	@echo "  make check    Run SSG build-time validators"
	@echo "  make clean    Remove generated build files"

build:
	@bash build.sh

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
