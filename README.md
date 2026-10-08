# 🩳 Gatya

Study notes with interactive exercises for the first semester of the
*programtervező informatikus BSc* at the University of Debrecen (Faculty of
Informatics). The content is in Hungarian and covers three subjects:

| subject | topics |
|---|---|
| **Diszkrét matematika** | sets, functions, induction, divisibility, Euclid, Diophantine equations, primes, congruences, complex numbers |
| **Az informatika logikai alapjai** | first-order language, structure trees, free/bound variables, interpretation, satisfiability, consequence, named laws, quantifier laws |
| **Számítógépes matematika és vizualizáció** | relations, polynomial fitting, roots/extrema/tangents, vectors, dot/cross/triple product, GeoGebra commands |

One codebase runs as:

- a **website**: a static export, with every page pre-rendered to HTML (GitHub Pages workflow included),
- an **Android/iOS app**: React Native through Expo. Content pages render in a webview via Expo DOM components, so the interactive widgets are the same code on every platform.

## Quick start

Requirements: Node ≥ 22.12 and pnpm (`corepack enable` or `npm i -g pnpm`).

```sh
pnpm install
pnpm start        # Expo dev server: press w for web, scan the QR code with Expo Go for a phone
pnpm web          # straight to the browser
```

`pnpm start` also watches `content/` and rebuilds when you save an MDX file.

## Writing content

All content lives in [`content/`](content), one MDX file per topic:

```
content/
  dimat/
    _tantargy.yml            subject title, colour, lecturer, intro
    01-halmazok.mdx          one topic = one page (the number sets the order)
    02-fuggvenyek.mdx
  logika/ …
  szmv/ …
```

A topic file is Markdown with LaTeX math (`$a \mid b$`, `$$…$$`) and components:

```mdx
---
cim: Kongruenciák
osszefoglalo: Egy mondat a témáról (lista nézetben és keresőben látszik).
allapot: kimaradt          # kimaradt | ismetles | talan | kovetkezo
kulcsszavak: [kongruencia, modulus]
---

## Definíció

<Definicio>
$a \equiv b \pmod m$, ha $m \mid a - b$.
</Definicio>

<LinearisKongruencia a={12} b={8} m={16} />
```

**The full authoring guide, with every component and its props, is in
[docs/TARTALOM.md](docs/TARTALOM.md)** (in Hungarian).

`pnpm content` validates everything and fails with `file:line` errors on:
broken internal links (including `#heading` anchors), unknown components,
invalid frontmatter, and LaTeX that KaTeX can't render.

## Scripts

| command | what it does |
|---|---|
| `pnpm start` / `web` / `android` / `ios` | dev server plus content watcher |
| `pnpm content` | build and validate content once |
| `pnpm typecheck` | content + TypeScript |
| `pnpm test` | unit tests for the math/logic engines (`src/lib/*.test.ts`) |
| `pnpm build:web` | static site in `dist/` |
| `pnpm check` | everything CI runs: typecheck, tests, web and Android bundles |
| `pnpm icons` | regenerate app icons from `assets/brand/shorts.svg` |

## Deploying

### Website

`.github/workflows/ci.yml` runs the checks on every push and PR. On `main` it
builds the site and publishes it to GitHub Pages at
`https://<user>.github.io/<repo>/`. To enable it, go to the repository's
**Settings → Pages → Source** and choose **GitHub Actions**.

Any static host works. Build with `pnpm build:web` and upload `dist/`. Set
`GATYA_BASE_URL=/subpath` if the site isn't served from the domain root. The
host has to serve `/a/b` from `a/b.html`; GitHub Pages, Netlify, Cloudflare
Pages and Vercel all do this by default.

### Apps

- **Try it:** `pnpm start` and open the QR code in [Expo Go](https://expo.dev/go).
- **Installable builds** with [EAS](https://docs.expo.dev/build/introduction/):
  `pnpm dlx eas-cli build -p android --profile preview` produces an APK you can
  install directly; the `production` profile is for the stores. The `postinstall`
  script generates the content on the build server.

## How it works

```
content/*.mdx ──scripts/build-content.mjs──▶ src/content/generated/
                                              ├─ mdx/<subject>/<topic>.ts   compiled MDX (React)
                                              ├─ manifest.ts                navigation, headings
                                              ├─ registry.ts                topic id → component
                                              └─ search.ts                  search index (per section)

src/app/                 Expo Router screens (native UI): home, subject, topic, search
src/content/ContentView  'use dom' component: renders a topic's MDX (DOM on web, webview on native)
src/widgets/             components usable in MDX (content blocks + interactive widgets)
src/lib/                 pure math/logic engines (parser, number theory, polynomials) + tests
```

- MDX is compiled ahead of time (remark-math → KaTeX with MathML output, so no
  fonts or CSS are needed), which keeps Metro configuration standard.
- Navigation uses native stack screens. On wide web screens there is a
  permanent sidebar instead.
- Progress ("megtanultam") is stored per device in AsyncStorage
  (localStorage on the web).

## Credits

- 🩳 icon: [Twemoji](https://github.com/jdecked/twemoji), © Twitter, Inc. and
  other contributors, [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Content is based on the 2026 autumn lecture and lab materials of the courses
  above. Exercise numbers refer to *Feladatsor_2026.pdf*. The course PDFs are
  not part of this repository.

Code: MIT (see [LICENSE](LICENSE)).
