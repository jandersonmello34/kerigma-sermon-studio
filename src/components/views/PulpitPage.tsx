import { Button } from "@/components/ui/button";
import { useSermon } from "@/hooks/useSermons";
import { alertLevel, formatClock, type TimerAlert } from "@/lib/pulpit-timer";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Maximize, Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const borderClass: Record<TimerAlert, string> = {
  normal: "",
  warning: "pulpit-glow-warning",
  critical: "pulpit-glow-critical",
  over: "pulpit-glow-over",
};

const clockClass: Record<TimerAlert, string> = {
  normal: "text-foreground",
  warning: "text-[var(--pulpit-orange)]",
  critical: "text-destructive",
  over: "text-destructive",
};

export default function PulpitPage() {
  const { sermonId } = useParams({ strict: false }) as { sermonId: string };
  const navigate = useNavigate();
  const { data: sermon, isLoading } = useSermon(sermonId);

  const [total, setTotal] = useState(40 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [fontSize, setFontSize] = useState(22);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    if (sermon) setTotal(sermon.durationMinutes * 60);
  }, [sermon]);

  useEffect(() => {
    if (!running) { lastTick.current = null; return; }
    lastTick.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      setElapsed((e) => e + (now - (lastTick.current ?? now)) / 1000);
      lastTick.current = now;
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  // Keep the screen awake while the sermon is running.
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    return () => { void lock?.release(); };
  }, [running]);

  const remaining = total - elapsed;
  const level: TimerAlert = elapsed > 0 || running ? alertLevel(remaining) : "normal";
  const progress = Math.min(100, (elapsed / total) * 100);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }
  if (!sermon) {
    return <div className="p-10 text-center text-muted-foreground">Sermão não encontrado.</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-[60] transition-all duration-700", borderClass[level])} />

      <header className="border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Sair do modo púlpito"
            onClick={() => void navigate({ to: "/sermoes/$sermonId", params: { sermonId } })}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className={cn("font-mono text-4xl font-bold tabular-nums sm:text-5xl", clockClass[level], level === "critical" && "animate-pulse")}
            role="timer" aria-live="off">
            {formatClock(remaining)}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" onClick={() => setRunning((r) => !r)} aria-label={running ? "Pausar" : "Iniciar"}>
              {running ? <Pause className="size-5" /> : <Play className="size-5" />}
            </Button>
            <Button size="icon" variant="outline" aria-label="Zerar" onClick={() => { setRunning(false); setElapsed(0); }}>
              <RotateCcw className="size-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTotal((t) => Math.max(60, t - 60))}>−1 min</Button>
            <Button size="sm" variant="outline" onClick={() => setTotal((t) => t + 60)}>+1 min</Button>
            <Button size="sm" variant="outline" onClick={() => setTotal((t) => t + 300)}>+5 min</Button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button size="icon" variant="ghost" aria-label="Diminuir texto" onClick={() => setFontSize((f) => Math.max(14, f - 2))}><Minus className="size-4" /></Button>
            <span className="text-sm text-muted-foreground">A</span>
            <Button size="icon" variant="ghost" aria-label="Aumentar texto" onClick={() => setFontSize((f) => Math.min(48, f + 2))}><Plus className="size-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Tela cheia"
              onClick={() => void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}>
              <Maximize className="size-4" />
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-2 h-1.5 max-w-5xl overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full transition-all", level === "normal" ? "bg-primary" : level === "warning" ? "bg-[var(--pulpit-orange)]" : "bg-destructive")}
            style={{ width: `${progress}%` }} />
        </div>
        <p className="mx-auto mt-1 max-w-5xl text-xs text-muted-foreground">
          {level === "over" ? "Tempo esgotado" : level === "critical" ? "Faltam menos de 5 minutos — conclua" : level === "warning" ? "Faltam menos de 10 minutos" : `Tempo previsto: ${Math.round(total / 60)} min`}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-semibold">{sermon.title}</h1>
          {sermon.bibleReference && <p className="mt-1 text-primary">{sermon.bibleReference}</p>}
          <div className="mt-6 whitespace-pre-wrap leading-relaxed" style={{ fontSize }}>
            {sermon.body || "Este sermão ainda não tem conteúdo."}
          </div>
        </article>
      </main>
    </div>
  );
}
