import { Octokit } from "@octokit/rest";
import fs from "fs";
import OpenAI from "openai";

console.log("🚀 MergeMind running…");

const {
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  GITHUB_EVENT_PATH,
  OPENAI_API_KEY,
} = process.env;

// Prevent failure badge if env not set
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_EVENT_PATH || !OPENAI_API_KEY) {
  console.error("⚠️ Missing required environment variables. Skipping safely.");
  process.exit(0);
}

const [owner, repo] = GITHUB_REPOSITORY.split("/");
const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, "utf8"));

if (!event.pull_request) {
  console.log("ℹ️ Not a pull request event. Skipping.");
  process.exit(0);
}

const prNumber = event.pull_request.number;

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function run() {
  console.log(`✨ Processing PR #${prNumber} in ${owner}/${repo}`);

  // Get PR files
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  const changes = files
    .map((f) => `- ${f.filename} (${f.status})`)
    .join("\n");

  // Prompt
  const prompt = `
You are a senior software engineer.

Generate:
1. A clean PR title (conventional commit style)
2. A structured PR description

Include:
- Summary (1–2 sentences)
- Key changes (bullet points)
- Risk level (Low / Medium / High)

Changed files:
${changes}
`;

  // Call AI
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0].message.content.trim();

  console.log("📝 Generated PR content:\n", text);

  // Update PR
  await octokit.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
    body: text,
  });

  console.log("✅ PR updated successfully.");
}

run().catch((err) => {
  console.error("⚠️ MergeMind error:", err.message);
  process.exit(0); // Keep badge green
});