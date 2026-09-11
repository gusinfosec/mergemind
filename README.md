<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/marketing/mergemind_github_banner.png">
    <img alt="MergeMind Banner" src="assets/marketing/mergemind_github_banner.png" width="100%">
  </picture>
</p>

<p align="center"><b>MergeMind analyzes pull request diffs and flags compliance risk before code is merged.</b></p>
<p align="center"><b>Built for engineering, security, and compliance teams that need audit-aware merge request reviews in GitHub Actions and GitLab CI.</b></p>

<p align="center">
  <img src="https://github.com/gusinfosec/mergemind/actions/workflows/pr-describer.yml/badge.svg" />
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" /></a>
  <img src="https://img.shields.io/github/stars/gusinfosec/mergemind" />
</p>

---

## Product Description

MergeMind runs in GitHub Actions and GitLab CI, analyzes your pull/merge request diffs and maps code changes to compliance controls — so audit findings surface before the merge, not after the deployment.

---

## Key Features

For every pull request, MergeMind generates:

- A structured PR title and summary
- **Risk level assessment (Low / Medium / High)**
- **Compliance mapping (SOX / SOC 2 / ISO 27001)**
- **Control gap analysis and remediation recommendations**

Frameworks referenced: **SOX** (IT general controls), **SOC 2** (Trust Services Criteria, 2017 revision) and **ISO/IEC 27001:2022** Annex A. Findings are AI-generated and informational — they are a review aid, not an audit opinion (see the [Terms](https://mergemind.dev/terms)).

Control identifiers are validated against the framework's current numbering before they are posted: a reference that isn't a real SOC 2 criterion or a real ISO/IEC 27001:2022 Annex A control is dropped rather than shown, and logged in the CI run. Models like to fall back on the superseded 2013 ISO numbering, so this is checked rather than trusted.

---

## Before / After

**Before**

Updated some files and fixed bugs

**After — free tier**

## PR Title
feat(auth): enforce MFA validation and improve session handling

## Summary
- Added MFA enforcement
- Improved session timeout logic
- Updated validation middleware

## Risk Level
High

**After — paid license** (adds the compliance stack)

## Compliance Mapping
- SOX (ITGC): access to programs and data
- SOC 2 (TSC 2017): CC6.1 — Logical access controls
- ISO/IEC 27001:2022: A.8.5 — Secure authentication

## Control Gaps
- MFA enforcement not covered by existing test suite

## Recommendations
- Add integration tests for MFA flow before merging to main

> The paid tier analyzes the full diff; the free tier analyzes the first 2,000 characters of it. Control references above are AI-generated and informational — review them before relying on them. Real, unedited paid-license output (run against a public commit) is on [mergemind.dev](https://mergemind.dev/#example).

---

## Pricing

| Feature | Free | License |
|---|---|---|
| PR title + summary | Yes | Yes |
| Risk level (Low/Med/High) | Yes | Full |
| Compliance mapping (SOX, SOC2, ISO 27001) | No | Yes |
| Control gap analysis | No | Yes |
| Remediation recommendations | No | Yes |
| Full diff analysis (free tier caps at 2,000 characters) | No | Yes |

Both tiers call OpenAI with **your own** `OPENAI_API_KEY`, so model usage is billed to your OpenAI account — separate from the one-time license.

---

## MergeMind License

<p align="center">
  <a href="https://buy.stripe.com/4gM3cva2sfd54bD12ffbq08">
    <img src="https://img.shields.io/badge/Get%20License-Stripe-blue?style=for-the-badge&logo=stripe" />
  </a>
</p>

One-time license — $29 via Stripe above · [mergemind.dev](https://mergemind.dev)

---

## How It Works

1. Purchase via Stripe
2. Receive your license key
3. Add it to your repository secrets:

> **Settings → Secrets and variables → Actions → New repository secret**

```
MERGEMIND_LICENSE_KEY=your_key_here
```

4. Open a PR — MergeMind runs automatically

---

## Getting Started (GitHub Actions)

1. Add this workflow to `.github/workflows/mergemind.yml` in your repo:

```yaml
name: MergeMind PR Analysis
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      # Full history so the diff range resolves (MergeMind diffs base...HEAD)
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: gusinfosec/mergemind@v1
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          license_key: ${{ secrets.MERGEMIND_LICENSE_KEY }}  # optional
```

2. Add your secrets under **Settings → Secrets and variables → Actions**:

```
OPENAI_API_KEY=sk-...
MERGEMIND_LICENSE_KEY=your_key   # optional — free tier works without it
```

3. Open a PR — MergeMind runs automatically and posts the compliance analysis as a PR comment (created on the first push, updated in place on later pushes).

### Using MergeMind on GitLab CI

Copy [`examples/gitlab-ci.yml`](examples/gitlab-ci.yml) into your repo as `.gitlab-ci.yml` (or merge the `mergemind` job into your existing file). The job checks out MergeMind from GitHub into `.mergemind` and runs the analysis there, so no extra files are needed in your repo. Add these CI/CD variables under **Project → Settings → CI/CD → Variables**:

```
OPENAI_API_KEY=sk-...
MERGEMIND_GITLAB_TOKEN=glpat-...   # PAT with `api` scope (posts MR notes)
MERGEMIND_LICENSE_KEY=your_key     # optional, free tier works without it
```

For self-managed GitLab, also set `MERGEMIND_GITLAB_HOST` (defaults to `https://gitlab.com`). Open a merge request — MergeMind analyzes the diff and posts the compliance assessment as an MR note.

> Note: the GitLab path still uses the copy-paste workflow (see `examples/gitlab-ci.yml`); the one-line `action.yml` packaging is GitHub Actions-only.

---

## Security

- No PR code stored externally — MergeMind has no server in the analysis path
- Runs entirely within your GitHub Actions environment, using your own API key
- API keys stored as GitHub Secrets
- The marketing site (mergemind.dev) collects anonymous visit analytics — see the [Privacy Policy](https://mergemind.dev/privacy)

---

## Contact / Support

For support, licensing, or enterprise inquiries, contact **team@mergemind.dev**.

---
© 2026 Cyber Global Technologies LLC. All rights reserved.  
Built by [Fretz Olivares](https://www.linkedin.com/in/fretz-olivares/) — [Cyber Global Technologies](https://cyberglobal.ai)  
Enterprise inquiries: info@cyberglobal.ai
