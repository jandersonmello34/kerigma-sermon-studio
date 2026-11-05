import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateSermon } from "@/hooks/useSermons";
import { importSermon } from "@/lib/ai-wizard.functions";
import { SermonStatus } from "@/lib/types";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ChevronRight, FileUp, Loader2, PenLine, Sprout } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX = 10 * 1024 * 1024;
const TEXT_EXT = /\.(txt|md|markdown|rtf|html?|csv)$/i;

function readDataUrl(file: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Não foi possível ler o arquivo"));
    r.readAsDataURL(file);
  });
}

async function toPayload(file: File) {
  const name = file.name;
  if (file.size > MAX) throw new Error("Arquivo muito grande (máx. 10 MB)");
  if (file.type === "application/pdf" || /\.pdf$/i.test(name))
    return { filename: name, mimeType: "application/pdf", dataUrl: await readDataUrl(file) };
  if (file.type.startsWith("image/"))
    return { filename: name, mimeType: file.type, dataUrl: await readDataUrl(file) };
  if (/\.docx$/i.test(name)) {
    const mammoth = (await import("mammoth/mammoth.browser")) as unknown as {
      extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    };
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { filename: name, mimeType: "text/plain", text: value };
  }
  if (file.type.startsWith("text/") || TEXT_EXT.test(name)) {
    let text = await file.text();
    if (/\.html?$/i.test(name)) text = new DOMParser().parseFromString(text, "text/html").body.innerText;
    return { filename: name, mimeType: "text/plain", text };
  }
  throw new Error("Formato não suportado. Use PDF, DOCX, TXT, MD ou imagem.");
}

export function CreateSermonDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const runImport = useServerFn(importSermon);
  const createSermon = useCreateSermon();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const payload = await toPayload(file);
      const d = await runImport({ data: payload });
      const id = await createSermon.mutateAsync({ ...d, status: SermonStatus.draft });
      toast.success("Esboço importado! Revise o texto.");
      onOpenChange(false);
      void navigate({ to: "/sermoes/$sermonId", params: { sermonId: id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao importar");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      if (photoRef.current) photoRef.current.value = "";
    }
  }

  const options = [
    { icon: PenLine, title: "Criar manualmente", desc: "Começar uma mensagem em branco",
      onClick: () => { onOpenChange(false); void navigate({ to: "/sermoes/$sermonId", params: { sermonId: "novo" } }); } },
    { icon: Sprout, title: "Criar esboço com IA", desc: "Florescer uma ideia passo a passo",
      onClick: () => { onOpenChange(false); void navigate({ to: "/sermoes/florescer" }); } },
    { icon: Camera, title: "Importar esboço por foto", desc: "Fotografe o esboço escrito à mão", onClick: () => photoRef.current?.click() },
    { icon: FileUp, title: "Importar esboço por arquivo", desc: "PDF, DOCX, TXT e outros documentos", onClick: () => fileRef.current?.click() },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-md rounded-2xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Como quer criar?</DialogTitle>
        </DialogHeader>
        {busy ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="font-medium">Lendo seu esboço…</p>
            <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((o) => (
              <button key={o.title} type="button" onClick={o.onClick}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-background p-4 text-left transition-smooth hover:border-primary/50">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <o.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{o.title}</span>
                  <span className="block text-sm text-muted-foreground">{o.desc}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" hidden aria-label="Arquivo do esboço"
          accept=".pdf,.docx,.txt,.md,.markdown,.rtf,.html,.htm,application/pdf,text/*,image/*"
          onChange={(e) => void handleFile(e.target.files?.[0])} />
        <input ref={photoRef} type="file" hidden aria-label="Foto do esboço" accept="image/*" capture="environment"
          onChange={(e) => void handleFile(e.target.files?.[0])} />
      </DialogContent>
    </Dialog>
  );
}
