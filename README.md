# Luma Outreach Console

Internal local-first outreach console for Marcos Hilario / Luma Premium.

The app is designed as a manual-safe SaaS-style console for prospect import, niche segmentation, daily batches, follow-up, proposals, and review. It does not send WhatsApp messages automatically, does not run scanners, and does not include production lead data for preview.

## Safe Local Run

Use the webpack dev script when Marcos authorizes local QA:

```powershell
npm run dev:webpack
```

Do not use plain `npm run dev` for this project while the local recovery plan is active.

## Preview Safety

Before any Vercel preview:

- Confirm `.git` and remote origin are correct.
- Confirm `.vercel` is not linked to an old project.
- Confirm no real CSV/XLSX/lead JSON files are included.
- Confirm `.gitignore` and `.vercelignore` exclude operational data.
- Run build only after Marcos explicitly authorizes it.

See:

- `docs/24_REPOSITORY_AND_VERCEL_SAFETY_AUDIT.md`
- `docs/25_SAFE_REPOSITORY_SETUP_PLAN.md`
- `docs/26_VERCEL_SAFE_PREVIEW_PLAN.md`

## Routes

- `/` redirects to `/console/luma-premium`
- `/console`
- `/console/[workspaceSlug]`
- `/console/[workspaceSlug]/nicho/[nicheId]`
- `/console/[workspaceSlug]/lote/[batchId]`
- `/console/[workspaceSlug]/prospecto/[leadId]`
- `/console/[workspaceSlug]/seguimiento`
- `/console/[workspaceSlug]/propuestas`
- `/console/[workspaceSlug]/importar`
- `/console/[workspaceSlug]/configuracion`
