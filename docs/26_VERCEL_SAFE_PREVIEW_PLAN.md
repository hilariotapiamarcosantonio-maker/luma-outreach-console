# Vercel Safe Preview Plan

This is a future preview checklist. Nothing here was executed in this phase.

## What Can Be Deployed

- Next.js app source under `src/`.
- Public static assets that do not contain prospect data.
- Documentation that does not include secrets or real lead lists.
- Empty local-first Luma Outreach Console with 0 leads by default.
- Dynamic route shell for workspace/niche/batch/prospect/follow-up/proposals/import/settings.

## What Must Not Be Deployed

- `.env`, `.env.local`, `.env.*`.
- `.vercel`.
- `.next`.
- `node_modules`.
- CSV, XLSX, XLS files.
- Lead/prospect JSON exports.
- `data_normalized`.
- Real `audits.json` or audit exports containing phones/emails.
- Screenshots/videos showing real lead data.
- Backups, logs, localStorage dumps, or exported workspaces.

## Data Confirmation Before Preview

Run read-only checks before any build/deploy authorization:

```powershell
Get-ChildItem -Recurse -Force -File -Include *.csv,*.xlsx,*.xls,*.json,*.log,*.bak,*.backup,*.zip |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\' } |
  Select-Object FullName,Length,LastWriteTime
```

Then confirm:

- No real CSV/XLSX is staged.
- No real lead JSON is staged.
- No `.env` exists in the repo.
- `.gitignore` and `.vercelignore` exclude operational data.

## Safe Local Check Before Preview

Only after Marcos authorizes local QA:

```powershell
npm run dev:webpack
```

Only after Marcos authorizes build validation:

```powershell
npm run build
```

Do not run plain `npm run dev` while the local recovery plan is active.

## Clean Repo Path

If the current folder has no Git repo, use a new repository only after authorization:

```powershell
git init
git branch -M main
git status --ignored
git add .
git commit -m "feat: prepare Luma Outreach Console safe preview"
git remote add origin NUEVO_REPO_URL
git push -u origin main
```

If the remote is wrong in another copy:

```powershell
git remote -v
git remote remove origin
git remote add origin NUEVO_REPO_URL
git branch -M main
git push -u origin main
```

## Vercel Linking

Use only a new or explicitly approved Vercel project.

Suggested commands, not executed:

```powershell
vercel link
vercel pull
vercel deploy
```

Before `vercel deploy`, verify:

- The Vercel project name is new/approved.
- The org/team is correct.
- No old `.vercel/project.json` is present.
- `.vercelignore` excludes real data.

## Pre-Deploy Checklist

- Repository remote origin verified.
- Branch verified.
- Package name is `luma-outreach-console`.
- Metadata says `Luma Outreach Console`.
- No WA Vortex or mass-send copy in public README/UI.
- Root route redirects to `/console/luma-premium`.
- `/console/luma-premium` opens with 0 leads by default.
- Real XLSX/CSV files are moved out or ignored/untracked.
- `.env` files absent from repo and deploy payload.
- Build authorized by Marcos.

## Post-Deploy Checklist

- Preview opens without real leads.
- Command Center says import a CSV/XLSX from local machine.
- Import page does not expose local `G:\` paths.
- No WhatsApp opens automatically.
- No messages are sent automatically.
- Dynamic routes render without duplicating logic.
- Vercel project did not overwrite or alias an old production project.

## Recommendation

Use a **public preview only if it contains zero real data**. If Marcos wants to show real client/prospect data, use a protected preview or keep QA local.
