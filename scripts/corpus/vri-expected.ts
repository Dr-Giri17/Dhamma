/**
 * Reviewed VRI Mūla navigation boundary at the pinned tipitaka-xml revision.
 *
 * The source file suffix is deliberately not used to decide whether a work is
 * part of the navigation. Milindapañha and Peṭakopadesa are present in VRI's
 * Mūla navigation but have tradition-dependent canonical classifications.
 */

export type VriPitaka = "vinaya" | "sutta" | "abhidhamma";
export type VriCanonicalScope = "universally-canonical" | "tradition-dependent";

export interface ExpectedVriMulaSource {
  sourceFile: string;
  navigationSection: string;
  pitaka: VriPitaka;
  collection: string;
  workIdentity: string;
  expectedSegmentPresence: true;
  canonicalScope: VriCanonicalScope;
  canonicalScopeNote: string;
  importDisposition: "imported";
}

const UNIVERSAL_ROOT_FILES = [
  "abh01m.mul.xml", "abh02m.mul.xml", "abh03m1.mul.xml", "abh03m10.mul.xml",
  "abh03m11.mul.xml", "abh03m2.mul.xml", "abh03m3.mul.xml", "abh03m4.mul.xml",
  "abh03m5.mul.xml", "abh03m6.mul.xml", "abh03m7.mul.xml", "abh03m8.mul.xml",
  "abh03m9.mul.xml", "s0101m.mul.xml", "s0102m.mul.xml", "s0103m.mul.xml",
  "s0201m.mul.xml", "s0202m.mul.xml", "s0203m.mul.xml", "s0301m.mul.xml",
  "s0302m.mul.xml", "s0303m.mul.xml", "s0304m.mul.xml", "s0305m.mul.xml",
  "s0401m.mul.xml", "s0402m1.mul.xml", "s0402m2.mul.xml", "s0402m3.mul.xml",
  "s0403m1.mul.xml", "s0403m2.mul.xml", "s0403m3.mul.xml", "s0404m1.mul.xml",
  "s0404m2.mul.xml", "s0404m3.mul.xml", "s0404m4.mul.xml", "s0501m.mul.xml",
  "s0502m.mul.xml", "s0503m.mul.xml", "s0504m.mul.xml", "s0505m.mul.xml",
  "s0506m.mul.xml", "s0507m.mul.xml", "s0508m.mul.xml", "s0509m.mul.xml",
  "s0510m1.mul.xml", "s0510m2.mul.xml", "s0511m.mul.xml", "s0512m.mul.xml",
  "s0513m.mul.xml", "s0514m.mul.xml", "s0515m.mul.xml", "s0516m.mul.xml",
  "s0517m.mul.xml", "s0519m.mul.xml", "vin01m.mul.xml", "vin02m1.mul.xml",
  "vin02m2.mul.xml", "vin02m3.mul.xml", "vin02m4.mul.xml",
] as const;

export const EXPECTED_TRADITION_DEPENDENT_FILES = [
  "s0518m.nrf.xml",
  "s0520m.nrf.xml",
] as const;

function pitakaFor(sourceFile: string): VriPitaka {
  if (sourceFile.startsWith("vin")) return "vinaya";
  if (sourceFile.startsWith("abh")) return "abhidhamma";
  return "sutta";
}

function collectionFor(sourceFile: string, pitaka: VriPitaka): string {
  if (pitaka !== "sutta") return pitaka;
  const code = /^s(\d{2})/.exec(sourceFile)?.[1];
  return ({ "01": "dn", "02": "mn", "03": "sn", "04": "an", "05": "kn" } as Record<string, string>)[code ?? ""] ?? "sutta";
}

function navigationSectionFor(pitaka: VriPitaka, collection: string): string {
  const label = ({ vinaya: "Vinayapiṭaka", sutta: "Suttapiṭaka", abhidhamma: "Abhidhammapiṭaka" } as const)[pitaka];
  return collection === "kn"
    ? `Tipiṭaka (Mūla) > ${label} > Khuddakanikāya`
    : `Tipiṭaka (Mūla) > ${label}`;
}

function expectedSource(sourceFile: string, canonicalScope: VriCanonicalScope): ExpectedVriMulaSource {
  const pitaka = pitakaFor(sourceFile);
  const collection = collectionFor(sourceFile, pitaka);
  const workIdentity = sourceFile.replace(/\.(?:mul|nrf)\.xml$/i, "");
  return {
    sourceFile,
    navigationSection: navigationSectionFor(pitaka, collection),
    pitaka,
    collection,
    workIdentity,
    expectedSegmentPresence: true,
    canonicalScope,
    canonicalScopeNote: canonicalScope === "tradition-dependent"
      ? "Included in VRI Mūla navigation; canonical classification differs between traditional editions and classification systems."
      : "Treated as canonical within the reviewed VRI Mūla source scope.",
    importDisposition: "imported",
  };
}

export const EXPECTED_VRI_MULA_SOURCES: readonly ExpectedVriMulaSource[] = [
  ...UNIVERSAL_ROOT_FILES.map((sourceFile) => expectedSource(sourceFile, "universally-canonical")),
  ...EXPECTED_TRADITION_DEPENDENT_FILES.map((sourceFile) => expectedSource(sourceFile, "tradition-dependent")),
];

export const EXPECTED_CANONICAL_FILES = UNIVERSAL_ROOT_FILES;

export const EXPECTED_VISUDDHIMAGGA_FILES = [
  "e0101n.mul.xml",
  "e0102n.mul.xml",
] as const;
