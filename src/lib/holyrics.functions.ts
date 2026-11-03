import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { HolyricsImage, ProjectionState } from "@/lib/types";

const BASE_URL = "https://api.holyrics.com.br/request/";

type Ctx = { supabase: { from: (t: "holyrics_configs") => any } };

async function loadConfig(context: Ctx) {
  const { data, error } = await context.supabase
    .from("holyrics_configs")
    .select("api_key,server_token")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Holyrics não está configurado");
  return { apiKey: data.api_key as string, serverToken: data.server_token as string };
}

type Envelope = { status?: string; data?: unknown; error?: string | { message?: string } };

async function post(context: Ctx, action: string, body: unknown): Promise<Envelope> {
  const cfg = await loadConfig(context);
  const res = await fetch(BASE_URL + action, {
    method: "POST",
    headers: { "Content-Type": "application/json", api_key: cfg.apiKey, token: cfg.serverToken },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: Envelope;
  try {
    parsed = JSON.parse(text) as Envelope;
  } catch {
    throw new Error("Resposta inválida do Holyrics");
  }
  if (parsed.status !== "ok") {
    const e = parsed.error;
    throw new Error(
      typeof e === "string" ? e : (e?.message ?? "Erro desconhecido do Holyrics"),
    );
  }
  return parsed;
}

export const saveHolyricsConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { apiKey: string; serverToken: string }) => ({
    apiKey: String(i.apiKey ?? "").trim().slice(0, 500),
    serverToken: String(i.serverToken ?? "").trim().slice(0, 500),
  }))
  .handler(async ({ data, context }) => {
    if (!data.apiKey || !data.serverToken) throw new Error("Informe a chave e o token");
    const { error } = await context.supabase.from("holyrics_configs").upsert({
      owner_id: context.userId,
      api_key: data.apiKey,
      server_token: data.serverToken,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return null;
  });

export const getHolyricsConfigStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("holyrics_configs")
      .select("owner_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data !== null;
  });

export const listHolyricsImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HolyricsImage[]> => {
    const env = await post(context as Ctx, "GetImages", { include_thumbnail: true });
    if (!Array.isArray(env.data)) return [];
    return (env.data as Array<Record<string, unknown>>)
      .filter((i) => typeof i.name === "string" && i.name !== "")
      .map((i) => ({
        id: i.name as string,
        name: i.name as string,
        thumbnail: typeof i.thumbnail === "string" ? i.thumbnail : "",
      }));
  });

export const projectHolyricsImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { imageId: string }) => ({ imageId: String(i.imageId ?? "") }))
  .handler(async ({ data, context }) => {
    await post(context as Ctx, "ShowImage", { file: data.imageId });
    return null;
  });

export const holyricsAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { action: "next" | "previous" | "stop" }) => {
    if (!["next", "previous", "stop"].includes(i.action)) throw new Error("Ação inválida");
    return i;
  })
  .handler(async ({ data, context }) => {
    const map = { next: "ActionNext", previous: "ActionPrevious", stop: "CloseCurrentPresentation" };
    await post(context as Ctx, map[data.action], {});
    return null;
  });

export const getHolyricsProjectionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProjectionState | null> => {
    const env = await post(context as Ctx, "GetCurrentPresentation", {});
    const d = env.data as Record<string, unknown> | null | undefined;
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    return {
      itemName: typeof d.name === "string" ? d.name : "",
      slideNumber: typeof d.slide_number === "number" && d.slide_number >= 0 ? d.slide_number : 0,
    };
  });
