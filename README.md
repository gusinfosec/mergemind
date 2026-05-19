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

**After (MergeMind Pro)**

## PR Title
feat(auth): enforce MFA validation and improve session handling

## Summary
- Added MFA enforcement
- Improved session timeout logic
- Updated validation middleware

## Risk Level
High

## Compliance Mapping
- SOX: CC6.1 — Logical access controls
- SOC2: CC6.1 — Logical and physical access controls
- ISO27001: A.9.4 — System and application access control

## Control Gaps
- MFA enforcement not covered by existing test suite

## Recommendations
- Add integration tests for MFA flow before merging to main

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

## MergeMind Pro

<p align="center">
  <a href="https://buy.stripe.com/4gM3cva2sfd54bD12ffbq08">
    <img src="https://img.shields.io/badge/Get%20Pro-Stripe-blue?style=for-the-badge&logo=stripe" />
  </a>
</p>

Monthly subscription — [view pricing at mergemind.dev](https://mergemind.dev)

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
name: MergeMind PR Analysis
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout your repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Checkout MergeMind
        uses: actions/checkout@v4
        with:
          repository: gusinfosec/mergemind
          path: .mergemind

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install
        working-directory: .mergemind

      - name: Run MergeMind
        run: node .mergemind/src/action.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          MERGEMIND_LICENSE_KEY: ${{ secrets.MERGEMIND_LICENSE_KEY }}
          MERGEMIND_VALIDATION_URL: https://mergemind-production.up.railway.app/api/validate-key
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

<table width="100%"><tr>
  <td>© 2026 Cyber Global Technologies LLC</td>
  <td align="center"><a href="docs/">Docs</a> · <a href="CONTRIBUTING.md">Contributing</a> · <a href="./LICENSE">License</a> · <a href="https://github.com/marketplace">GitHub Marketplace</a></td>
  <td align="right">Built by <a href="https://www.cyberglobal.ai">Fretz Olivares</a> — <a href="https://www.cyberglobal.ai">cyberglobal.ai</a></td>
</tr></table>
