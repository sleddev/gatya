import { subjects } from '@/content/generated/manifest';

import { useDoc } from './theme';

const STAGES = [
  {
    title: 'Nyelv',
    q: 'Mit szabad leírni?',
    why: 'Megtanuljuk a jeleket és a szabályokat: mi a term, mi a formula, hogyan kell zárójelezni, mikor kötött egy változó. Itt még semmi sem igaz vagy hamis, csak jól vagy rosszul formált.',
    slugs: ['allitasok-es-nyelv', 'szerkezeti-fa-precedencia', 'kotott-es-szabad-valtozok'],
  },
  {
    title: 'Jelentés',
    q: 'Mikor igaz?',
    why: 'A formulák jelentést kapnak: egy interpretáció megmondja, miről beszélünk, és ebből kiszámolható, igaz-e a formula. Ebből jönnek a modell, az érvényes és a kielégíthető fogalmai.',
    slugs: ['interpretacio', 'kielegithetoseg'],
  },
  {
    title: 'Következtetés',
    q: 'Mi következik miből?',
    why: 'A cél, amiért az egész van: mikor helyes egy következtetés. A következményt igazságtáblával ellenőrizzük, és megtanuljuk a leggyakoribb törvényeket.',
    slugs: ['logikai-kovetkezmeny', 'nevezetes-torvenyek', 'kvantoros-torvenyek'],
  },
  {
    title: 'Tovább',
    q: 'Normálformák, kalkulus',
    why: 'Ami a félév hátralévő részében jön.',
    slugs: ['kovetkezik'],
  },
];

/** Where this page sits in the logic course: language → meaning → consequence. */
export function LogikaTerkep() {
  const { id, Link } = useDoc();
  const topics = subjects.find((s) => s.slug === 'logika')?.topics ?? [];
  const slug = id.split('/')[1] ?? '';
  const cur = Math.max(
    0,
    STAGES.findIndex((s) => s.slugs.includes(slug))
  );
  const stage = STAGES[cur];
  const title = (s: string) => topics.find((t) => t.slug === s)?.title ?? s;
  return (
    <nav className="roadmap" aria-label="A tárgy felépítése">
      <div className="stages">
        {STAGES.map((s, i) => (
          <Link key={s.title} href={`/logika/${s.slugs[0]}`} className={`stage${i === cur ? ' on' : i < cur ? ' done' : ''}`}>
            <b>
              {i + 1}. {s.title}
            </b>
            {s.q}
          </Link>
        ))}
      </div>
      <p className="why">
        <b>
          {cur + 1}. szakasz, {stage.title.toLowerCase()}:
        </b>{' '}
        {stage.why}
      </p>
      {stage.slugs.length > 1 ? (
        <ol className="here">
          {stage.slugs.map((s) => (
            <li key={s} className={s === slug ? 'cur' : undefined}>
              {s === slug ? (
                <>
                  {title(s)} <span className="you">← itt vagy</span>
                </>
              ) : (
                <Link href={`/logika/${s}`}>{title(s)}</Link>
              )}
            </li>
          ))}
        </ol>
      ) : null}
    </nav>
  );
}
