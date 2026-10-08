# Tartalom írása

Minden tananyag a `content/` mappában van. Nem kell hozzá programozni: Markdown,
LaTeX és néhány kész komponens elég. Mentés után a `pnpm start` automatikusan
újraépíti a tartalmat.

## Felépítés

```
content/
  dimat/                       egy mappa = egy tantárgy (a mappa neve lesz az URL része)
    _tantargy.yml              a tantárgy adatai
    01-halmazok.mdx            egy fájl = egy téma (oldal)
    02-fuggvenyek.mdx
```

- A fájlnév formája `NN-kisbetus-slug.mdx`. A szám a sorrendet adja, a slug az
  URL-t: `content/dimat/01-halmazok.mdx` → `/dimat/halmazok`.
- Új tantárgy: új mappa egy `_tantargy.yml`-lel.
- Átnevezésnél figyelj: a régi linkek eltörnek. Ezt a build jelzi, lásd lent.

### `_tantargy.yml`

```yaml
cim: Diszkrét matematika      # kötelező
rovid: DiMat                  # kötelező, rövid név (jelvény, kereső)
szin: '#0C7768'               # kötelező, a tárgy színe világos módban
szin_sotet: '#3DBFA9'         # szín sötét módban
oktato: Aradi Bernadett
sorrend: 1                    # a tárgyak sorrendje a kezdőlapon
leiras: >-
  Néhány mondatos bevezető a tantárgy oldalán.
```

### A téma fejléce (frontmatter)

```yaml
---
cim: Kongruenciák és az Euler–Fermat-tétel      # kötelező
osszefoglalo: Egy-két mondat a témáról.
allapot: kimaradt                               # kimaradt | ismetles | talan | kovetkezo
kulcsszavak: [kongruencia, modulus, maradékosztály]
forras: DiMat_ea.pdf 32–35. dia · Feladatsor 3.26
---
```

Ha egy érték kettőspontot tartalmaz, tedd idézőjelbe:
`osszefoglalo: "Témák: a, b, c."`

Az `allapot` jelentése:

| érték | címke | mikor |
|---|---|---|
| `kimaradt` | kimaradt | a hiányzás alatt volt |
| `ismetles` | ismétlés | már volt, ismétlésnek |
| `talan` | talán kimaradt | nem biztos |
| `kovetkezo` | következik | előre néző oldal |

## Szöveg

Sima Markdown: `**félkövér**`, `*dőlt*`, felsorolás, táblázat (`| a | b |`),
`## Címsor`.

- A `##` címsorokból lesz az oldal tetején a tartalomjegyzék, és a keresés is
  ezek szerint bontja szakaszokra az oldalt. A `###` alcím.
- Címsorba ne tegyél képletet.
- A `<` és a `{` jelnek az MDX-ben külön jelentése van. Szövegben írd így:
  `$<$`, `$\{1, 2\}$`, vagy szavakkal.

### Képletek

LaTeX, KaTeX-szel: soron belül `$a \mid b$`, külön sorban:

```
$$
\varphi(m) = m \prod_{i=1}^{r} \left(1 - \frac{1}{p_i}\right)
$$
```

Rövidítések: `\N \Z \Q \R \C` → ℕ ℤ ℚ ℝ ℂ. A logika jelei: `\neg \wedge \vee
\supset \equiv \forall \exists \models \Leftrightarrow`.

### Linkek

Másik témára: `[Kongruenciák](/dimat/kongruenciak)`. Egy szakaszra:
`[...](/dimat/kongruenciak#maradekosztalyok)`. A szakasz azonosítója a címsor
ékezet nélkül, kisbetűvel, szóközök helyett kötőjellel, írásjelek nélkül (az
„Az Euler–Fermat-tétel” címsorból `az-eulerfermat-tetel` lesz). Nem kell fejből
tudni: ha elírod, a build hibát jelez, és kiírja az oldal összes azonosítóját.

## Tartalmi blokkok

```mdx
<Definicio cim="részhalmaz">
$A \subset B$, ha $A$ minden eleme $B$-nek is eleme.
</Definicio>
```

| komponens | mire | propok |
|---|---|---|
| `<Definicio>` | definíció | `cim` |
| `<Tetel>` | tétel | `cim` |
| `<Pelda>` | kidolgozott példa | `cim` |
| `<Feladat>` | gyakorló feladat (benne `<Megoldas>`) | `cim` |
| `<Megoldas>` | lenyitható megoldás | `cim` (alapból „Megoldás”) |
| `<Figyelem>` | tipikus hiba, csapda | `cim` |
| `<Tipp>` | hasznos trükk | `cim` |
| `<Megjegyzes>` | mellékes megjegyzés | `cim` |
| `<Lepesek>` + `<Lepes>` | számozott lépések | – |
| `<Osszefoglalo>` | „Röviden” doboz az oldal végére | `cim` (alapból „Röviden”) |
| `<Kviz>` | egy feleletválasztós kérdés | `kerdes`, `valaszok`, `helyes` (0-tól számolt index), `magyarazat` |

A nyitó és záró tag külön sorban legyen, köztük szabad Markdown és képlet:

```mdx
<Feladat cim="3.4">
Hány nullára végződik 100!?

<Megoldas>
$\lfloor 100/5 \rfloor + \lfloor 100/25 \rfloor = 24$.
</Megoldas>
</Feladat>
```

A `<Kviz>` attribútumaiban nem működik a `$...$`; ott Unicode-ot használj (ℝ, ≡, ⊃):

```mdx
<Kviz
  kerdes="Mi a p ∧ q ⊃ r formula fő logikai jele?"
  valaszok={["∧", "⊃"]}
  helyes={1}
  magyarazat="A ⊃ gyengébben köt, mint a ∧."
/>
```

## Interaktív eszközök

Minden propnak van alapértéke, tehát `<KomplexSik />` is működik.

### Diszkrét matematika

| komponens | mit csinál | propok |
|---|---|---|
| `<Lekepezes />` | nyíldiagram: függvény-e, injektív, szürjektív | `kezdo` (`nem-fuggveny`, `egyik-sem`, `injektiv`, `szurjektiv`, `bijektiv`, `ures`) |
| `<FuggvenyTranszformacio />` | a·f(b(x − c)) + d grafikonja, lépésekkel | `f` (`x2`, `abs`, `sqrt`, `x3`, `exp`, `sin`) |
| `<MaradekosOsztas />` | a = bq + r a számegyenesen | `a`, `b` |
| `<EuklideszTeglalap />` | euklideszi algoritmus négyzetekre vágott téglalappal | `a`, `b` |
| `<DiofantikusRacs />` | ax + by = c egyenes és rácspontjai | `a`, `b`, `c` |
| `<MaradekOra />` | maradékóra: osztályok, hatványok köre, φ(m) | `m`, `a`, `mod` (`osztalyok`, `hatvany`, `redukalt`), `modok` |
| `<VennDiagram />` | két halmaz műveleteinek színezése | `muvelet` (`unio`, `metszet`, `a-b`, `b-a`, `szimdiff`, `a-komp`, `demorgan-1`, `demorgan-2`), `muveletek` (lista) |
| `<HalmazKalkulator />` | halmazműveletek kiszámolása | `H`, `A`, `B` (vesszős lista) |
| `<Besorolo />` | elemek besorolása kategóriákba | `cim`, `utmutato`, `opciok` (lista), `elemek` (`{kerdes, helyes, miert}` lista) |
| `<IndukcioDomino />` | dominóelv animáció | – |
| `<IndukcioEllenorzo />` | indukciós állítás számszerű ellenőrzése | `allitas` (`osszeg`, `negyzetek`, `kobok`, `paratlan`, `szorzatok`, `faktorialis`, `oszt-6a`, `oszt-6b`, `oszt-5`, `oszt-4`) |
| `<EuklideszAlgoritmus />` | lnko lépésenként, Bézout, diofantikus egyenlet | `a`, `b`, `c` |
| `<Primtenyezok />` | kanonikus alak, d(n), φ(n), oszthatósági szabályok, lnko/lkkt | `n`, `m` |
| `<LinearisKongruencia />` | ax ≡ b (mod m) | `a`, `b`, `m` |
| `<ModularisHatvany />` | aᵏ mod m Euler–Fermattal | `a`, `k`, `m` |
| `<KomplexMuveletek />` | műveletek algebrai alakban | `z`, `w` (`[re, im]`) |
| `<KomplexSik />` | Gauss-sík: alakok, szorzás, hatvány, gyökök | `mod` (`egy`, `szorzas`, `hatvany`, `gyok`, `egyseg`), `modok`, `z`, `w`, `n` |

### Logika

| komponens | mit csinál | propok |
|---|---|---|
| `<FormulaMuhely />` | szerkezeti fa, igazságtábla, osztályozás | `formula`, `peldak` (`[[címke, formula], …]`), `fa`, `tabla` (bool) |
| `<ElsorenduVizsgalo />` | kötött/szabad változók színezése | `formula`, `peldak` |
| `<KovetkezmenyEllenorzo />` | Γ ⊨ A igazságtáblával | `premisszak` (lista), `kovetkezmeny`, `peldak` (bool) |
| `<EkvivalenciaTeszt />` | A ⇔ B? | `a`, `b`, `peldak` (bool) |
| `<LogikaTerkep />` | a tárgy térképe (nyelv → jelentés → következtetés), kiemeli az aktuális oldalt; minden logika-oldal elejére | – |
| `<Zarojelezo />` | zárójelezés precedencia szerint, lépésenként, a fő logikai jelig | `formula` |
| `<KisVilag />` | négyfős interpretáció, szerkeszthető; a formula kiértékelése lépésenként | `formula` |
| `<KielegithetosegAbra />` | érvényes / kielégíthető és cáfolható / kielégíthetetlen, és hova kerül ¬A | `formula` |
| `<TermFa />` | term vagy formula? színezett fa az előadás jeleivel | `kifejezes` |
| `<ImplikacioDiagram />` | A ⊃ B mint tartalmazás: modus ponens/tollens, láncszabály | `mod` (`implikacio`, `lanc`), `a`, `b` (A és B jelentése szöveggel) |
| `<KvantorJatszoter />` | interpretáció kis univerzumon | `resz` (`ketvaltozos`, `egyvaltozos`, `mindketto`) |

Formulák: `~ & | -> <->` vagy `¬ ∧ ∨ ⊃ ≡`; elsőrendűben `forall x`, `exists x`.
Változók: `x y z v w` (számmal is), a többi kisbetűs szó név.

### SzMV

| komponens | mit csinál | propok |
|---|---|---|
| `<RelacioFelfedezo />` | A × B rács, reláció, inverz | `A`, `B`, `feltetel` (`nagyobb`, `kisebb`, `egyenlo`, `nagyobbegyenlo`, `oszto`, `paros`, `a-k`, `b-k`, `osszeg-k`), `k` |
| `<PolinomIllesztes />` | polinom pontokon át | `pontok` (`[[x, y], …]`) |
| `<PolinomVizsgalo />` | gyökök, szélsőértékek, érintő | `fok` (2–4), `egyutthatok` (`[a, b, c, …]`) |
| `<VektorLabor />` | síkvektorok | `mod` (`pontok`, `osszeg`, `skalar`, `szorzat`), `modok` |
| `<VegyesSzorzat />` | vektoriális és vegyes szorzat | `a`, `b`, `c` (`[x, y, z]`) |

## Ellenőrzés

```sh
pnpm content
```

Hibát ad (fájl:sor megjelöléssel), ha:
- egy belső link vagy `#szakasz` nem létezik,
- ismeretlen komponenst használsz,
- a frontmatter hibás, vagy hiányzik a `cim`,
- egy képletet a KaTeX nem tud megjeleníteni.

A `pnpm start` futás közben is kiírja ugyanezeket.

## Új interaktív eszköz

1. Hozd létre: `src/widgets/UjEszkoz.tsx`, amely egy `UjEszkoz` nevű React-komponenst exportál. Ez sima DOM-os React, használhat `<canvas>`-t és `<svg>`-t; a közös keret a `Bench` a `src/widgets/ui.tsx`-ből.
2. Vedd fel a `src/widgets/index.ts` listájába.
3. A matematikát érdemes a `src/lib/`-be tenni, és tesztet írni hozzá (`*.test.ts`).
