 import type { Request, Response } from "express";
import Stripe from "stripe";
import { createLicense, setDeliveryStatus } from "../lib/keyStore";
import type { Plan } from "../lib/keyStore";
import { emailConfigured, sendLicenseEmail } from "../lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Map your Stripe price IDs to internal plan names via env vars.
// e.g. PRICE_LICENSE=price_xxx  PRICE_TEAM_MONTHLY=price_yyy
function resolvePlan(session: Stripe.Checkout.Session): Plan {
  const priceId =
    session.metadata?.price_id ||
    (session as any).display_items?.[0]?.price?.id ||
    "";

  if (priceId && priceId === process.env.PRICE_TEAM_MONTHLY) return "team";
  if (priceId && priceId === process.env.PRICE_LICENSE) return "license";

  // Fallback: infer from session metadata set at checkout creation time
  const metaPlan = (session.metadata?.plan || "").toLowerCase();
  if (metaPlan === "team") return "team";
  if (metaPlan === "pro" || metaPlan === "license") return "license";

  return "license"; // safe default for paid sessions
}

const handler = async (req: Request, res: Response) => {
  try {
    const sig = req.headers["stripe-signature"] as string;
    const whsec = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!whsec) {
      console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
      return res.status(500).send("whsec missing");
    }

    const buf = req.body as Buffer;
    if (!Buffer.isBuffer(buf)) {
      console.error("[webhook] no raw buffer");
      return res.status(400).send("no raw buffer");
    }

    const event = stripe.webhooks.constructEvent(buf, sig, whsec);
    console.log("[webhook] verified:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || session.customer_email;

      if (!email) {
        console.warn("[license] no email on session — skipping");
      } else {
        const plan = resolvePlan(session);
        const record = createLicense(email, plan);
        console.log(`[license] issued ${plan} key for ${email}: ${record.key}`);

        // Deliver the license key by email. Never let an email failure block or
        // fail the webhook (Stripe would retry and we'd mint a duplicate key) —
        // log it and record the status so it's visible via /api/admin/keys.
        try {
          if (!emailConfigured()) {
            throw new Error(
              "RESEND_API_KEY/EMAIL_FROM not set — key not emailed (retrieve via /api/admin/keys)"
            );
          }
          await sendLicenseEmail(email, record.key, plan);
          setDeliveryStatus(record.key, { sentAt: new Date().toISOString() });
          console.log(`[license] emailed ${plan} key to ${email}`);
        } catch (emailErr: any) {
          const msg = emailErr?.message || "unknown";
          setDeliveryStatus(record.key, { error: msg });
          console.error(`[license] email delivery FAILED for ${email}:`, msg);
        }

        // CGT analytics: record the signup (fire-and-forget, never blocks the webhook)
        // Supabase anon key comes from env (SUPABASE_ANON_KEY) - never hardcode.
        const anonKey = process.env.SUPABASE_ANON_KEY;
        if (anonKey) {
        fetch("https://seeamzqyctkjmaktfgdx.supabase.co/rest/v1/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: "Bearer " + anonKey,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            product: "mergemind",
            event_type: "signup",
            page_path: "/checkout",
            // test=true when the event came from Stripe test mode (livemode
            // false) — the dashboard filters these out so verification runs
            // never pollute real analytics.
            metadata: { plan, email, test: session.livemode === false },
          }),
        }).catch((e: any) => console.error("[analytics] signup failed:", e?.message || e));
        }
      }
    }

    return res.status(200).send("ok");
  } catch (e: any) {
    console.error("[webhook] error:", e?.message || e);
    return res.status(400).send(`Webhook Error: ${e.message || "unknown"}`);
  }
};

export default handler;
