export const SermonStatus = { draft: "draft", ready: "ready" } as const;
export type SermonStatus = (typeof SermonStatus)[keyof typeof SermonStatus];

export type Sermon = {
  id: string;
  title: string;
  body: string;
  bibleReference: string;
  theme: string;
  status: SermonStatus;
  createdAt: string;
  updatedAt: string;
};

export type SermonInput = Omit<Sermon, "id" | "createdAt" | "updatedAt">;
export type SermonUpdate = SermonInput;

export type SermonFilter = {
  search?: string | undefined;
  theme?: string | undefined;
  status?: SermonStatus | undefined;
};

export type Collection = { id: string; name: string; createdAt: string };

export type StructureSuggestion = { outline: string; summary: string };
export type ImprovementSuggestion = { issue: string; suggestion: string };
export type ReferenceSuggestion = { reference: string; reason: string };

export type IdeaInput = { idea: string; passage: string; occasion: string; duration: string };
export type SermonFormat = "expositivo" | "textual" | "tematico" | "biografico";
export type IdeaDirections = {
  passages: { reference: string; reason: string }[];
  context: string;
  relatedVerses: { reference: string; note: string }[];
  angles: { title: string; thesis: string; basis: string }[];
  suggestedFormat: SermonFormat;
  formatReason: string;
};
export type SermonDraft = { title: string; theme: string; bibleReference: string; body: string };

export type HolyricsConfig = { apiKey: string; serverToken: string };
export type HolyricsImage = { id: string; name: string; thumbnail: string };
export type ProjectionState = { itemName: string; slideNumber: number };
