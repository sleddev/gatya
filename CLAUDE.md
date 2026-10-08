# Gatya – notes for AI assistants

Expo (SDK 57) app + static website. Hungarian study content in MDX.

- Content: `content/<subject>/NN-slug.mdx` + `_tantargy.yml`. Authoring rules and all MDX components: `docs/TARTALOM.md`.
- `scripts/build-content.mjs` compiles MDX → `src/content/generated/` (gitignored) and validates links/components/LaTeX. Run `pnpm content` after editing content.
- Topic pages render through `src/content/ContentView.tsx` (`'use dom'`): DOM on web, webview on native. Widgets in `src/widgets/` are DOM-only React; native screens in `src/app/` use React Native components only.
- New MDX component: `src/widgets/<Name>.tsx` exporting `<Name>`, listed in `src/widgets/index.ts`.
- Pure logic lives in `src/lib/` with `node:test` tests (`pnpm test`); imports inside `src/lib` use explicit `.ts` extensions so Node can run them.
- Verify with `pnpm check` (typecheck, tests, web + Android export).
- Use `LinkRow` (`src/components/ui.tsx`) for in-app links, not `<Link asChild>` around a Pressable: on web that combination doesn't cancel the browser's navigation, so every click reloads the whole page.
- Navigation: `src/components/sidebar.tsx` is a fixed column on wide web layouts and the content of the hamburger drawer (`src/components/drawer.tsx`) on phones and in the app.
- Long inline formulas can't line-break; `ContentView` gives any that don't fit their own line with sideways scrolling (`.katex.wide`). Check new content at phone width (360px) for horizontal page scroll.
- Installed apps get JS/content changes as EAS Updates (runtime version policy `fingerprint`). Adding a package with native code needs a new build, so mention that when you add one.
