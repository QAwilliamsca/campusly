# Guided document sources

`docs/Campusly-Live-Session-Idea-to-Live.docx` is generated, not hand-edited.

- `capture-screens.cjs` — signs in as each demo role and screenshots every screen into `docs/guide-img/`
  (needs `pnpm dev` running; paces sign-ins because of the 5/min rate limit).
- `build-guide.cjs` — builds the .docx from those screenshots and `docs/deploy/img/`.

```bash
cd docs/guide-src && npm init -y && npm install docx@9      # once; or point NODE_PATH at a folder that has docx
PROJECT="$(cd ../.. && pwd)" node capture-screens.cjs      # optional: refresh screenshots
PROJECT="$(cd ../.. && pwd)" node build-guide.cjs
```
To append a section (e.g. the live-session features), add it before "Appendices" in `build-guide.cjs` and rebuild.
