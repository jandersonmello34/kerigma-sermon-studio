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

export type HolyricsConfig = { apiKey: string; serverToken: string };
export type HolyricsImage = { id: string; name: string; thumbnail: string };
export type ProjectionState = { itemName: string; slideNumber: number };
