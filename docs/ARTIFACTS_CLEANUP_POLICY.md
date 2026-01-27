# Artifact & Cleanup Policy 🔧

**Purpose**
This document defines how temporary build, lint, and debug artifacts are handled in the repository to keep the repo clean, reproducible, and small.

## Scope
Applies to all contributors and CI for this repository (frontend, backend, and scripts).

## Principles ✅
- Keep the git history lean: avoid committing generated artifacts (build outputs, logs, temporary SQLs, local DB files, and node_modules backups).
- Traceability: when in doubt, archive artifacts into `archive/` instead of permanently deleting them immediately.
- Safety: never commit secrets (e.g., `.env`) or production-only files.

## Files & Patterns to Ignore (.gitignore)
Add the following patterns (already applied):

- debug/build/lint logs: `debug_output*.txt`, `debug_output*.json`, `build_log*.txt`, `wrangler-dev.log`
- lint/tool outputs: `lint-output*.json`, `lint-results*.json`, `lint-*.txt`
- temporary SQLs / scripts: `temp-*.sql`, `tmp_*.sql`
- backups: `node_modules._bak_*/`, `*.bak`

> See `.gitignore` in the repo root for the current list.

## Archival process (non-destructive) 📦
When you find generated files that are tracked or important for debugging:

1. Create a cleanup branch, e.g.:
   ```bash
   git checkout -b cleanup/artifacts-YYYY-MM-DD
   ```
2. Create an archive folder following the convention: `archive/cleanup-YYYY-MM-DD/`.
3. Move files into the archive and commit (this keeps history but reduces root clutter):
   ```bash
   git mv path/to/artifact archive/cleanup-YYYY-MM-DD/
   git add .gitignore archive/cleanup-YYYY-MM-DD
   git commit -m "chore: archive temporary artifacts (cleanup-YYYY-MM-DD)"
   git push -u origin HEAD
   ```
4. Open a PR, add a short summary and ask reviewers for permission to permanently delete the archived contents later.

## Permanent deletion / repo shrinking (destructive) ⚠️
If you want to remove large archived files from history (e.g., large node_modules backups), use a history rewrite tool such as `git filter-repo` or `BFG Repo-Cleaner`. This is destructive and should be coordinated with project maintainers:

- Create a backup of the repo first. 
- Follow the tool docs and coordinate with maintainers to avoid disruption.

## Local cleanup commands (non-destructive) 🧹
- Remove untracked artifact files (safe to run locally if you do not need the files):
  ```powershell
  # From repo root
  Remove-Item debug_output*.txt -ErrorAction SilentlyContinue
  Remove-Item build_log*.txt -ErrorAction SilentlyContinue
  Remove-Item lint-*.txt -ErrorAction SilentlyContinue
  Remove-Item wrangler-dev.log -ErrorAction SilentlyContinue
  ```
- Archive tracked artifacts (to preserve history) — example used in this repo:
  ```bash
  git mv backend/tmp_init_users.sql archive/cleanup-2026-01-27/backend/
  git add archive/cleanup-2026-01-27 .gitignore
  git commit -m "chore: archive temporary artifacts (cleanup-2026-01-27)"
  ```
- Maintenance tasks:
  - `npm prune` — remove extraneous packages
  - `npm run lint:fix` — apply automatic ESLint fixes

## CI / Hook recommendations ⚙️
- Keep `.gitignore` up to date and add checks in CI to fail on committed artifacts (optional):
  - A lightweight check can scan for known artifact patterns and fail the job with an actionable message.
- Keep pre-commit hooks (e.g., `lint-staged`) to reduce accidental check-ins of generated files.

## Ownership & Review
- Changes that remove or rewrite history require at least one maintainer approval.
- For permanent deletions of archive content, create a dedicated PR describing why and which files are being permanently removed.

## Questions & Troubleshooting 💡
- Unsure whether to archive or delete? Archive first. If the files are very large and no longer useful, raise a PR proposing a removal and request maintainer approval.

---

If you'd like, I can add a small CI script that scans for artifact filenames and fails if any appear in a commit; say `yes` and I will add a GitHub Actions workflow for that.