import { BiblePickerDialog } from "@/components/bible/BiblePickerDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSermon } from "@/hooks/useSermons";
import { exploreIdea, generateDraft } from "@/lib/ai-wizard.functions";
import { type IdeaDirections, type IdeaInput, type SermonFormat, SermonStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, FileText, Loader2, Sprout, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FORMATS: { id: SermonFormat; label: string; desc: string }[] = [
  { id: "expositivo", label: "Expositivo", desc: "Tópicos seguem o fluxo de uma passagem maior, desenvolvendo uma única ideia." },
  { id: "textual", label: "Textual", desc: "Divisões principais saem de um ou dois versículos densos." },
  { id: "tematico", label: "Temático", desc: "O tema organiza os tópicos, cada um com base em texto bíblico." },
  { id: "biografico", label: "Biográfico", desc: "Acompanha a trajetória de um personagem bíblico." },
];

function Steps({ step }: { step: number }) {
  const items = ["Ideia", "Direção", "Esboço"];
  return (
    <ol className="flex items-center gap-2">
      {items.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
              done && "border-primary/60 text-primary",
              active && "border-primary bg-primary text-primary-foreground",
              !done && !active && "border-border text-muted-foreground",
            )}>
              {done ? <Check className="size-4" /> : n}
            </span>
            <span className={cn("text-sm font-medium", active || done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {n < 3 ? <span className="h-px flex-1 bg-border" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-background p-4 text-left transition-smooth hover:border-primary/50",
        selected ? "border-primary bg-primary/10" : "border-border",
      )}
    >
      <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50")}>
        {selected ? <Check className="size-3" /> : null}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export default function IdeaWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<IdeaInput>({ idea: "", passage: "", occasion: "", duration: "" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dirs, setDirs] = useState<IdeaDirections | null>(null);
  const [passage, setPassage] = useState("");
  const [angle, setAngle] = useState<number | null>(null);
  const [format, setFormat] = useState<SermonFormat>("tematico");
  const [agreed, setAgreed] = useState(false);

  const explore = useServerFn(exploreIdea);
  const draft = useServerFn(generateDraft);
  const createSermon = useCreateSermon();

  const exploreM = useMutation({
    mutationFn: () => explore({ data: input }),
    onSuccess: (d) => {
      setDirs(d);
      setPassage(input.passage || d.passages[0]?.reference || "");
      setFormat(d.suggestedFormat);
      setAngle(null);
      setStep(2);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftM = useMutation({
    mutationFn: async () => {
      const a = angle !== null ? dirs?.angles[angle] : undefined;
      const d = await draft({
        data: {
          ...input,
          passage,
          angle: a ? `${a.title}: ${a.thesis}` : "",
          format,
        },
      });
      return createSermon.mutateAsync({ ...d, status: SermonStatus.draft, durationMinutes: parseInt(input.duration, 10) || undefined });
    },
    onSuccess: (id) => {
      toast.success("Rascunho criado! Agora desenvolva a mensagem.");
      void navigate({ to: "/sermoes/$sermonId", params: { sermonId: id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Voltar"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate({ to: "/sermoes" }))}>
          <ArrowLeft className="size-5" />
        </Button>
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sprout className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight">Florescer uma ideia</h1>
          <p className="text-sm text-muted-foreground">Da ideia inicial ao primeiro rascunho</p>
        </div>
      </header>
      <div className="mb-6"><Steps step={step} /></div>

      {step === 1 ? (
        <div className="space-y-4">
          <Card className="rounded-2xl border-border bg-card shadow-none">
            <CardContent className="space-y-3 p-5">
              <Label htmlFor="idea" className="flex items-center gap-2 text-base font-semibold">
                <Sprout className="size-4 text-primary" /> Qual é a sua ideia?
              </Label>
              <p className="text-sm text-muted-foreground">Escreva livremente. Pode ser um tema, uma passagem, uma inquietação — do jeito que estiver na sua cabeça agora.</p>
              <Textarea id="idea" rows={5} value={input.idea}
                onChange={(e) => setInput({ ...input, idea: e.target.value })}
                placeholder="Ex.: Quero pregar sobre perdão e estou pensando na passagem do ladrão na cruz." />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border bg-card shadow-none">
            <CardContent className="space-y-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opcional</p>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Texto bíblico</Label>
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="flex h-11 w-full items-center gap-3 rounded-lg border border-input bg-background px-3 text-left text-sm">
                  <BookOpen className="size-4 text-primary" />
                  <span className={cn("flex-1", !input.passage && "text-muted-foreground")}>{input.passage || "Escolher na Bíblia do app"}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
                {input.passage ? (
                  <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setInput({ ...input, passage: "" })}>Remover texto</button>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="occasion" className="text-xs uppercase tracking-wider text-muted-foreground">Ocasião / público</Label>
                <Input id="occasion" value={input.occasion} onChange={(e) => setInput({ ...input, occasion: e.target.value })} placeholder="Ex.: Culto de domingo à noite, jovens" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-xs uppercase tracking-wider text-muted-foreground">Duração aproximada</Label>
                <Input id="duration" value={input.duration} onChange={(e) => setInput({ ...input, duration: e.target.value })} placeholder="Ex.: 30 minutos" />
              </div>
            </CardContent>
          </Card>
          <Button type="button" size="lg" className="h-12 w-full rounded-xl text-base font-semibold"
            disabled={!input.idea.trim() || exploreM.isPending} onClick={() => exploreM.mutate()}>
            {exploreM.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {exploreM.isPending ? "Buscando direções…" : "Buscar direções"} <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : null}

      {step === 2 && dirs ? (
        <div className="space-y-4">
          <Card className="rounded-2xl border-border bg-card shadow-none">
            <CardContent className="space-y-3 p-5">
              <h2 className="flex items-center gap-2 font-semibold"><BookOpen className="size-4 text-primary" /> Texto bíblico</h2>
              <p className="text-sm text-muted-foreground">
                {input.passage ? "Seu texto e outras passagens que combinam com a ideia." : "Você não indicou um texto. Estas passagens combinam com a sua ideia — escolha uma ou siga com a sua própria."}
              </p>
              {dirs.passages.map((p) => (
                <Choice key={p.reference} selected={passage === p.reference} onClick={() => setPassage(p.reference)}>
                  <span className="block font-semibold">{p.reference}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{p.reason}</span>
                </Choice>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border bg-card shadow-none">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-semibold">Contexto da passagem</h2>
              <p className="leading-relaxed">{dirs.context}</p>
              <h3 className="pt-2 text-sm font-semibold text-muted-foreground">Textos relacionados</h3>
              <dl className="space-y-3">
                {dirs.relatedVerses.map((v) => (
                  <div key={v.reference} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                    <dt className="font-mono text-sm text-primary">{v.reference}</dt>
                    <dd className="text-sm">{v.note}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border bg-card shadow-none">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-semibold">Ângulo da mensagem</h2>
              <p className="text-sm text-muted-foreground">Escolha o ângulo que você quer seguir. São sugestões — a decisão é sua.</p>
              {dirs.angles.map((a, i) => (
                <Choice key={a.title} selected={angle === i} onClick={() => setAngle(i)}>
                  <span className="block font-semibold">{a.title}</span>
                  <span className="mt-1 block">{a.thesis}</span>
                  <span className="mt-2 block text-sm text-muted-foreground">{a.basis}</span>
                </Choice>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border bg-card shadow-none">
            <CardContent className="space-y-3 p-5">
              <h2 className="flex items-center gap-2 font-semibold"><FileText className="size-4 text-primary" /> Formato do sermão</h2>
              <p className="text-sm text-muted-foreground">
                Sugestão: <span className="text-primary">{FORMATS.find((f) => f.id === dirs.suggestedFormat)?.label}</span> — {dirs.formatReason}
              </p>
              {FORMATS.map((f) => (
                <Choice key={f.id} selected={format === f.id} onClick={() => setFormat(f.id)}>
                  <span className="block font-semibold">{f.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{f.desc}</span>
                </Choice>
              ))}
            </CardContent>
          </Card>
          <Button type="button" size="lg" className="h-12 w-full rounded-xl text-base font-semibold" onClick={() => setStep(3)}>
            Continuar <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <Card className="rounded-2xl border-border bg-card shadow-none">
            <CardContent className="space-y-3 p-5 leading-relaxed">
              <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-primary" /> Antes de gerar, leia com atenção</h2>
              <p>O que vem a seguir é apenas um <strong>ponto de partida</strong>. Não é uma pregação pronta.</p>
              <p>A mensagem deve ser buscada em <strong>oração</strong> e nas <strong>Escrituras</strong>. O estudo, a convicção e a direção espiritual são seus.</p>
              <p>O Kerigma apenas <strong>ajuda a organizar ideias</strong>. Ele não define o que você deve pregar e não afirma que algum conteúdo aqui veio de Deus.</p>
              <label className="flex items-start gap-3 pt-2 text-sm text-muted-foreground">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                Entendi que este esboço é um rascunho inicial e que a mensagem será desenvolvida por mim.
              </label>
            </CardContent>
          </Card>
          <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
            <p><span className="text-muted-foreground">Texto:</span> {passage || "livre"}</p>
            <p><span className="text-muted-foreground">Ângulo:</span> {angle !== null ? dirs?.angles[angle]?.title : "livre"}</p>
            <p><span className="text-muted-foreground">Formato:</span> {FORMATS.find((f) => f.id === format)?.label}</p>
          </div>
          <Button type="button" size="lg" className="h-12 w-full rounded-xl text-base font-semibold"
            disabled={!agreed || draftM.isPending} onClick={() => draftM.mutate()}>
            {draftM.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {draftM.isPending ? "Gerando rascunho…" : "Gerar rascunho de esboço"}
          </Button>
        </div>
      ) : null}

      <BiblePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onPick={(r) => setInput({ ...input, passage: r })} />
    </section>
  );
}
