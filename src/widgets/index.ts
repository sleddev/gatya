// Every component that can be used as a tag in MDX content.
// To add one: create src/widgets/<Name>.tsx exporting `<Name>`, then add it here.
// (scripts/build-content.mjs checks MDX tags against the PascalCase file names in this folder.)
import { Besorolo } from './Besorolo';
import { Definicio } from './Definicio';
import { EkvivalenciaTeszt } from './EkvivalenciaTeszt';
import { ElsorenduVizsgalo } from './ElsorenduVizsgalo';
import { EuklideszAlgoritmus } from './EuklideszAlgoritmus';
import { Feladat } from './Feladat';
import { Figyelem } from './Figyelem';
import { FormulaMuhely } from './FormulaMuhely';
import { HalmazKalkulator } from './HalmazKalkulator';
import { IndukcioDomino } from './IndukcioDomino';
import { IndukcioEllenorzo } from './IndukcioEllenorzo';
import { KomplexMuveletek } from './KomplexMuveletek';
import { KomplexSik } from './KomplexSik';
import { KovetkezmenyEllenorzo } from './KovetkezmenyEllenorzo';
import { KvantorJatszoter } from './KvantorJatszoter';
import { Kviz } from './Kviz';
import { Lepes } from './Lepes';
import { Lepesek } from './Lepesek';
import { LinearisKongruencia } from './LinearisKongruencia';
import { Megjegyzes } from './Megjegyzes';
import { Megoldas } from './Megoldas';
import { ModularisHatvany } from './ModularisHatvany';
import { Pelda } from './Pelda';
import { PolinomIllesztes } from './PolinomIllesztes';
import { PolinomVizsgalo } from './PolinomVizsgalo';
import { Primtenyezok } from './Primtenyezok';
import { RelacioFelfedezo } from './RelacioFelfedezo';
import { Tetel } from './Tetel';
import { Tipp } from './Tipp';
import { VegyesSzorzat } from './VegyesSzorzat';
import { VektorLabor } from './VektorLabor';
import { VennDiagram } from './VennDiagram';

export const mdxComponents = {
  Besorolo,
  Definicio,
  EkvivalenciaTeszt,
  ElsorenduVizsgalo,
  EuklideszAlgoritmus,
  Feladat,
  Figyelem,
  FormulaMuhely,
  HalmazKalkulator,
  IndukcioDomino,
  IndukcioEllenorzo,
  KomplexMuveletek,
  KomplexSik,
  KovetkezmenyEllenorzo,
  KvantorJatszoter,
  Kviz,
  Lepes,
  Lepesek,
  LinearisKongruencia,
  Megjegyzes,
  Megoldas,
  ModularisHatvany,
  Pelda,
  PolinomIllesztes,
  PolinomVizsgalo,
  Primtenyezok,
  RelacioFelfedezo,
  Tetel,
  Tipp,
  VegyesSzorzat,
  VektorLabor,
  VennDiagram,
};
