# Roadmap — MergeMind

This is a working plan. Track progress in Issues & Discussions.

## Phase 1 — Solid Core (now)
- ✅ GitHub Action that comments suggested PR title & body  
- ✅ Local runner for diff → summary  
- ✅ Repo config via `.pr-describer.yml`  
- ✅ Privacy & Contributing docs  
- ⏳ Ignore rules for files/folders (e.g., docs, lockfiles)  

## Phase 2 — Product Fit
- Overwrite mode (update PR body directly) with safety switch  
- Styles: `casual`, `formal`, `conventional-commit`  
- Risk & Test Steps optional blocks  
- Better prompt templates per language (JS/TS, Python, Go)  
- Multi-file weighting (large changes get more attention)  

## Phase 3 — Monetization
- Stripe checkout (monthly seat-based)  
- License key validator (simple API) and Action check  
- Free tier (comment-only, smaller diffs) vs Pro tier (overwrite, longer diffs)  
- GitHub Marketplace listing  

## Phase 4 — Team Features
- Org-wide presets via `.github` repo  
- Labels automation (skip/force)  
- Analytics: “time saved” estimates, run counts  

## Nice-to-haves
- Self-hosted model support (OpenAI-compatible endpoint)  
- Multi-language summaries  
- Commit message suggestions  
