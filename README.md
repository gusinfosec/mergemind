 <p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/marketing/mergemind_github.png">
    <img alt="MergeMind Banner" src="assets/marketing/mergemind_github" width="100%">
  </picture>
</p>



<p align="center">
  <img src="https://github.com/gusinfosec/mergemind/actions/workflows/pr-ai-describer.yml/badge.svg" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  <img src="https://img.shields.io/github/stars/gusinfosec/mergemind" />
</p>

---

Stop wasting hours writing PR text.  
MergeMind turns raw diffs into clean, structured pull request summaries instantly.

---

## What is MergeMind?

MergeMind is a GitHub Action that automatically generates:

- PR titles  
- summaries  
- key changes  
- risk insights  

Built for developers, teams, and modern workflows.

---

## Before / After

Before:

Updated some files and fixed bugs

After (MergeMind):

feat(auth): enforce MFA validation and improve session handling

- Added MFA enforcement  
- Improved session timeout logic  
- Updated validation middleware  

---

## Features

- AI-generated PR summaries  
- GitHub Actions integration  
- Clean structured output  
- Zero-click automation  

---

## Free vs Pro

Feature | Free | Pro  
--------|------|-----
AI Summary | Yes | Yes  
Full Diff Analysis | No | Yes  
PR Auto Update | No | Yes  
Advanced Prompts | No | Yes  

---

## Upgrade to Pro

Add your key in:

Settings → Secrets → Actions  

MERGEMIND_API_KEY=your_key_here  

---

## Get MergeMind Pro

Ko-fi (Live)

<p align="center">
  <a href="https://ko-fi.com/s/8fa53b788d">
    <img src="https://img.shields.io/badge/Pro-$29%20One--Time-orange?style=for-the-badge&logo=buymeacoffee" />
  </a>
</p>

---

Stripe (Live)

<p align="center">
  <a href="https://buy.stripe.com/28E5kD4I8aWPdMdfX9fbq01">
    <img src="https://img.shields.io/badge/Buy%20Pro-Stripe-blue?style=for-the-badge&logo=stripe" />
  </a>
</p>


---

## Access Model

This repository provides a free version for evaluation.

Pro access is unlocked via:
- API key (sent after purchase)  
- Feature unlock (no download required)  

---

## Quick Install

1. Copy workflow from:
.github/workflows/pr-ai-describer.yml  

2. Add your OpenAI key:
OPENAI_API_KEY=sk-...  

3. Optional (Pro):
MERGEMIND_API_KEY=your_key  

4. Open a PR → MergeMind runs automatically  

---

## Security

- Uses GitHub Secrets  
- No data stored externally  
- Users control API usage  

---

## Local Dev

git clone https://github.com/gusinfosec/MergeMind.git  
cd MergeMind  
npm install  

Run:

export OPENAI_API_KEY="sk-..."  
node src/action.js  

---

## Ecosystem

MergeMind → Developer productivity  
Compliance AI → Audit automation  

https://compliance.cyberlaboratory.cc  

---

## License

MIT License  

---

Build faster. Review smarter. Ship cleaner.