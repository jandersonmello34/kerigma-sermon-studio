import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BIBLE_VERSIONS, BOOK_NAMES, type BibleVersion, useBible, useBibleBooks, useBibleChapter } from "@/lib/bible";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ReaderPos = { book: number; chapter: number };

export function BookChapterSelect({
  pos,
  onChange,
  chapterCount,
}: {
  pos: ReaderPos;
  onChange: (p: ReaderPos) => void;
  chapterCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={String(pos.book)} onValueChange={(v) => onChange({ book: Number(v), chapter: 1 })}>
        <SelectTrigger aria-label="Livro" className="h-9 w-44 rounded-lg bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {BOOK_NAMES.map((n, i) => (
            <SelectItem key={n} value={String(i)}>{n}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(pos.chapter)} onValueChange={(v) => onChange({ ...pos, chapter: Number(v) })}>
        <SelectTrigger aria-label="Capítulo" className="h-9 w-24 rounded-lg bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {Array.from({ length: Math.max(chapterCount, 1) }, (_, i) => (
            <SelectItem key={i} value={String(i + 1)}>{i + 1}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button" variant="outline" size="icon" aria-label="Capítulo anterior"
        disabled={pos.chapter <= 1}
        onClick={() => onChange({ ...pos, chapter: pos.chapter - 1 })}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        type="button" variant="outline" size="icon" aria-label="Próximo capítulo"
        disabled={pos.chapter >= chapterCount}
        onClick={() => onChange({ ...pos, chapter: pos.chapter + 1 })}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

export function VersionSelect({ value, onChange, label }: { value: BibleVersion; onChange: (v: BibleVersion) => void; label: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as BibleVersion)}>
      <SelectTrigger aria-label={label} className="h-9 w-64 rounded-lg bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BIBLE_VERSIONS.map((v) => (
          <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ChapterText({
  version,
  pos,
  selected,
  onVerseClick,
}: {
  version: BibleVersion;
  pos: ReaderPos;
  selected?: (verse: number) => boolean;
  onVerseClick?: (verse: number) => void;
}) {
  const { data: verses, isLoading, isError } = useBibleChapter(version, pos.book, pos.chapter);
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-4 w-full" />)}
      </div>
    );
  }
  if (isError || !verses) return <p className="text-sm text-destructive">Não foi possível carregar esta versão.</p>;
  return (
    <ol className="space-y-1.5 font-display text-[1.05rem] leading-relaxed">
      {verses.map((v, i) => {
        const n = i + 1;
        const isSel = selected?.(n) ?? false;
        return (
          <li key={n}>
            <button
              type="button"
              disabled={!onVerseClick}
              onClick={() => onVerseClick?.(n)}
              className={cn(
                "w-full rounded-md px-2 py-0.5 text-left transition-colors disabled:cursor-text",
                onVerseClick && "hover:bg-primary/10",
                isSel && "bg-primary/20 ring-1 ring-primary/50",
              )}
            >
              <sup className="mr-1.5 font-mono text-xs text-primary">{n}</sup>
              {v}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function useChapterCount(version: BibleVersion, book: number) {
  const { data: whole } = useBible(version);
  const { data: books } = useBibleBooks(version);
  return whole?.[book]?.chapters.length ?? books?.[book]?.chapters ?? 50;
}
