/** Server-only helper: streams one Responses call through the Lovable AI Gateway. */
export type InputPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string }
  | { type: "input_file"; filename: string; file_data: string };

export async function runChat(
  content: string | InputPart[],
  schema?: { name: string; schema: Record<string, unknown> },
): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Assistência de IA não configurada");
  const body: Record<string, unknown> = {
    model: "openai/gpt-6-astra",
    input: [{ role: "user", content }],
    reasoning: { effort: "low" },
    store: false,
    stream: true,
  };
  if (schema) body["text"] = { format: { type: "json_schema", name: schema.name, strict: true, schema: schema.schema } };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
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
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { error?: { message?: string } };
        };
        if (evt.type === "response.output_text.delta" && evt.delta) text += evt.delta;
        if (evt.type === "response.failed")
          throw new Error(evt.response?.error?.message || "A assistência de IA falhou");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (!text.trim()) throw new Error("A assistência de IA não retornou nenhum texto");
  return text;
}

export async function runJson<T>(content: string | InputPart[], name: string, schema: Record<string, unknown>): Promise<T> {
  const raw = await runChat(content, { name, schema });
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("A assistência de IA retornou uma resposta em formato inesperado");
  }
}
