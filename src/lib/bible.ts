import { useQuery } from "@tanstack/react-query";

export const BIBLE_VERSIONS = [
  { id: "nvi", label: "NVI — Nova Versão Internacional" },
  { id: "acf", label: "ACF — Almeida Corrigida Fiel" },
  { id: "aa", label: "AA — Almeida Revisada Imprensa Bíblica" },
] as const;
export type BibleVersion = (typeof BIBLE_VERSIONS)[number]["id"];

export const BOOK_NAMES = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel",
  "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Ester", "Jó", "Salmos", "Provérbios",
  "Eclesiastes", "Cânticos", "Isaías", "Jeremias", "Lamentações", "Ezequiel", "Daniel", "Oséias", "Joel", "Amós",
  "Obadias", "Jonas", "Miquéias", "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias",
  "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios",
  "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filemom",
  "Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas", "Apocalipse",
];

export type BibleBook = { abbrev: string; chapters: string[][] };

async function fetchBible(version: BibleVersion): Promise<BibleBook[]> {
  const res = await fetch(`https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/${version}.json`);
  if (!res.ok) throw new Error("Não foi possível carregar esta versão da Bíblia");
  const text = (await res.text()).replace(/^\uFEFF/, "");
  return JSON.parse(text) as BibleBook[];
}

export function useBible(version: BibleVersion | null) {
  return useQuery({
    queryKey: ["bible", version],
    queryFn: () => fetchBible(version as BibleVersion),
    enabled: version !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** "Tito 2:11-14" style reference from a 0-based book index, chapter and a verse range (1-based). */
export function formatReference(bookIndex: number, chapter: number, from?: number, to?: number): string {
  const name = BOOK_NAMES[bookIndex] ?? "";
  if (!from) return `${name} ${chapter}`;
  if (!to || to === from) return `${name} ${chapter}:${from}`;
  return `${name} ${chapter}:${Math.min(from, to)}-${Math.max(from, to)}`;
}
