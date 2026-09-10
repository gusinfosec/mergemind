// api/src/lib/email.ts
// License delivery email via Resend (plain fetch — no SDK needed).
// Mirrors the pattern already used across CGT (review-site contact, compliance-ai).
//
// Env vars:
//   RESEND_API_KEY  — shared CGT Resend key (same as other products)
//   EMAIL_FROM      — sender; the domain MUST be verified in Resend.
//                     cyberglobal.ai is verified; defaults to noreply@cyberglobal.ai.
//                     If mergemind.dev is ever verified in Resend, set
//                     EMAIL_FROM=team@mergemind.dev.

const RESEND_URL = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function buildLicenseEmail(to: string, licenseKey: string, plan: string) {
  const subject =
    plan === "team"
      ? "Your MergeMind Team License Key"
      : "Your MergeMind License Key";

  const text = `Thanks for purchasing MergeMind (${plan} plan)!

Your license key:
${licenseKey}

How to use it:
1. In your repo, go to Settings → Secrets and variables → Actions → New repository secret.
2. Add the secret MERGEMIND_LICENSE_KEY with the value above.
3. Open a pull request — MergeMind runs automatically and validates the key.

The key is tied to the email address used at checkout: ${to}

Questions? Reply to this email or contact info@cyberglobal.ai.

– The MergeMind Team
`;

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h2 style="margin: 0 0 16px;">Thanks for purchasing <strong>MergeMind</strong>!</h2>
      <p style="margin: 0 0 8px;">Plan: <strong>${plan}</strong></p>
      <p style="margin: 0 0 20px;">Your license key:</p>
      <p style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-family: Menlo, Consolas, monospace; font-size: 14px; word-break: break-all;">${licenseKey}</p>
      <ol style="margin: 20px 0; padding-left: 20px; line-height: 1.7; color: #334155;">
        <li>In your repo: <strong>Settings → Secrets and variables → Actions → New repository secret</strong>.</li>
        <li>Add <code>MERGEMIND_LICENSE_KEY</code> with the value above.</li>
        <li>Open a pull request — MergeMind runs automatically and unlocks the full compliance mapping.</li>
      </ol>
      <p style="color: #64748b; font-size: 13px;">The key is tied to ${to}. Questions? Reply to this email or contact info@cyberglobal.ai.</p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">– The MergeMind Team</p>
    </div>
  `;

  return { subject, text, html };
}

export async function sendLicenseEmail(
  to: string,
  licenseKey: string,
  plan: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  if (!to || !to.includes("@")) throw new Error("invalid recipient email");

  const from = process.env.EMAIL_FROM || "noreply@cyberglobal.ai";
  const mail = buildLicenseEmail(to, licenseKey, plan);

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject: mail.subject, text: mail.text, html: mail.html }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error ${res.status}: ${errText}`);
  }
}