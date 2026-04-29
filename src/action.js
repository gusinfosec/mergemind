const { execSync } = require("child_process");
const fs = require("fs");
const fetch = require("node-fetch");

// ===== CONFIG =====
const FREE_LIMIT = 300;

// ===== ENV =====
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USER_KEY = process.env.MERGEMIND_API_KEY;

console.log("🚀 MergeMind running...");

// ===== KEY VALIDATION =====
function isValidKey(apiKey) {
  if (!apiKey) return false;

  try {
    const data = JSON.parse(fs.readFileSync("data/keys.json", "utf8"));

    return data.keys.some(
      (k) => k.key === apiKey && k.active === true
    );
  } catch (e) {
    console.log("⚠️ Could not read keys DB:", e.message);
    return false;
  }
}

const isPaidUser = isValidKey(USER_KEY);

// ===== EVENT CHECK =====
if (!process.env.GITHUB_EVENT_PATH) {
  console.log("❌ No GitHub event found. Exiting.");
  process.exit(0);
}

const event = require(process.env.GITHUB_EVENT_PATH);

if (!event.pull_request) {
  console.log("ℹ️ Not a pull request event. Skipping.");
  process.exit(0);
}

// ===== PR INFO =====
const pr = event.pull_request;
const repo = process.env.GITHUB_REPOSITORY;
const prNumber = pr.number;

console.log(`🔍 Processing PR #${prNumber} in ${repo}`);

// ===== GET DIFF =====
let diff = "";

try {
  diff = execSync("git diff origin/main...HEAD").toString();
} catch (e) {
  console.log("⚠️ Could not get diff, using fallback");
  diff = pr.body || "No diff available";
}

// ===== STRONG GATING =====
if (!isPaidUser) {
  console.log("⚠️ Free tier → applying strict limits");

  diff = diff.slice(0, FREE_LIMIT);
} else {
  console.log("🚀 Paid user validated → full access");
}

// ===== AI GENERATION =====
async function generatePR() {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a senior engineer writing high-quality GitHub PR summaries with structured sections.",
          },
          {
            role: "user",
            content: `Analyze this diff and generate:

1. PR Title
2. Summary
3. Key Changes
4. Risk Level (Low/Medium/High)
5. Testing Notes

Diff:
${diff}`,
          },
        ],
      }),
    });

    const data = await res.json();
    let output = data.choices?.[0]?.message?.content || "No response";

    // ===== UX UPGRADE FOR FREE USERS =====
    if (!isPaidUser) {
      output += `

---
⚠️ **Free Version Notice**
This summary is limited.

👉 Upgrade to **MergeMind Pro** to unlock:
- Full PR rewrite
- Complete diff analysis
- Automatic PR updates
`;
    }

    console.log("🧠 Generated output:\n", output);

    return output;
  } catch (err) {
    console.log("❌ OpenAI error:", err.message);
    return "AI generation failed.";
  }
}

// ===== PR UPDATE (PAID ONLY) =====
async function updatePR(content) {
  if (!isPaidUser) {
    console.log("🔒 PR update blocked (Pro feature)");
    return;
  }

  const url = `https://api.github.com/repos/${repo}/pulls/${prNumber}`;

  await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: content,
    }),
  });

  console.log("✅ PR updated successfully");
}

// ===== RUN =====
(async () => {
  const content = await generatePR();
  await updatePR(content);
})();