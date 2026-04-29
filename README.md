<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/marketing/mergemind_banner_dark.png">
    <img alt="MergeMind Banner" src="assets/marketing/mergemind_banner_light.png" width="100%">
  </picture>
</p>

> ![CI](https://github.com/gusinfosec/MergeMind/actions/workflows/pr-ai-describer.yml/badge.svg)
> [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
> [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
> [![Stars](https://img.shields.io/github/stars/gusinfosec/MergeMind)](https://github.com/gusinfosec/MergeMind/stargazers) 
> ![Build for Linux](https://img.shields.io/badge/build-Linux-green)
>
> **Stop wasting hours writing PR text. MergeMind turns raw diffs into clean, consistent titles and summaries — instantly.**
>
> [Privacy policy](PRIVACY.md) · [Contributing](CONTRIBUTING.md) · [Roadmap](ROADMAP.md)

---

## 🚀 What is MergeMind?

MergeMind turns raw GitHub diffs into clean, structured pull request titles and summaries automatically. Built for developers, teams, and engineering workflows. Stop wasitng hours writing PR text.

---

## 🔥 Why it matters

Developers waste hours every sprint writing PR descriptions.

MergeMind:

- Saves time
- Standardizes documentation
- Improves code reviews

---

## ⚡ Features

- AI-generated PR titles & summaries
- GitHub Actions integration
- Consistent formatting (conventional commits)
- Risk & testing context (optional)
- Zero-click automation

---

## ✍️ Before / After (conversion trigger) 

\### Before
"Updated some files and fixed bugs"

\### After (MergeMind)
"feat(auth): enforce MFA validation and improve session handling

\- Added MFA enforcement
\- Improved session timeout logic
\- Updated validation middleware"

## 

## 📊 Feature Comparison

| Feature                               | Free | Pro ($29) |
| ------------------------------------- | ---- | --------- |
| AI-generated PR titles & descriptions | ✅    | ✅         |
| GitHub Action integration             | ✅    | ✅         |
| Structured PR output                  | ❌    | ✅         |
| Advanced summaries                    | ❌    | ✅         |
| Standardized formatting               | ❌    | ✅         |
| Priority updates                      | ❌    | ✅         |

---

## ☕ One-Time Purchase

- Lifetime access (current version)
- No subscription required
- Instant download

<p align="center">
  <a href="https://ko-fi.com/s/8fa53b788d">
    <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support on Ko-fi"/>
  </a>
</p>


---

## 🚀 Quick Install

```
1. Copy the workflow snippet from `.github/workflows/pr-ai-describer.yml`  
2. Add your `OPENAI_API_KEY` as a repository secret  
3. Open a PR — MergeMind will generate a title + summary  

⚠️ **Important:**  
You must provide your own OpenAI API key. MergeMind does not include or manage API usage.
```

---

## 🔐 Security

```
1. API keys are stored via GitHub Secrets
2. No data is stored by MergeMind
3. Users control their own API usage
```

---

## 🛠 Local Dev

```bash
git clone https://github.com/gusinfosec/MergeMind.git
cd MergeMind
npm install
node src/index.js
```

Clone & install:

```bash
git clone https://github.com/gusinfosec/pr-copilot-extension.git mergemind
cd mergemind
npm install
```

Run with the included sample diff:

```bash
export OPENAI_API_KEY="sk-..."   # set in your shell for this session
node src/index.js
```

Test with a real diff from any repo:

```bash
# from your other repo
git diff --unified=0 > /tmp/mergemind.diff

# back in MergeMind repo
cp -f /tmp/mergemind.diff sample.diff
node src/index.js
```

---

## 🧩 Ecosystem

MergeMind → Developer productivity  
Compliance AI → Audit automation Tool

https://compliance.cyberlaboratory.cc

---

## 📜 License

This project is licensed under the terms of the **MIT license**.  
See the [LICENSE](LICENSE) file for details.

---

## 🏷️ Tags 

`github-actions` · `pull-requests` · `ai` · `openai` · `developer-productivity`
