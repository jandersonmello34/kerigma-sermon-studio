import { describe, expect, it } from "vitest";
import { matchesSearch } from "@/hooks/useSermons";
import { lines, splitFields } from "@/lib/ai-parse";
import type { Sermon } from "@/lib/types";

const s: Sermon = {
  id: "1",
  title: "A Graça",
  body: "Texto sobre fé",
  bibleReference: "Efésios 2:8",
  theme: "graça",
  status: "draft", durationMinutes: 40,
  createdAt: "",
  updatedAt: "",
};

describe("sermon search", () => {
  it("matches title, body or reference case-insensitively", () => {
    expect(matchesSearch(s, "graça")).toBe(true);
    expect(matchesSearch(s, "FÉ")).toBe(true);
    expect(matchesSearch(s, "efésios")).toBe(true);
    expect(matchesSearch(s, "amor")).toBe(false);
  });
});

describe("AI reply parsing", () => {
  it("keeps only lines with exactly two ||| fields", () => {
    expect(splitFields("João 3:16 ||| amor de Deus")).toEqual(["João 3:16", "amor de Deus"]);
    expect(splitFields("sem separador")).toBeNull();
    expect(splitFields("a ||| b ||| c")).toBeNull();
    expect(lines("x\n\n  y \r\n")).toEqual(["x", "y"]);
  });
});
