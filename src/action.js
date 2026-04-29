import { execSync } from "child_process";
import fetch from "node-fetch";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MERGEMIND_API_KEY = process.env.MERGEMIND_API_KEY;

const eventName = process.env.GITHUB_EVENT_NAME;

console.log("🚀 MergeMind running...");

// 🚫 Only run on PRs
if (eventName !== "pull_request") {
  console.log("ℹ️ Not a pull request event. Skipping.");
  process.exit(0);
}

// 🔐 Basic PRO gating (can expand later)
const isPro = MERGEMIND_API_KEY && MERGEMIND_API_KEY.startsWith("mm_live_");

console.log(`🔑 Plan: ${isPro ? "PRO" : "FREE"}`);

// 📦 Get PR diff
let diff = "";
try {
  diff = execSync("git diff origin/main...HEAD", { encoding: "utf-8" });
} catch (err) {
  console.error("❌ Failed to get diff:", err);
  process.exit(1);
}

// ✂️ Limit for FREE users
if (!isPro) {
  diff = diff.slice(0, 2000);
}

// 🧠 Enhanced Compliance Prompt
const prompt = `
You are a senior IT auditor and compliance expert.

Analyze the following GitHub Pull Request diff and generate a structured report.

Return output EXACTLY in this format:

## 📌 PR Title
<short clear title>

## 📝 Summary
<what changed in plain English>

## 🔥 Risk Level
<Low | Medium | High>

## 🧩 Compliance Mapping
- SOX: <impact or "None">
- SOC2: <impact or "None">
- ISO27001: <impact or "None">

## ⚠️ Control Gaps
- <gap 1>
- <gap 2>

## ✅ Recommendations
- <recommendation 1>
- <recommendation 2>

Guidelines:
- If authentication, logging, permissions, or data handling is affected → increase risk
- If no security impact → Low
- Be concise but meaningful
- Think like an auditor reviewing code changes

Diff:
${diff}
`;

// 🤖 Call OpenAI
async function run() {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!data.choices) {
      console.error("❌ OpenAI error:", data);
      process.exit(1);
    }

    const output = data.choices[0].message.content;

    console.log("📄 Generated PR Content:\n", output);

    // 📌 Extract repo + PR info
    const repo = process.env.GITHUB_REPOSITORY;
    const prNumber = process.env.GITHUB_REF.split("/")[2];

    // 💬 Post comment to PR
    await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        body: output
      })
    });

    console.log("✅ Comment posted successfully");

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

run();