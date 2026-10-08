// Content blocks for MDX: definitions, theorems, examples, solutions, warnings.
// Each component is re-exported from its own PascalCase file so the content
// builder can validate the tag names used in MDX.
import { Children, isValidElement, useState, type ReactNode } from 'react';

function Callout({ kind, label, title, children }: { kind?: string; label: string; title?: ReactNode; children: ReactNode }) {
  return (
    <div className={`callout${kind ? ` ${kind}` : ''}`}>
      <span className="label">
        {label}
        {title ? <> · {title}</> : null}
      </span>
      {children}
    </div>
  );
}

export const DefinicioBlock = ({ cim, children }: { cim?: string; children: ReactNode }) => (
  <Callout label="Definíció" title={cim}>
    {children}
  </Callout>
);

export const TetelBlock = ({ cim, children }: { cim?: string; children: ReactNode }) => (
  <Callout kind="theorem" label="Tétel" title={cim}>
    {children}
  </Callout>
);

export const FigyelemBlock = ({ cim, children }: { cim?: string; children: ReactNode }) => (
  <Callout kind="warn" label="Figyelem" title={cim}>
    {children}
  </Callout>
);

export const TippBlock = ({ cim, children }: { cim?: string; children: ReactNode }) => (
  <Callout kind="tip" label="Tipp" title={cim}>
    {children}
  </Callout>
);

export const MegjegyzesBlock = ({ cim, children }: { cim?: string; children: ReactNode }) => (
  <Callout label="Megjegyzés" title={cim}>
    {children}
  </Callout>
);

export const OsszefoglaloBlock = ({ cim = 'Röviden', children }: { cim?: string; children: ReactNode }) => (
  <Callout kind="summary" label={cim}>
    {children}
  </Callout>
);

export const PeldaBlock = ({ cim, children }: { cim?: string; children: ReactNode }) => (
  <div className="example">
    <span className="label">Példa{cim ? ` · ${cim}` : ''}</span>
    {children}
  </div>
);

export const FeladatBlock = ({ cim, children }: { cim?: string; children: ReactNode }) => (
  <div className="example">
    <span className="label">Gyakorló feladat{cim ? ` · ${cim}` : ''}</span>
    {children}
  </div>
);

export const MegoldasBlock = ({ cim = 'Megoldás', children }: { cim?: string; children: ReactNode }) => (
  <details className="solution">
    <summary>{cim}</summary>
    <div className="inner">{children}</div>
  </details>
);

export const LepesekBlock = ({ children }: { children: ReactNode }) => (
  <div className="steps">
    {Children.map(children, (c) =>
      isValidElement(c) ? (
        <div className="step">
          <div>{c}</div>
        </div>
      ) : null
    )}
  </div>
);

export const LepesBlock = ({ children }: { children: ReactNode }) => <>{children}</>;

/** Single multiple-choice question. */
export function KvizBlock({
  kerdes,
  valaszok,
  helyes,
  magyarazat,
}: {
  kerdes: ReactNode;
  valaszok: string[];
  helyes: number;
  magyarazat?: ReactNode;
}) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="qi">
      <div className="q">{kerdes}</div>
      <div className="opts">
        {valaszok.map((v, i) => (
          <button
            key={i}
            type="button"
            className={`btn${pick === null ? '' : i === helyes ? ' right' : pick === i ? ' wrong' : ''}`}
            onClick={() => setPick(i)}>
            {v}
          </button>
        ))}
      </div>
      {pick !== null ? (
        <div className="why">
          {pick === helyes ? <span className="chip ok">helyes</span> : <span className="chip no">nem ez</span>}{' '}
          {magyarazat}
        </div>
      ) : null}
    </div>
  );
}
