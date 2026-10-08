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

`.github/workflows/ci.yml` runs the checks on every push and PR, then builds the
site and deploys it to [Cloudflare Pages](https://pages.cloudflare.com/): `main`
goes to production (`https://gatya.pages.dev`), and each pull request gets its own
preview URL.

One-time setup:

1. Create the Pages project: `pnpm dlx wrangler login`, then
   `pnpm dlx wrangler pages project create gatya --production-branch main`.
   If the name is taken, choose another and change `--project-name` in the workflow.
2. In the Cloudflare dashboard, create an API token with the **Cloudflare Pages: Edit**
   permission and copy your account ID.
3. Add both to the GitHub repository as the secrets `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID`.

To deploy by hand: `pnpm build:web && pnpm dlx wrangler pages deploy dist --project-name=gatya`.
A custom domain can be added under the project's **Custom domains** tab.

Any other static host works too: upload `dist/` after `pnpm build:web`. Set
`GATYA_BASE_URL=/subpath` if the site isn't served from the domain root (for
example GitHub Pages without a custom domain). The host has to serve `/a/b`
from `a/b.html`, and should serve `404.html` for unknown paths.

### Apps

- **Try it:** `pnpm start` and open the QR code in [Expo Go](https://expo.dev/go).
- **Installable builds** with [EAS](https://docs.expo.dev/build/introduction/):
  `pnpm dlx eas-cli build -p android --profile preview` produces an APK you can
  install directly; the `production` profile is for the stores. The `postinstall`
  script generates the content on the build server.

### Updating the installed app

Topics, widgets and other JavaScript changes reach installed apps as
over-the-air updates ([EAS Update](https://docs.expo.dev/eas-update/introduction/)),
with no new APK. The app checks for updates when it starts or comes back to the
foreground, downloads them in the background, and shows an *„Új tananyag
érkezett”* banner that reloads into the new version.

One-time setup:

1. `pnpm dlx eas-cli login`, then `pnpm dlx eas-cli init`. Paste the project ID
   it prints into `easProjectId` in `app.config.ts` and commit.
2. Build and install the APK once: `pnpm dlx eas-cli build -p android --profile preview`.
3. Create an access token at expo.dev → Account settings → Access tokens and
   add it to the GitHub repository as the `EXPO_TOKEN` secret.

After that, every push to `main` publishes the site *and* an app update. To
publish by hand: `pnpm dlx eas-cli update --channel preview --environment preview -m "..."`.

A new APK is only needed when native code changes: a new package with native
code, an Expo SDK upgrade, or app config such as the icon or app ID. The
`fingerprint` runtime version detects this, so an update is never sent to an
app build it would not run on.

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
