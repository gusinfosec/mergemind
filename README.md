<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/marketing/mergemind_github.png">
    <img alt="MergeMind Banner" src="assets/marketing/mergemind_github.png" width="100%">
  </picture>
</p>

<p align="center">
  <img src="https://github.com/gusinfosec/mergemind/actions/workflows/pr-ai-describer.yml/badge.svg" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  <img src="https://img.shields.io/github/stars/gusinfosec/mergemind" />
</p>

---

**Stop wasting hours writing PR text.**  
MergeMind analyzes your code changes and generates structured pull request summaries, risk insights, and actionable recommendations — instantly.

---

## 🚀 What is MergeMind?

MergeMind is a GitHub Action that transforms raw diffs into:

- PR titles  
- structured summaries  
- key changes  
- **risk assessment (Low / Medium / High)**  
- **review recommendations**  

Built for developers, teams, and modern engineering workflows.

---

## ✍️ Before / After

**Before**

Updated some files and fixed bugs

**After (MergeMind)**

feat(auth): enforce MFA validation and improve session handling  

- Added MFA enforcement  
- Improved session timeout logic  
- Updated validation middleware  

**Risk Level:** High  
**Recommendation:** Validate MFA enforcement and session expiration behavior  

---

## ⚡ Features

- AI-generated PR titles and summaries  
- Automatic code diff analysis  
- **Risk scoring (Low / Medium / High)**  
- **Actionable review recommendations**  
- Clean, structured output for better code reviews  
- Zero-click GitHub Actions integration  

---

## 💸 Free vs Pro

Feature | Free | Pro  
--------|------|-----
AI Summary | Yes | Yes  
Full Diff Analysis | No | Yes  
Risk Assessment | Limited | Full  
Recommendations | Limited | Advanced  
PR Auto Update | No | Yes  

---

## 🔑 MergeMind Pro — $29 (one-time)

Unlock the full experience:

- Full diff analysis (no limits)  
- Automatic PR description updates  
- Advanced AI prompts  
- **Full risk analysis on code changes**  
- **Detailed recommendations for safer deployments**  
- Priority improvements  

---

## 💰 Get MergeMind Pro

### ☕ Ko-fi

<p align="center">
  <a href="https://ko-fi.com/s/8fa53b788d">
    <img src="https://img.shields.io/badge/Pro-$29%20One--Time-orange?style=for-the-badge&logo=buymeacoffee" />
  </a>
</p>

---

### 💳 Stripe

<p align="center">
  <a href="https://buy.stripe.com/4gM3cva2sfd54bD12ffbq08">
    <img src="https://img.shields.io/badge/Buy%20Pro-Stripe-blue?style=for-the-badge&logo=stripe" />
  </a>
</p>

---

## 🔐 How Pro Works

1. Purchase via Ko-fi or Stripe  
2. Receive your API key  
3. Add it to your repository:

Settings → Secrets → Actions  

MERGEMIND_API_KEY=your_key_here  

4. Open a PR → MergeMind runs automatically  

---

## 🧠 Access Model

This repository provides a **free version for evaluation**.

Pro access is unlocked via:
- API key (sent after purchase)  
- Feature unlock (no download required)  

---

## 🚀 Quick Install

1. Copy workflow from:  
.github/workflows/pr-ai-describer.yml  

2. Add your OpenAI key:  
OPENAI_API_KEY=sk-...  

3. (Optional Pro):  
MERGEMIND_API_KEY=your_key  

4. Open a PR → MergeMind runs automatically  

---

## 🔐 Security

- Uses GitHub Secrets  
- No data stored externally  
- Users control API usage  

---

## 🛠 Local Dev

git clone https://github.com/gusinfosec/MergeMind.git  
cd MergeMind  
npm install  

Run:

export OPENAI_API_KEY="sk-..."  
node src/action.js  

---

## 🧩 Ecosystem

MergeMind → Developer productivity  
Compliance AI → Audit automation  

https://compliance.cyberlaboratory.cc  

---

## 📜 License

MIT License  

---

**Build faster. Review smarter. Ship safer.**