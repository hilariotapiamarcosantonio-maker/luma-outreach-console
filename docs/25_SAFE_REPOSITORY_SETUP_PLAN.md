# Safe Repository Setup Plan

This plan is intentionally documentation-only. Do not run these commands until Marcos explicitly authorizes the scenario.

## Scenario A - No `.git`

Current folder matches this scenario.

Recommended path:

1. Move any real lead files out of the project root or confirm they are ignored.
2. Confirm `.gitignore` includes operational data exclusions.
3. Initialize a clean repo only after authorization.

Suggested commands, not executed:

```powershell
git init
git branch -M main
git status
git add .
git commit -m "feat: prepare Luma Outreach Console safe preview"
git remote add origin NUEVO_REPO_URL
git push -u origin main
```

Before `git add .`, run:

```powershell
git status --ignored
```

Confirm real files such as CSV/XLSX/prospect exports appear ignored and not staged.

## Scenario B - `.git` Exists With Correct Remote

Use this only if a future copy of the project already has a verified correct remote.

Suggested checks, not executed:

```powershell
git status
git remote -v
git branch --show-current
```

If the remote is correct and Marcos authorizes:

```powershell
npm run build
git status
git add .
git commit -m "feat: prepare Luma Outreach Console safe preview"
git push
```

## Scenario C - `.git` Exists With Incorrect Remote

Do not push.

Options:

1. Change `origin` to a new repo.
2. Copy the project to a clean folder and initialize a fresh repo.
3. Create a new repo from scratch and copy only safe source files.

Suggested commands for changing the remote, not executed:

```powershell
git remote -v
git remote remove origin
git remote add origin NUEVO_REPO_URL
git branch -M main
git remote -v
git push -u origin main
```

Only use this after Marcos confirms that `NUEVO_REPO_URL` is the correct new repository.

## Scenario D - `.vercel` Link Is Old

Do not deploy.

Recommended:

1. Inspect `.vercel/project.json` without printing secret-like IDs in public logs.
2. Confirm whether the linked Vercel project is correct.
3. Relink manually to a new/approved Vercel project.
4. Delete `.vercel` only with explicit permission.

Suggested commands, not executed:

```powershell
vercel link
vercel env ls
vercel pull
```

If Marcos explicitly authorizes removing an old local link:

```powershell
Remove-Item -Recurse -Force .vercel
vercel link
```

## Non-Negotiables

- No `git push` until remote origin is verified.
- No `git add .` until ignored data has been confirmed.
- No `vercel deploy` until `.vercel` linkage is verified.
- No real CSV/XLSX/lead JSON data in the repo.
- No `.env` files in Git or Vercel preview upload.
