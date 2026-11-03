import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { lines, splitFields } from "@/lib/ai-parse";
import type {
  ImprovementSuggestion,
  ReferenceSuggestion,
  StructureSuggestion,
} from "@/lib/types";

/** Streams one Responses call through the Lovable AI Gateway and returns the final text. */
async function runChat(prompt: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Assistência de IA não configurada");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: [{ role: "user", content: prompt }],
      reasoning: { effort: "low" },
      store: false,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error("Muitas solicitações. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    let msg = "";
    try {
      msg = ((await res.json()) as { error?: { message?: string } }).error?.message ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(msg || `A assistência de IA falhou (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as { type?: string; delta?: string; response?: { error?: { message?: string } } };
        if (evt.type === "response.output_text.delta" && evt.delta) text += evt.delta;
        if (evt.type === "response.failed") throw new Error(evt.response?.error?.message || "A assistência de IA falhou");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (!text.trim()) throw new Error("A assistência de IA não retornou nenhum texto");
  return text;
}

export const generateSermonOutline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { title: string; theme: string; body: string }) => ({
    title: String(i.title ?? "").slice(0, 500),
    theme: String(i.theme ?? "").slice(0, 500),
    body: String(i.body ?? "").slice(0, 50000),
  }))
  .handler(async ({ data }): Promise<StructureSuggestion> => {
    const prompt =
      "Você é um assistente de homilética que ajuda pregadores a estruturar sermões em português do Brasil.\n" +
      "Com base no título, tema e corpo abaixo, proponha uma estrutura de pregação clara e fiel ao texto.\n\n" +
      `Título: ${data.title}\nTema: ${data.theme}\nCorpo atual:\n${data.body}\n\n` +
      "Responda EXATAMENTE em duas linhas, sem nenhum texto adicional:\n" +
      "Linha 1: o esboço estruturado, com introdução, pontos principais e conclusão, usando ' - ' para separar os itens.\n" +
      "Linha 2: um resumo de uma frase sobre a mensagem central.\n" +
      "Não use marcadores de lista, numeração, títulos de seção nem crases.";
    const ls = lines(await runChat(prompt));
    if (ls.length < 2) throw new Error("A assistência de IA retornou um esboço em formato inesperado");
    return { outline: ls[0] ?? "", summary: ls[1] ?? "" };
  });

export const suggestSermonImprovements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { body: string }) => ({ body: String(i.body ?? "").slice(0, 50000) }))
  .handler(async ({ data }): Promise<ImprovementSuggestion[]> => {
    const prompt =
      "Você é um assistente de homilética que revisa sermões em português do Brasil.\n" +
      "Analise o corpo do sermão abaixo e aponte de 3 a 5 melhorias de clareza e estrutura.\n\n" +
      `Corpo do sermão:\n${data.body}\n\n` +
      "Responda com uma melhoria por linha, sem nenhum texto adicional.\n" +
      "Cada linha deve ter exatamente este formato, separando os campos com '|||':\n" +
      "problema ||| sugestão\n" +
      "Não use marcadores de lista, numeração, títulos de seção nem crases.";
    const out = lines(await runChat(prompt))
      .map(splitFields)
      .filter((x): x is [string, string] => x !== null)
      .map(([issue, suggestion]) => ({ issue, suggestion }));
    if (out.length === 0) throw new Error("A assistência de IA não retornou sugestões de melhoria válidas");
    return out;
  });

export const suggestSermonReferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { theme: string }) => ({ theme: String(i.theme ?? "").slice(0, 500) }))
  .handler(async ({ data }): Promise<ReferenceSuggestion[]> => {
    const prompt =
      "Você é um assistente de homilética que sugere referências bíblicas em português do Brasil.\n" +
      "Para o tema abaixo, sugira de 3 a 5 referências bíblicas relevantes.\n\n" +
      `Tema: ${data.theme}\n\n` +
      "Responda com uma referência por linha, sem nenhum texto adicional.\n" +
      "Cada linha deve ter exatamente este formato, separando os campos com '|||':\n" +
      "referência ||| motivo\n" +
      "Não use marcadores de lista, numeração, títulos de seção nem crases.";
    const out = lines(await runChat(prompt))
      .map(splitFields)
      .filter((x): x is [string, string] => x !== null)
      .map(([reference, reason]) => ({ reference, reason }));
    if (out.length === 0) throw new Error("A assistência de IA não retornou referências bíblicas válidas");
    return out;
  });
