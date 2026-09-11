import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, rmSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// Import the action module (it only auto-runs when executed directly).
const mod = await import("../src/action.js");

const {
  validateLicense,
  postGithubComment,
  postGitlabNote,
  getGithubPrNumber,
  cleanCitations,
} = mod;

let tmpDir;

function setEnv(vars) {
  const prev = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return () => {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
}

function writeEvent(payload) {
  const file = path.join(tmpDir, "event.json");
  writeFileSync(file, JSON.stringify(payload));
  return file;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), "mm-test-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── validateLicense ─────────────────────────────────────────────────────────

test("validateLicense: no key → free tier", async () => {
  const restore = setEnv({ MERGEMIND_VALIDATION_URL: "https://example.test/val" });
  try {
    const result = await validateLicense(undefined);
    assert.deepEqual(result, { valid: false, plan: "free" });
  } finally {
    restore();
  }
});

test("validateLicense: valid key → returns record", async () => {
  const restore = setEnv({ MERGEMIND_VALIDATION_URL: "https://example.test/val" });
  const origFetch = global.fetch;
  global.fetch = async () => jsonResponse({ valid: true, plan: "license" });
  try {
    const result = await validateLicense("mm_live_test");
    assert.equal(result.valid, true);
    assert.equal(result.plan, "license");
  } finally {
    global.fetch = origFetch;
    restore();
  }
});

test("validateLicense: network error → fails open to free, flagged unreachable", async () => {
  const restore = setEnv({ MERGEMIND_VALIDATION_URL: "https://example.test/val" });
  const origFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("ECONNREFUSED");
  };
  try {
    const result = await validateLicense("mm_live_test");
    assert.equal(result.valid, false);
    assert.equal(result.plan, "free");
    assert.equal(result._unreachable, true);
  } finally {
    global.fetch = origFetch;
    restore();
  }
});

test("validateLicense: 5xx → retries, then fails open", async () => {
  const restore = setEnv({ MERGEMIND_VALIDATION_URL: "https://example.test/val" });
  const origFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return jsonResponse({ error: "boom" }, 500);
  };
  try {
    const result = await validateLicense("mm_live_test");
    assert.equal(result.valid, false);
    assert.equal(result._unreachable, true);
    assert.ok(calls >= 3, `expected retries, got ${calls} calls`);
  } finally {
    global.fetch = origFetch;
    restore();
  }
});

test("validateLicense: 4xx → fails open without retrying", async () => {
  const restore = setEnv({ MERGEMIND_VALIDATION_URL: "https://example.test/val" });
  const origFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return jsonResponse({ error: "nope" }, 400);
  };
  try {
    const result = await validateLicense("mm_live_test");
    assert.equal(result.valid, false);
    assert.equal(result._unreachable, true);
    assert.equal(calls, 1, "should not retry on 4xx");
  } finally {
    global.fetch = origFetch;
    restore();
  }
});

// ── cleanCitations ──────────────────────────────────────────────────────────

test("cleanCitations: drops ISO 27001:2013 numbering, keeps 2022", () => {
  const out = cleanCitations(
    [
      "## Compliance Mapping",
      "- **SOX (ITGC)**: access to programs and data",
      "- **SOC 2 (TSC 2017)**: CC6.1 (logical access controls)",
      "- **ISO/IEC 27001:2022**: A.9.2.3 (Management of privileged access rights)",
      "- **ISO/IEC 27001:2022**: A.8.5 (secure authentication) is also relevant",
    ].join("\n")
  );
  assert.ok(!out.includes("A.9.2.3"), "2013-era reference must not survive");
  assert.ok(out.includes("A.8.5"), "valid 2022 reference must be kept");
  assert.ok(out.includes("CC6.1"), "valid SOC 2 criterion must be kept");
  // The description survives even when the number is dropped.
  assert.ok(out.includes("Management of privileged access rights"));
});

test("cleanCitations: rejects a SOC 2 criterion placed under SOX", () => {
  const out = cleanCitations("- **SOX (ITGC)**: CC6.1 logical access");
  assert.ok(!out.includes("CC6.1"), "SOX has no CC numbering");
  assert.ok(out.includes("logical access"));
});

test("cleanCitations: rejects a real 2022 control under SOC 2 and vice versa", () => {
  const out = cleanCitations(
    [
      "- **SOC 2 (TSC 2017)**: A.8.15 (logging)",
      "- **ISO/IEC 27001:2022**: CC7.2 (monitoring)",
    ].join("\n")
  );
  assert.ok(!out.includes("A.8.15"), "Annex A ref under SOC 2 is wrong");
  assert.ok(!out.includes("CC7.2"), "CC ref under ISO is wrong");
});

test("cleanCitations: accepts every valid 2022 Annex A range boundary", () => {
  for (const ref of ["A.5.1", "A.5.37", "A.6.1", "A.6.8", "A.7.1", "A.7.14", "A.8.1", "A.8.34"]) {
    assert.ok(
      cleanCitations(`- **ISO/IEC 27001:2022**: ${ref} (x)`).includes(ref),
      `${ref} should be accepted`
    );
  }
  for (const ref of ["A.5.38", "A.9.1", "A.12.6", "A.18.1"]) {
    assert.ok(
      !cleanCitations(`- **ISO/IEC 27001:2022**: ${ref} (x)`).includes(ref),
      `${ref} should be rejected`
    );
  }
});

test("cleanCitations: leaves prose and non-framework lines untouched", () => {
  const input = "## Summary\nThis adds CC6.1 hooks and A.9.4 shims to the diff.";
  assert.equal(cleanCitations(input), input);
});

// ── postGithubComment ───────────────────────────────────────────────────────

test("postGithubComment: returns false when not on GitHub", async () => {
  const restore = setEnv({ GITHUB_REPOSITORY: undefined, GITHUB_TOKEN: undefined });
  try {
    assert.equal(await postGithubComment("output"), false);
  } finally {
    restore();
  }
});

test("postGithubComment: creates a comment when none exists", async () => {
  const restore = setEnv({
    GITHUB_REPOSITORY: "gusinfosec/mergemind",
    GITHUB_TOKEN: "gh_test",
    GITHUB_EVENT_PATH: writeEvent({ pull_request: { number: 42 } }),
  });
  const origFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || "GET" });
    if (url.includes("/issues/42/comments?per_page=100")) return jsonResponse([]);
    if (url.endsWith("/issues/42/comments") && opts.method === "POST") {
      return jsonResponse({ id: 123 }, 201);
    }
    return jsonResponse({}, 404);
  };
  try {
    const posted = await postGithubComment("## PR Title");
    assert.equal(posted, true);
    assert.equal(calls.length, 2);
    const post = calls[1];
    assert.equal(post.method, "POST");
    assert.ok(post.url.includes("/issues/42/comments"));
  } finally {
    global.fetch = origFetch;
    restore();
  }
});

test("postGithubComment: updates existing comment (dedupe) instead of creating", async () => {
  const restore = setEnv({
    GITHUB_REPOSITORY: "gusinfosec/mergemind",
    GITHUB_TOKEN: "gh_test",
    GITHUB_EVENT_PATH: writeEvent({ pull_request: { number: 7 } }),
  });
  const origFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || "GET" });
    if (url.includes("/issues/7/comments?per_page=100")) {
      return jsonResponse([
        { id: 999, body: "old <!-- mergemind:analysis -->" },
        { id: 888, body: "someone else's comment" },
      ]);
    }
    if (url.endsWith("/issues/comments/999") && opts.method === "PATCH") {
      return jsonResponse({ id: 999 });
    }
    return jsonResponse({}, 404);
  };
  try {
    const posted = await postGithubComment("## New output");
    assert.equal(posted, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].method, "PATCH");
    assert.ok(calls[1].url.includes("/issues/comments/999"));
  } finally {
    global.fetch = origFetch;
    restore();
  }
});

test("postGithubComment: returns false on push runs (no PR number)", async () => {
  const restore = setEnv({
    GITHUB_REPOSITORY: "gusinfosec/mergemind",
    GITHUB_TOKEN: "gh_test",
    GITHUB_EVENT_PATH: writeEvent({ ref: "refs/heads/main" }),
  });
  try {
    assert.equal(await postGithubComment("output"), false);
  } finally {
    restore();
  }
});

// ── postGitlabNote ──────────────────────────────────────────────────────────

test("postGitlabNote: returns false when not on GitLab", async () => {
  const restore = setEnv({ CI_PROJECT_ID: undefined, CI_MERGE_REQUEST_IID: undefined });
  try {
    assert.equal(await postGitlabNote("output"), false);
  } finally {
    restore();
  }
});

test("run: OpenAI non-OK response exits with error message", async () => {
  const restore = setEnv({
    GITHUB_REPOSITORY: "gusinfosec/mergemind",
    GITHUB_TOKEN: "gh_test",
    GITHUB_EVENT_PATH: writeEvent({ pull_request: { number: 42 } }),
  });
  const origFetch = global.fetch;
  const origExit = process.exit;
  let exitCode = null;
  const calls = [];
  global.fetch = async (url, opts = {}) => {
    calls.push(url);
    if (url.includes("/api/validate-key")) {
      return jsonResponse({ valid: true, plan: "license" });
    }
    if (url.includes("api.openai.com")) {
      return new Response(
        JSON.stringify({ error: { message: "Incorrect API key provided" } }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return jsonResponse({}, 404);
  };
  process.exit = (code) => {
    exitCode = code;
    throw new Error("exit");
  };
  try {
    await assert.rejects(() => mod.run({ diffOverride: "diff content" }), /exit/);
    assert.equal(exitCode, 1);
    assert.ok(calls.some((u) => u.includes("api.openai.com")));
  } finally {
    process.exit = origExit;
    global.fetch = origFetch;
    restore();
  }
});

test("getGithubPrNumber: parses PR number from event payload", () => {
  const restore = setEnv({
    GITHUB_EVENT_PATH: writeEvent({ pull_request: { number: 1337 } }),
  });
  try {
    assert.equal(getGithubPrNumber(), 1337);
  } finally {
    restore();
  }
});

test("getGithubPrNumber: null when no pull_request in payload", () => {
  const restore = setEnv({ GITHUB_EVENT_PATH: writeEvent({ ref: "x" }) });
  try {
    assert.equal(getGithubPrNumber(), null);
  } finally {
    restore();
  }
});