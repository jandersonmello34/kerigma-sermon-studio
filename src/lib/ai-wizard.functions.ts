import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runJson, type InputPart } from "@/lib/ai-gateway.server";
import type { IdeaDirections, IdeaInput, SermonDraft } from "@/lib/types";

const str = { type: "string" } as const;
const obj = (props: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(props),
  properties: props,
});
const arr = (items: unknown) => ({ type: "array", items });

const draftSchema = obj({ title: str, theme: str, bibleReference: str, body: str });

const GUARD =
  "Você é um assistente de homilética em português do Brasil. Você apenas ajuda a organizar ideias: " +
  "nunca afirme que um conteúdo veio de Deus e sempre seja fiel ao texto bíblico.\n";

function cleanIdea(i: IdeaInput): IdeaInput {
  return {
    idea: String(i.idea ?? "").slice(0, 4000),
    passage: String(i.passage ?? "").slice(0, 200),
    occasion: String(i.occasion ?? "").slice(0, 300),
    duration: String(i.duration ?? "").slice(0, 100),
  };
}

function ideaBlock(i: IdeaInput) {
  return (
    `Ideia do pregador: ${i.idea}\n` +
    `Texto bíblico escolhido: ${i.passage || "(nenhum)"}\n` +
    `Ocasião / público: ${i.occasion || "(não informado)"}\n` +
    `Duração aproximada: ${i.duration || "(não informada)"}\n`
  );
}

export const exploreIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: IdeaInput) => {
    const c = cleanIdea(i);
    if (!c.idea.trim()) throw new Error("Escreva sua ideia primeiro");
    return c;
  })
  .handler(async ({ data }): Promise<IdeaDirections> => {
    const prompt =
      GUARD +
      "Ajude o pregador a escolher uma direção para a mensagem.\n\n" +
      ideaBlock(data) +
      "\nDevolva:\n" +
      "- passages: 4 passagens que combinam com a ideia (se ele já escolheu um texto, inclua-o primeiro), cada uma com o motivo.\n" +
      "- context: um parágrafo sobre o contexto histórico e literário da passagem (ou do tema, se não houver passagem).\n" +
      "- relatedVerses: 3 a 5 versículos relacionados com uma nota curta.\n" +
      "- angles: 4 ângulos possíveis, cada um com título curto, tese de uma frase e base bíblica/observação.\n" +
      "- suggestedFormat: um de expositivo, textual, tematico, biografico; e formatReason explicando a sugestão.";
    return runJson<IdeaDirections>(prompt, "idea_directions", obj({
      passages: arr(obj({ reference: str, reason: str })),
      context: str,
      relatedVerses: arr(obj({ reference: str, note: str })),
      angles: arr(obj({ title: str, thesis: str, basis: str })),
      suggestedFormat: { type: "string", enum: ["expositivo", "textual", "tematico", "biografico"] },
      formatReason: str,
    }));
  });

export const generateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: IdeaInput & { angle: string; format: string }) => ({
    ...cleanIdea(i),
    angle: String(i.angle ?? "").slice(0, 1000),
    format: String(i.format ?? "").slice(0, 50),
  }))
  .handler(async ({ data }): Promise<SermonDraft> => {
    const prompt =
      GUARD +
      "Monte um RASCUNHO de esboço (ponto de partida, não uma pregação pronta).\n\n" +
      ideaBlock(data) +
      `Ângulo escolhido: ${data.angle || "(livre)"}\nFormato: ${data.format || "temático"}\n\n` +
      "Devolva title, theme (uma ou duas palavras), bibleReference (passagem principal) e body em Markdown simples com: " +
      "## Introdução, ## pontos principais (cada um com texto-base, explicação e aplicação em tópicos), ## Conclusão e ## Apelo. " +
      "Ajuste o tamanho à duração informada.";
    return runJson<SermonDraft>(prompt, "sermon_draft", draftSchema);
  });

const IMPORT_PROMPT =
  GUARD +
  "Este é um sermão ou esboço importado pelo pregador. Transcreva o conteúdo fielmente, sem inventar nada, " +
  "organizando-o em Markdown simples (## para seções, - para tópicos). Identifique title, theme (uma ou duas palavras) " +
  "e bibleReference (passagem principal; vazio se não houver). Coloque o conteúdo completo em body.";

export const importSermon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { filename: string; mimeType: string; dataUrl?: string; text?: string }) => {
    const filename = String(i.filename ?? "arquivo").slice(0, 200);
    const mimeType = String(i.mimeType ?? "");
    const dataUrl = i.dataUrl ? String(i.dataUrl) : undefined;
    const text = i.text ? String(i.text).slice(0, 120000) : undefined;
    if (dataUrl && dataUrl.length > 14_000_000) throw new Error("Arquivo muito grande (máx. 10 MB)");
    if (!dataUrl && !text?.trim()) throw new Error("O arquivo está vazio");
    return { filename, mimeType, dataUrl, text };
  })
  .handler(async ({ data }): Promise<SermonDraft> => {
    const parts: InputPart[] = [{ type: "input_text", text: IMPORT_PROMPT }];
    if (data.text) parts.push({ type: "input_text", text: `Conteúdo de ${data.filename}:\n\n${data.text}` });
    else if (data.mimeType === "application/pdf" && data.dataUrl)
      parts.push({ type: "input_file", filename: data.filename, file_data: data.dataUrl });
    else if (data.mimeType.startsWith("image/") && data.dataUrl)
      parts.push({ type: "input_image", image_url: data.dataUrl });
    else throw new Error("Formato de arquivo não suportado");
    return runJson<SermonDraft>(parts, "sermon_import", draftSchema);
  });
