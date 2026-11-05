import { BookChapterSelect, ChapterText, type ReaderPos, VersionSelect, useChapterCount } from "@/components/bible/ChapterReader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type BibleVersion, formatReference } from "@/lib/bible";
import { useState } from "react";

export function BiblePickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (reference: string) => void;
}) {
  const [version, setVersion] = useState<BibleVersion>("nvi");
  const [pos, setPos] = useState<ReaderPos>({ book: 42, chapter: 3 });
  const [range, setRange] = useState<[number, number] | null>(null);
  const chapterCount = useChapterCount(version, pos.book);

  function click(v: number) {
    if (!range || range[0] !== range[1]) setRange([v, v]);
    else setRange([range[0], v]);
  }
  const lo = range ? Math.min(...range) : 0;
  const hi = range ? Math.max(...range) : 0;
  const reference = formatReference(pos.book, pos.chapter, range?.[0], range?.[1]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Escolher na Bíblia</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <VersionSelect value={version} onChange={setVersion} label="Versão" />
          <BookChapterSelect pos={pos} onChange={(p) => { setPos(p); setRange(null); }} chapterCount={chapterCount} />
        </div>
        <p className="text-xs text-muted-foreground">Toque no primeiro e no último versículo para marcar o trecho.</p>
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border p-3">
          <ChapterText version={version} pos={pos} selected={(n) => n >= lo && n <= hi} onVerseClick={click} />
        </div>
        <DialogFooter className="items-center gap-3 sm:justify-between">
          <span className="font-medium text-primary">{reference}</span>
          <Button type="button" onClick={() => { onPick(reference); onOpenChange(false); }}>
            Usar este texto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
