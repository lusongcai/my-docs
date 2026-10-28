# Validation

Date: 2026-10-28.

- `npm run build`: 71 HTML pages generated.
- `npm run check:site`: 68 unique books; 729 local links and asset references verified.
- `npm run check:browser`: pagination, URL state, category deep links, both library views,
  author search, full-text search, empty results, reading content and TOC all passed.
- Responsive browser checks: 320, 375, 768, 1280 and 1920px; no horizontal overflow.
- All library entries and reading content remain available with JavaScript disabled.
- Hallmark homepage sweep with rendered desktop and phone screenshots: 0 FAIL, 0 open
  REFLEX, 0 WARN. Two short introductory text measure warnings dismissed on record.
- Hallmark library and reading-view sweep in app scope: 0 FAIL, 0 open REFLEX, 0 WARN.
- Independent hero review: two findings resolved by tightening the hero and bringing
  the reading index into view.
- Independent finish review: one finding resolved by adding the Riso ink offset once
  in the hero and restrained grain on pink bands. Fresh reader images confirm the
  side-by-side cover and collapsed mobile directory.
- No stand-in images, empty material slots, fabricated claims or altered source notes.

Book covers are referenced from original metadata. The image fallback shows the
real title and author when an external cover cannot load.

The personal Pages deployment publishes only `dist`, excluding Obsidian settings,
plugins, trash, source notes and development tooling.
