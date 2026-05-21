# Pre-Build Release Checklist

Date: 2026-05-21

Scope reviewed: `G:\Sistema de Prospectar Marcos Hilario\Macro Envio Masivo Whatsapp`

This checklist is for the final gate before creating a new repository and running a safe Vercel preview workflow. No Git, Vercel, build, deploy, scanner, WhatsApp, or messaging action was executed during this review.

## Executive Verdict

Status for the Next.js app root: **ready for Marcos-authorized local build**.

Important boundary: the app root is `Macro Envio Masivo Whatsapp`, not the parent folder `G:\Sistema de Prospectar Marcos Hilario`. The parent folder still contains real operational data folders/files and must not be used as the new repository root or Vercel project root.

If Marcos creates the new repo from `Macro Envio Masivo Whatsapp`, the project is clean enough to run:

```powershell
npm run build
```

Only run this after Marcos explicitly authorizes build validation.

## Data Safety Gate

### 1. Root tracker file

Result: **pass for app root**.

`prospectos_luma_premium_rd_tracker_whatsapp.xlsx` was not found in the app root.

Note: real-looking copies were found outside the app root, under sibling/parent-level data locations. Keep those outside the future repo/deploy root.

### 2. CSV/XLS/XLSX inside project

Result: **pass for app root**.

No `.csv`, `.xls`, or `.xlsx` files were found under the app root after excluding `node_modules`, `.next`, `dist`, and `build`.

### 3. `data_normalized` inside project

Result: **pass for app root**.

No `data_normalized` directory was found under the app root.

Note: `G:\Sistema de Prospectar Marcos Hilario\data_normalized` exists in the parent folder. Do not initialize Git or deploy from the parent folder.

### 4. Real lead JSON

Result: **pass for app root**.

Only technical JSON files were found outside ignored runtime/dependency folders:

- `package.json`
- `package-lock.json`
- `tsconfig.json`

No lead/prospect/contact/audit JSON export was found in the app root.

## Ignore Protection Gate

Result: **pass**.

`.gitignore` protects:

- `.env*` while allowing `.env.example`
- `.vercel`
- `.next`, `node_modules`, build output and caches
- `data_normalized`, `data`, backups, exports, logs
- CSV/XLS/XLSX files
- lead/prospect/contact/audit JSON patterns
- localStorage dumps
- screenshots/videos/recordings that may contain real data

`.vercelignore` protects:

- `.env`, `.env.local`, `.env.*`
- `.git`, `.vercel`, `.next`, `node_modules`
- `data_normalized`, `data`, backups, exports, logs
- CSV/XLS/XLSX files
- lead/prospect/contact/audit JSON patterns
- screenshots/videos/recordings
- local assistant notes

These protections are suitable for a safe preview payload, assuming the repo/deploy root is the app root.

## Dynamic Route Gate

Result: **pass conceptually**.

Reviewed routes:

- `/`
- `/console`
- `/console/[workspaceSlug]`
- `/console/[workspaceSlug]/seguimiento`
- `/console/[workspaceSlug]/propuestas`
- `/console/[workspaceSlug]/configuracion`
- `/console/[workspaceSlug]/importar`
- `/console/[workspaceSlug]/prospecto/[leadId]`
- `/console/[workspaceSlug]/lote/[batchId]`
- `/console/[workspaceSlug]/nicho/[nicheId]`

Findings:

- Root routes redirect to `/console/luma-premium`.
- Dynamic route pages use async `params` compatible with the current Next.js app router pattern.
- Route params are passed into `LumaOutreachConsole`, a client component.
- Unknown workspace slugs fall back to the default workspace config with the requested slug.
- Unknown niche IDs fall back to `all`.
- Lead and batch route IDs are contextual UI state only; they do not trigger server-side data loading.
- No dynamic route requires real local files to render.
- WhatsApp links are only opened by explicit user interaction inside the UI; no route opens WhatsApp automatically.

Remaining validation: run `npm run build` after authorization to let Next.js perform the real compile check.

## `package.json` Gate

Result: **pass**.

Package reviewed:

- `name`: `luma-outreach-console`
- `private`: `true`
- `build`: `next build`
- `lint`: `eslint`
- no deploy script
- no push script
- no scanner script
- no automated WhatsApp send script

Key runtime dependencies are aligned with the app behavior:

- `next@16.2.6`
- `react@19.2.4`
- `react-dom@19.2.4`
- `papaparse`
- `xlsx`
- `zod`
- `lucide-react`
- `framer-motion`

## Pre-Build Checklist

Before Marcos authorizes `npm run build`, confirm:

- You are in `G:\Sistema de Prospectar Marcos Hilario\Macro Envio Masivo Whatsapp`.
- Do not run from `G:\Sistema de Prospectar Marcos Hilario`.
- `.git` is still absent unless Marcos has explicitly authorized repo creation.
- `.vercel` is still absent unless Marcos has explicitly authorized Vercel linking.
- `.env`, `.env.local`, and `.env.*` are not being added or printed.
- No real CSV/XLS/XLSX files are inside the app root.
- No `data_normalized` directory is inside the app root.
- No real lead/prospect/contact/audit JSON export is inside the app root.
- `.gitignore` and `.vercelignore` remain in place.

Authorized command:

```powershell
npm run build
```

After build, inspect only the high-level result:

- Build completed successfully or failed with compile/type/lint output.
- No real data files were created.
- No WhatsApp window opened.
- No messages were sent.
- No Git/Vercel action happened.

## Recommendation

Proceed to local build only when Marcos authorizes it.

Recommended next action: Marcos authorizes `npm run build` from `G:\Sistema de Prospectar Marcos Hilario\Macro Envio Masivo Whatsapp`.

Do not create the new repository from the parent folder. If the parent folder must become the repo root for any reason, first move the real data folders completely outside that root and re-run this gate.
