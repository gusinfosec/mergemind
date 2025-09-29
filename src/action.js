console.log("MergeMind Action running…");

// --- API key check
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ No API key found");
  process.exit(1);
}
console.log("✅ API key detected (length:", process.env.OPENAI_API_KEY.length, ")");

// --- imports
import { Octokit } from "@octokit/rest";
import { generateFromDiff } from "./lib/generator.js";
import fs from "fs";

// --- env vars from GitHub
const {
  GITHUB_TOKEN,
  GITHUB_REPOSITORY, // owner/repo
  GITHUB_EVENT_PATH, // path to JSON event
  OPENAI_API_KEY
} = process.env;

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_EVENT_PATH) {
  console.error("❌ Missing one of GITHUB_TOKEN, GITHUB_REPOSITORY, or GITHUB_EVENT_PATH");
  process.exit(1);
}

// Parse the event payload to get PR number, etc.
const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, "utf8"));
const prNumber = event.pull_request ? event.pull_request.number : null;

if (!prNumber) {
  console.log("ℹ️ No PR number found in event — exiting.");
  process.exit(0);
}

// --- GitHub client
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Example usage
console.log(`🔧 Repo: ${GITHUB_REPOSITORY}, PR: ${prNumber}`);

// Here you’d call generateFromDiff and post the comment
// const diff = ...;
// const description = await generateFromDiff(diff, OPENAI_API_KEY);
// await octokit.issues.createComment({ ... });
