<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Kerigma (migrated from Caffeine/ICP)
- Signed-in pages live under `src/routes/_authenticated/`; page bodies are in `src/components/views/` so routes stay thin.
- Sermons and collections are read/written from the browser client with owner-scoped RLS; AI and Holyrics calls go through `createServerFn` with `requireSupabaseAuth` because they need server keys or per-user stored credentials.
- Holyrics credentials are stored per user in `holyrics_configs` (original app stored one global config).
- AI calls share `src/lib/ai-gateway.server.ts` (`runChat`/`runJson` with strict json_schema); wizard and import live in `src/lib/ai-wizard.functions.ts` — one gateway client, structured replies.
- Bible text is fetched in the browser and cached forever by React Query — no server storage or key needed. NVI/ACF/AA come as whole-Bible JSON from thiagobodruk/biblia; NAA/NVT/NTLH/OL/KJA are fetched per chapter from the public bolls.life API (see src/lib/bible.ts).
