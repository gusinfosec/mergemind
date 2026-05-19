<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/marketing/mergemind_github.png">
    <img alt="MergeMind Banner" src="assets/marketing/mergemind_github.png" width="100%">
  </picture>
</p>

<h1 align="center">MergeMind</h1>

<p align="center"><b>Know if your code changes create compliance risk before the PR merges.</b></p>

<p align="center">
  <img src="https://github.com/gusinfosec/mergemind/actions/workflows/pr-ai-describer.yml/badge.svg" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  <img src="https://img.shields.io/github/stars/gusinfosec/mergemind" />
</p>

---

MergeMind is a GitHub Action that analyzes your PR diffs and maps code changes to compliance controls — so audit findings surface in the pull request, not after the deployment.

---

## What MergeMind Does

For every pull request, MergeMind generates:

- A structured PR title and summary
- **Risk level assessment (Low / Medium / High)**
- **Compliance mapping (SOX, SOC2, ISO 27001)**
- **Control gap analysis and remediation recommendations**

---

## Before / After

**Before**

Updated some files and fixed bugs

**After (MergeMind)**

feat(auth): enforce MFA validation and improve session handling

- Added MFA enforcement
- Improved session timeout logic
- Updated validation middleware

**Risk Level:** High
**SOX Mapping:** CC6.1 — Logical access controls
**Control Gap:** MFA enforcement not covered by existing test suite
**Recommendation:** Add integration tests before merging to main

---

## Free vs Pro

| Feature | Free | Pro |
|---|---|---|
| PR title + summary | Yes | Yes |
| Risk level (Low/Med/High) | Yes | Full |
| Compliance mapping (SOX, SOC2, ISO 27001) | No | Yes |
| Control gap analysis | No | Yes |
| Remediation recommendations | No | Yes |
| Full diff analysis (no token limit) | No | Yes |

---

## MergeMind Pro — $29 one-time

<p align="center">
  <a href="https://buy.stripe.com/4gM3cva2sfd54bD12ffbq08">
    <img src="https://img.shields.io/badge/Buy%20Pro-Stripe-blue?style=for-the-badge&logo=stripe" />
  </a>
</p>

---

## How Pro Works

1. Purchase via Stripe
2. Receive your license key
3. Add it to your repository secrets:

> **Settings → Secrets and variables → Actions → New repository secret**

```
MERGEMIND_LICENSE_KEY=your_key_here
```

4. Open a PR — MergeMind runs automatically

---

## Quick Install

1. Add this workflow to `.github/workflows/mergemind.yml` in your repo:

```yaml
name: MergeMind PR Describer
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  describe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run MergeMind
        uses: gusinfosec/mergemind@main
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          mergemind_license_key: ${{ secrets.MERGEMIND_LICENSE_KEY }}  # Pro only
```

2. Add your secrets under **Settings → Secrets and variables → Actions**:

```
OPENAI_API_KEY=sk-...
MERGEMIND_LICENSE_KEY=your_key   # Pro only
```

3. Open a PR — MergeMind runs automatically.

---

## Security

- No code stored externally
- Runs entirely within your GitHub Actions environment
- API keys stored as GitHub Secrets

---

## Local Dev

```bash
git clone https://github.com/gusinfosec/mergemind.git
cd mergemind
npm install
```

```bash
export OPENAI_API_KEY="sk-..."
node src/action.js
```

---

## License

MIT License

---

**Know the compliance risk before the PR merges.**
