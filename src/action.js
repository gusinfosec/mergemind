import { execSync } from "child_process";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MERGEMIND_LICENSE_KEY = process.env.MERGEMIND_LICENSE_KEY;
const MERGEMIND_VALIDATION_URL =
  process.env.MERGEMIND_VALIDATION_URL ||
  "https://mergemind-production.up.railway.app/api/validate-key";

// ── Platform detection ─────────────────────────────────────────────────────
// GitLab CI sets these vars on merge-request pipelines; GitHub Actions does
// not. When they're present we're running on GitLab.
const ON_GITLAB = Boolean(
  process.env.CI_PROJECT_ID && process.env.CI_MERGE_REQUEST_IID
);
const REPO =
  process.env.GITHUB_REPOSITORY || process.env.CI_PROJECT_PATH || "";

console.log(`MergeMind running... (${ON_GITLAB ? "GitLab CI" : "GitHub Actions"})`);

// ---------------------------------------------------------------------------
// Remote license validation
// ---------------------------------------------------------------------------
async function validateLicense(key) {
  if (!key) return { valid: false, plan: "free" };

  try {
    const res = await fetch(MERGEMIND_VALIDATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, repo: REPO }),
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
// Diff — platform-agnostic with CI-aware base ref
// ---------------------------------------------------------------------------
function getDiff() {
  // GitLab exposes the merge-base SHA directly; GitHub needs the branch ref.
  const base =
    process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA ||
    process.env.GIT_BASE_REF ||
    "origin/main";
  try {
    return execSync(`git diff ${base}...HEAD`, { encoding: "utf-8" });
  } catch (err) {
    // Three-dot range may fail if the base isn't fetched (shallow clone).
    // Fall back to a plain diff against the base.
    try {
      return execSync(`git diff ${base} HEAD`, { encoding: "utf-8" });
    } catch (err2) {
      console.error("Failed to get diff:", err2.message);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Output — console.log (GitHub) or GitLab merge-request note
// ---------------------------------------------------------------------------
async function postGitlabNote(output) {
  if (!ON_GITLAB) return false;
  const token = process.env.MERGEMIND_GITLAB_TOKEN || process.env.CI_JOB_TOKEN;
  if (!token) {
    console.warn(
      "GitLab detected but no token set — posting note skipped. Set MERGEMIND_GITLAB_TOKEN."
    );
    return false;
  }
  try {
    const projectId = process.env.CI_PROJECT_ID;
    const mrIid = process.env.CI_MERGE_REQUEST_IID;
    const host =
      process.env.MERGEMIND_GITLAB_HOST || "https://gitlab.com";
    const res = await fetch(
      `${host}/api/v4/projects/${projectId}/merge_requests/${mrIid}/notes`,
      {
        method: "POST",
        headers: {
          "PRIVATE-TOKEN": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body:
            output.length > 10000
              ? output.slice(0, 10000) + "\n\n… (truncated — see job log for full output)"
              : output,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) {
      console.warn(`GitLab note failed (${res.status}) — see job log for output.`);
      return false;
    }
    console.log("Posted analysis to GitLab MR note.");
    return true;
  } catch (err) {
    console.warn("Could not post GitLab note:", err.message);
    return false;
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
  const diff = getDiff();

  if (!diff.trim()) {
    console.log("No diff to analyze — skipping.");
    process.exit(0);
  }

  const usableDiff = isPro ? diff : diff.slice(0, 2000);

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

Analyze this ${ON_GITLAB ? "GitLab merge request" : "GitHub pull request"} diff and return:

## PR Title
## Summary
## Risk Level (Low / Medium / High)
${complianceSection}
Diff:
${usableDiff}`;

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
    const posted = await postGitlabNote(output);
    if (!posted) console.log(output);
  } catch (err) {
    console.error("OpenAI call failed:", err.message);
    process.exit(1);
  }
}

run();
