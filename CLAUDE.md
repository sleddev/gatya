# Gatya – notes for AI assistants

Expo (SDK 57) app + static website. Hungarian study content in MDX.

- Content: `content/<subject>/NN-slug.mdx` + `_tantargy.yml`. Authoring rules and all MDX components: `docs/TARTALOM.md`.
- `scripts/build-content.mjs` compiles MDX → `src/content/generated/` (gitignored) and validates links/components/LaTeX. Run `pnpm content` after editing content.
- Topic pages render through `src/content/ContentView.tsx` (`'use dom'`): DOM on web, webview on native. Widgets in `src/widgets/` are DOM-only React; native screens in `src/app/` use React Native components only.
- New MDX component: `src/widgets/<Name>.tsx` exporting `<Name>`, listed in `src/widgets/index.ts`.
- Pure logic lives in `src/lib/` with `node:test` tests (`pnpm test`); imports inside `src/lib` use explicit `.ts` extensions so Node can run them.
- Verify with `pnpm check` (typecheck, tests, web + Android export).
- On web, `<Link asChild>` children need flattened styles (`StyleSheet.flatten`).
