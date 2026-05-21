# Repository and Vercel Safety Audit

Date: 2026-05-20

Scope: `G:\Sistema de Prospectar Marcos Hilario\Macro Envio Masivo Whatsapp`

## Executive Recommendation

Current recommendation: **not safe for preview yet** until Marcos confirms the repository path and real data handling.

Reason: this folder currently has **no `.git` repository**, no Vercel link, and one real-looking Excel prospect file in the project root. The safest path is to create a **new clean repository** only after confirming `.gitignore` exclusions and moving or leaving real data untracked.

## Git State

- `.git`: not present in this folder.
- `git status --short`: failed because this is not a Git repository.
- `git remote -v`: failed because this is not a Git repository.
- `git branch --show-current`: failed because this is not a Git repository.
- Remote origin detected: none.
- Current branch: none.

## Risk of Wrong Push

Immediate risk of pushing to the wrong remote from this folder: **low**, because there is no Git remote here.

Future risk: **medium/high** if Marcos initializes Git or copies this project into a folder already linked to an old repo. A new repo should be created deliberately and verified before any `git add`, `commit`, or `push`.

## Vercel State

- `.vercel`: not present.
- `.vercel/project.json`: not present.
- `vercel.json`: not present.
- Local Vercel project link detected: none.

Risk of deploying to an old linked Vercel project from this folder: **low right now**, because no `.vercel` link exists. Risk returns if this folder is copied into another linked workspace.

## Package and App Metadata

- Previous package name detected before this phase: `wa_vortex`.
- Current package name after cleanup: `luma-outreach-console`.
- App metadata title: `Luma Outreach Console`.
- App metadata description: `Prospeccion asistida, auditoria preliminar y seguimiento comercial by Luma Premium.`

## Scripts Audit

Detected package scripts:

- `dev`: starts Next dev with the default path. Do not use while the local recovery plan is active.
- `dev:webpack`: safe local QA command when Marcos authorizes.
- `dev:lowmem`: local low-memory fallback.
- `dev:safe`: local conservative dev fallback.
- `build`: allowed only when Marcos authorizes build validation.
- `start`: production server command after a build.
- `lint`: allowed only when Marcos authorizes lint validation.

No deploy script, push script, scanner script, or automated WhatsApp send script was detected in `package.json`.

## Sensitive or Real Data Detected

Detected inside the project folder:

- `prospectos_luma_premium_rd_tracker_whatsapp.xlsx` in the project root.
- `.next/` build/cache output.
- `node_modules/`.

No `.env`, `.env.local`, `.vercel/project.json`, or `vercel.json` was detected.

The Excel file should be treated as **real operational data** and should not be committed or deployed. `.gitignore` and `.vercelignore` now exclude `*.xlsx`, but the file still physically exists in the folder and should be moved out before a public preview workflow if Marcos wants a clean product package.

## Hardcoding / Legacy Naming Findings

Found and addressed in this phase:

- `package.json` and `package-lock.json` still used `wa_vortex`.
- `README.md` described WA Vortex and WhatsApp mass sending.
- UI showed a local absolute `G:\...data_normalized...` path as an import suggestion.

Remaining acceptable references:

- Documentation can mention old WA Vortex compatibility where it is historical context.
- Local development docs may mention local paths for Marcos, but these are not shown in the preview UI.

## Deploy Readiness Verdict

Status: **requires repo setup before preview**.

Required before any preview:

1. Confirm this folder should become the product repo.
2. Move real XLSX/CSV/prospect data outside the project or leave it ignored and verify it is untracked.
3. Initialize a new Git repo only after Marcos authorizes.
4. Add a new remote origin only after Marcos confirms the GitHub repo URL.
5. Link Vercel only to a new/approved Vercel project.
6. Run build only after Marcos authorizes.

Do not push or deploy from this folder until those steps are explicitly approved.
