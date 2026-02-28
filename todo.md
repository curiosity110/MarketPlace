Repo: C:\Users\georg\Documents\market-place-mkd

GOAL: Make next/image production-safe without breaking existing images.

Change next.config.ts:
- Remove remotePatterns allowing hostname "**" and http.
- Allow ONLY https.
- Derive allowed hostname from NEXT_PUBLIC_SUPABASE_URL:
  const supaHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null
- If missing, set remotePatterns = [] and console.warn during build.

Do NOT change UI.

VERIFY:
- pnpm build

OUTPUT:
- Show diff and final next.config.ts content.

codex need to try harder for this in order to continue with safe procedure
  - once domain is settle

-   edit design good infos hero 