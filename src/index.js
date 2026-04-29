import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
  const diff = `
- auth.js (modified)
- session.js (modified)
- middleware.js (added)
`;

  const prompt = `
You are a senior engineer.

Generate:
- PR title
- Summary
- Key changes
- Risk level

Changed files:
${diff}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  console.log("\n🧪 Local Test Output:\n");
  console.log(response.choices[0].message.content);
}

run().catch(console.error);