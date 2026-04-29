import { execSync } from "child_process";
import fetch from "node-fetch";
import { VALID_KEYS } from "./keys.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MERGEMIND_API_KEY = process.env.MERGEMIND_API_KEY;

console.log("🚀 MergeMind running...");

// 🔐 License validation
function validateKey(key) {
  if (!key) return null;
  return VALID_KEYS.find(k => k.key === key) || null;
}

const license = validateKey(MERGEMIND_API_KEY);
const isPro = !!license;

console.log(`🔑 Plan: ${isPro ? "PRO" : "FREE"}`);
if (isPro) console.log(`👤 Licensed to: ${license.email}`);

// 📦 Get diff
let diff = "";
try {
  diff = execSync("git diff origin/main...HEAD", { encoding: "utf-8" });
} catch (err) {
  console.error("❌ Failed to get diff:", err);
  process.exit(1);
}

// ✂️ Limit FREE users
if (!isPro) {
  diff = diff.slice(0, 2000);
}

// 🧠 AI Prompt
const prompt = `
You are a senior IT auditor and compliance expert.

Analyze this GitHub PR diff and return:

## 📌 PR Title
## 📝 Summary
## 🔥 Risk Level (Low / Medium / High)

${isPro ? `
## 🧩 Compliance Mapping
- SOX:
- SOC2:
- ISO27001:

## ⚠️ Control Gaps
- 

## ✅ Recommendations
- 
` : ""}

Diff:
${diff}
`;

// 🤖 OpenAI call
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

    const output = data.choices?.[0]?.message?.content || "No output";

    console.log(output);

  } catch (err) {
    console.error(err);
  }
}

run();