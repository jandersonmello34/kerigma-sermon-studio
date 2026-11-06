import { useQuery } from "@tanstack/react-query";

export const BIBLE_VERSIONS = [
  { id: "nvi", label: "NVI — Nova Versão Internacional" },
  { id: "acf", label: "ACF — Almeida Corrigida Fiel" },
  { id: "aa", label: "AA — Almeida Revisada Imprensa Bíblica" },
  { id: "naa", label: "NAA — Nova Almeida Atualizada" },
  { id: "nvt", label: "NVT — Nova Versão Transformadora" },
  { id: "ntlh", label: "NTLH — Nova Tradução na Linguagem de Hoje" },
  { id: "ol", label: "OL — O Livro" },
  { id: "kja", label: "KJA — King James Atualizada" },
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

/** Versions served as one whole-Bible JSON file (thiagobodruk/biblia). */
const WHOLE_JSON_VERSIONS = new Set<BibleVersion>(["nvi", "acf", "aa"]);

/** Versions served per chapter by the public bolls.life API. */
const BOLLS_ID: Partial<Record<BibleVersion, string>> = {
  naa: "NAA",
  nvt: "NVT",
  ntlh: "NTLH",
  ol: "OL",
  kja: "KJA",
};

async function fetchBible(version: BibleVersion): Promise<BibleBook[]> {
  const res = await fetch(`https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/${version}.json`);
  if (!res.ok) throw new Error("Não foi possível carregar esta versão da Bíblia");
  const text = (await res.text()).replace(/^﻿/, "");
  return JSON.parse(text) as BibleBook[];
}

function stripMarkup(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("sup").forEach((el) => el.remove());
  return doc.body.textContent?.trim() ?? "";
}

type BollsBook = { bookid: number; name: string; chapters: number };

async function fetchBollsBooks(translation: string): Promise<BollsBook[]> {
  const res = await fetch(`https://bolls.life/get-books/${translation}/`);
  if (!res.ok) throw new Error("Não foi possível carregar os livros desta versão");
  return (await res.json()) as BollsBook[];
}

async function fetchBollsChapter(translation: string, book: number, chapter: number): Promise<string[]> {
  const res = await fetch(`https://bolls.life/get-chapter/${translation}/${book}/${chapter}/`);
  if (!res.ok) throw new Error("Não foi possível carregar este capítulo");
  const verses = (await res.json()) as { verse: number; text: string }[];
  return verses.map((v) => stripMarkup(v.text));
}

export function useBible(version: BibleVersion | null) {
  return useQuery({
    queryKey: ["bible", version],
    queryFn: () => fetchBible(version as BibleVersion),
    enabled: version !== null && WHOLE_JSON_VERSIONS.has(version),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Books metadata (chapter counts) for chapter-based versions. */
export function useBibleBooks(version: BibleVersion | null) {
  const bollsId = version ? BOLLS_ID[version] : undefined;
  return useQuery({
    queryKey: ["bible-books", version],
    queryFn: () => fetchBollsBooks(bollsId as string),
    enabled: version !== null && bollsId !== undefined,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Verses of one chapter (1-based book/chapter indexes, matching BOOK_NAMES order).
 * Whole-JSON versions read from the cached full Bible; the others fetch just the chapter.
 */
export function useBibleChapter(version: BibleVersion, book: number, chapter: number) {
  const whole = useBible(version);
  const bollsId = BOLLS_ID[version];
  const chapterQuery = useQuery({
    queryKey: ["bible-chapter", version, book, chapter],
    queryFn: () => fetchBollsChapter(bollsId as string, book + 1, chapter),
    enabled: bollsId !== undefined,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  if (bollsId !== undefined) return chapterQuery;
  return {
    ...whole,
    data: whole.data?.[book]?.chapters[chapter - 1] as string[] | undefined,
  };
}

/** "Tito 2:11-14" style reference from a 0-based book index, chapter and a verse range (1-based). */
export function formatReference(bookIndex: number, chapter: number, from?: number, to?: number): string {
  const name = BOOK_NAMES[bookIndex] ?? "";
  if (!from) return `${name} ${chapter}`;
  if (!to || to === from) return `${name} ${chapter}:${from}`;
  return `${name} ${chapter}:${Math.min(from, to)}-${Math.max(from, to)}`;
}
