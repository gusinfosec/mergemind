import { execSync } from "child_process";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MERGEMIND_LICENSE_KEY = process.env.MERGEMIND_LICENSE_KEY;
const MERGEMIND_VALIDATION_URL =
  process.env.MERGEMIND_VALIDATION_URL ||
  "https://api.mergemind.dev/api/validate-key";

console.log("MergeMind running...");

// ---------------------------------------------------------------------------
// Remote license validation
// ---------------------------------------------------------------------------
async function validateLicense(key) {
  if (!key) return { valid: false, plan: "free" };

  try {
    const res = await fetch(MERGEMIND_VALIDATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        repo: process.env.GITHUB_REPOSITORY || "",
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { valid: false, plan: "free" };
    return await res.json();
  } catch (err) {
    // Endpoint unreachable — warn but don't block the workflow
    console.warn(
      "Warning: Could not reach MergeMind validation server. Running as free tier."
    );
    return { valid: false, plan: "free", _unreachable: true };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
  // 1. Validate license
  const license = await validateLicense(MERGEMIND_LICENSE_KEY);
  const isPro = license.valid && license.plan !== "free";

  if (MERGEMIND_LICENSE_KEY && !license.valid && !license._unreachable) {
    console.error(
      "Invalid or expired MergeMind license. Visit mergemind.dev to get a key."
    );
    process.exit(1);
  }

  console.log(`Plan: ${isPro ? license.plan.toUpperCase() : "FREE"}`);

  // 2. Get diff
  let diff = "";
  try {
    diff = execSync("git diff origin/main...HEAD", { encoding: "utf-8" });
  } catch (err) {
    console.error("Failed to get diff:", err.message);
    process.exit(1);
  }

  if (!isPro) {
    diff = diff.slice(0, 2000);
  }

  // 3. Build prompt
  const complianceSection = isPro
    ? `
## Compliance Mapping
- SOX:
- SOC2:
- ISO27001:

## Control Gaps
-

## Recommendations
-
`
    : "";

  const prompt = `You are a senior IT auditor and compliance expert.

Analyze this GitHub PR diff and return:

## PR Title
## Summary
## Risk Level (Low / Medium / High)
${complianceSection}
Diff:
${diff}`;

  // 4. Call OpenAI
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "No output";
    console.log(output);
  } catch (err) {
    console.error("OpenAI call failed:", err.message);
    process.exit(1);
  }
}

run();
