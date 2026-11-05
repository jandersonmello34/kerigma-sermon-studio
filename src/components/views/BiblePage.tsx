import { BookChapterSelect, ChapterText, type ReaderPos, VersionSelect, useChapterCount } from "@/components/bible/ChapterReader";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BIBLE_VERSIONS, BOOK_NAMES, type BibleVersion } from "@/lib/bible";
import { useState } from "react";

export default function BiblePage() {
  const [version, setVersion] = useState<BibleVersion>("nvi");
  const [compare, setCompare] = useState(false);
  const [version2, setVersion2] = useState<BibleVersion>("acf");
  const [pos, setPos] = useState<ReaderPos>({ book: 42, chapter: 3 });
  const chapterCount = useChapterCount(version, pos.book);
  const label = (v: BibleVersion) => BIBLE_VERSIONS.find((x) => x.id === v)?.id.toUpperCase();

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Bíblia</h1>
        <p className="mt-1 text-sm text-muted-foreground">Leia e compare versões lado a lado.</p>
      </header>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/60 p-3">
        <VersionSelect value={version} onChange={setVersion} label="Versão" />
        <BookChapterSelect pos={pos} onChange={setPos} chapterCount={chapterCount} />
        <div className="ml-auto flex items-center gap-2">
          <Switch id="compare" checked={compare} onCheckedChange={setCompare} />
          <Label htmlFor="compare">Comparar</Label>
          {compare ? <VersionSelect value={version2} onChange={setVersion2} label="Segunda versão" /> : null}
        </div>
      </div>
      <h2 className="mb-4 font-display text-2xl font-semibold">
        {BOOK_NAMES[pos.book]} {pos.chapter}
      </h2>
      <div className={compare ? "grid gap-4 md:grid-cols-2" : ""}>
        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardContent className="p-5">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">{label(version)}</p>
            <ChapterText version={version} pos={pos} />
          </CardContent>
        </Card>
        {compare ? (
          <Card className="rounded-lg border-border bg-card shadow-none">
            <CardContent className="p-5">
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">{label(version2)}</p>
              <ChapterText version={version2} pos={pos} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
