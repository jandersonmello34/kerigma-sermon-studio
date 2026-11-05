import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { lines, splitFields } from "@/lib/ai-parse";
import { runChat } from "@/lib/ai-gateway.server";
import type {
  ImprovementSuggestion,
  ReferenceSuggestion,
  StructureSuggestion,
} from "@/lib/types";

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
