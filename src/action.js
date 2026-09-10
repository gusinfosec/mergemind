import { execSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MERGEMIND_LICENSE_KEY = process.env.MERGEMIND_LICENSE_KEY;
const MERGEMIND_VALIDATION_URL =
  process.env.MERGEMIND_VALIDATION_URL ||
  "https://api.mergemind.dev/api/validate-key";

// ── Platform detection ─────────────────────────────────────────────────────
// GitLab CI sets these vars on merge-request pipelines; GitHub Actions does
// not. When they're present we're running on GitLab.
// Computed lazily (not at import time) so the module is testable.
function isGitlab() {
  return Boolean(
    process.env.CI_PROJECT_ID && process.env.CI_MERGE_REQUEST_IID
  );
}

function isGithub() {
  return Boolean(process.env.GITHUB_REPOSITORY);
}

function repoName() {
  return process.env.GITHUB_REPOSITORY || process.env.CI_PROJECT_PATH || "";
}

const ON_GITLAB = isGitlab();
const ON_GITHUB = isGithub();
const REPO = repoName();

console.log(`MergeMind running... (${ON_GITLAB ? "GitLab CI" : "GitHub Actions"})`);

// Marker used to find and update our own PR comment on GitHub (dedupe — we
// never want a new comment per push to the same PR).
const GITHUB_COMMENT_MARKER = "<!-- mergemind:analysis -->";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Remote license validation — FAILS OPEN.
// Any inability to validate (network error, 5xx, timeout) degrades to the
// free tier with a warning instead of failing the CI run. A deliberately
// invalid/expired key (HTTP 200, valid:false) also warns rather than blocks.
// ---------------------------------------------------------------------------
async function validateLicense(key) {
  if (!key) return { valid: false, plan: "free" };

  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(MERGEMIND_VALIDATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, repo: repoName() }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) return await res.json();

      // 5xx = server hiccup → retry, then fall back to free.
      if (res.status >= 500) {
        lastError = new Error(`validation server returned ${res.status}`);
      } else {
        // 4xx = endpoint misconfigured or key malformed — no point retrying.
        console.warn(
          `Warning: MergeMind validation returned ${res.status} — running as free tier.`
        );
        return { valid: false, plan: "free", _unreachable: true };
      }
    } catch (err) {
      lastError = err;
    }
    await sleep(500 * (attempt + 1));
  }

  console.warn(
    `Warning: Could not reach MergeMind validation server (${lastError?.message || "unknown"}) — running as free tier.`
  );
  return { valid: false, plan: "free", _unreachable: true };
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

function truncate(output, limit) {
  if (output.length <= limit) return output;
  return output.slice(0, limit) + "\n\n… (truncated — see job log for full output)";
}

// ---------------------------------------------------------------------------
// Output — GitHub PR comment (create-or-update), GitLab MR note, or console
// ---------------------------------------------------------------------------
function getGithubPrNumber() {
  // GitHub Actions writes the full event payload (with pull_request.number)
  // to GITHUB_EVENT_PATH. Runs triggered by push (not PR) have no number.
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) return null;
    const event = JSON.parse(readFileSync(eventPath, "utf8"));
    return event?.pull_request?.number ?? null;
  } catch {
    return null;
  }
}

async function postGithubComment(output) {
  if (!isGithub()) return false;
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("GitHub Actions detected but no GITHUB_TOKEN set — see job log for output.");
    return false;
  }

  const prNumber = getGithubPrNumber();
  if (!prNumber) {
    // Push run (no PR) — nothing to comment on.
    return false;
  }

  const [owner, repo] = repoName().split("/");
  if (!owner || !repo) return false;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  const body = truncate(`${GITHUB_COMMENT_MARKER}\n\n${output}`, 30000);

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mergemind",
    };

    // 1. Find our existing comment on this PR (dedupe across pushes).
    let existingId = null;
    const listRes = await fetch(
      `${apiBase}/issues/${prNumber}/comments?per_page=100`,
      { headers, signal: AbortSignal.timeout(15000) }
    );
    if (listRes.ok) {
      const comments = await listRes.json();
      existingId =
        comments.find((c) => c.body?.includes(GITHUB_COMMENT_MARKER))?.id ??
        null;
    }

    // 2. Update the existing comment, or create a new one.
    const res = existingId
      ? await fetch(`${apiBase}/issues/comments/${existingId}`, {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
          signal: AbortSignal.timeout(15000),
        })
      : await fetch(`${apiBase}/issues/${prNumber}/comments`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
          signal: AbortSignal.timeout(15000),
        });

    if (!res.ok) {
      console.warn(
        `GitHub comment ${existingId ? "update" : "create"} failed (${res.status}) — see job log for output.`
      );
      return false;
    }

    console.log(
      existingId
        ? `Updated MergeMind analysis on PR #${prNumber}.`
        : `Posted MergeMind analysis to PR #${prNumber}.`
    );
    return true;
  } catch (err) {
    console.warn("Could not post GitHub comment:", err.message);
    return false;
  }
}

async function postGitlabNote(output) {
  if (!isGitlab()) return false;
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
        body: JSON.stringify({ body: truncate(output, 10000) }),
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
async function run({ diffOverride } = {}) {
  // 1. Validate license — fails open to free tier, never blocks CI.
  const license = await validateLicense(MERGEMIND_LICENSE_KEY);
  const isPro = license.valid && license.plan !== "free";

  if (MERGEMIND_LICENSE_KEY && !license.valid) {
    console.warn(
      license._unreachable
        ? "MergeMind license could not be validated (server unreachable) — running as FREE tier."
        : "Invalid or expired MergeMind license — running as FREE tier. Visit mergemind.dev to get a key."
    );
  }

  console.log(`Plan: ${isPro ? license.plan.toUpperCase() : "FREE"}`);

  // 2. Get diff
  const diff = diffOverride ?? getDiff();

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

Analyze this ${isGitlab() ? "GitLab merge request" : "GitHub pull request"} diff and return:

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

    if (!response.ok) {
      let detail = "";
      try {
        const errBody = await response.json();
        detail = errBody?.error?.message || JSON.stringify(errBody);
      } catch {}
      console.error(
        `OpenAI API error ${response.status}: ${detail || "unknown"} (check your OPENAI_API_KEY and billing)`
      );
      process.exit(1);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "No output";

    // 5. Post to the PR (GitHub first, then GitLab), else log.
    const posted =
      (await postGithubComment(output)) || (await postGitlabNote(output));
    if (!posted) console.log(output);
  } catch (err) {
    console.error("OpenAI call failed:", err.message);
    process.exit(1);
  }
}

// Allow importing for tests without auto-running.
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) run();

export {
  validateLicense,
  getDiff,
  getGithubPrNumber,
  postGithubComment,
  postGitlabNote,
  run,
};