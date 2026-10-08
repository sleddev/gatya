// Every component that can be used as a tag in MDX content.
// To add one: create src/widgets/<Name>.tsx exporting `<Name>`, then add it here.
// (scripts/build-content.mjs checks MDX tags against the PascalCase file names in this folder.)
import { Besorolo } from './Besorolo';
import { Definicio } from './Definicio';
import { DiofantikusRacs } from './DiofantikusRacs';
import { EkvivalenciaTeszt } from './EkvivalenciaTeszt';
import { ElsorenduVizsgalo } from './ElsorenduVizsgalo';
import { EuklideszAlgoritmus } from './EuklideszAlgoritmus';
import { EuklideszTeglalap } from './EuklideszTeglalap';
import { Feladat } from './Feladat';
import { Figyelem } from './Figyelem';
import { FormulaMuhely } from './FormulaMuhely';
import { FuggvenyTranszformacio } from './FuggvenyTranszformacio';
import { HalmazKalkulator } from './HalmazKalkulator';
import { ImplikacioDiagram } from './ImplikacioDiagram';
import { IndukcioDomino } from './IndukcioDomino';
import { IndukcioEllenorzo } from './IndukcioEllenorzo';
import { KomplexMuveletek } from './KomplexMuveletek';
import { KomplexSik } from './KomplexSik';
import { KovetkezmenyEllenorzo } from './KovetkezmenyEllenorzo';
import { KvantorJatszoter } from './KvantorJatszoter';
import { Kviz } from './Kviz';
import { Lekepezes } from './Lekepezes';
import { Lepes } from './Lepes';
import { Lepesek } from './Lepesek';
import { LinearisKongruencia } from './LinearisKongruencia';
import { MaradekOra } from './MaradekOra';
import { MaradekosOsztas } from './MaradekosOsztas';
import { Megjegyzes } from './Megjegyzes';
import { Megoldas } from './Megoldas';
import { ModularisHatvany } from './ModularisHatvany';
import { Pelda } from './Pelda';
import { PolinomIllesztes } from './PolinomIllesztes';
import { PolinomVizsgalo } from './PolinomVizsgalo';
import { Primtenyezok } from './Primtenyezok';
import { RelacioFelfedezo } from './RelacioFelfedezo';
import { TermFa } from './TermFa';
import { Tetel } from './Tetel';
import { Tipp } from './Tipp';
import { VegyesSzorzat } from './VegyesSzorzat';
import { VektorLabor } from './VektorLabor';
import { VennDiagram } from './VennDiagram';

export const mdxComponents = {
  Besorolo,
  Definicio,
  DiofantikusRacs,
  EkvivalenciaTeszt,
  ElsorenduVizsgalo,
  EuklideszAlgoritmus,
  EuklideszTeglalap,
  Feladat,
  Figyelem,
  FormulaMuhely,
  FuggvenyTranszformacio,
  HalmazKalkulator,
  ImplikacioDiagram,
  IndukcioDomino,
  IndukcioEllenorzo,
  KomplexMuveletek,
  KomplexSik,
  KovetkezmenyEllenorzo,
  KvantorJatszoter,
  Kviz,
  Lekepezes,
  Lepes,
  Lepesek,
  LinearisKongruencia,
  MaradekOra,
  MaradekosOsztas,
  Megjegyzes,
  Megoldas,
  ModularisHatvany,
  Pelda,
  PolinomIllesztes,
  PolinomVizsgalo,
  Primtenyezok,
  RelacioFelfedezo,
  TermFa,
  Tetel,
  Tipp,
  VegyesSzorzat,
  VektorLabor,
  VennDiagram,
};
