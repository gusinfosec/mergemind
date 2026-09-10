import { Router } from "express";
import Stripe from "stripe";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  // Match the types bundled with your installed stripe package
  apiVersion: "2023-10-16",
});

// The public site, not the API host. Success/cancel redirects must land on
// mergemind.dev (the site), never on api.mergemind.dev.
const SITE_URL = process.env.SITE_URL || "https://mergemind.dev";

router.post("/checkout", async (req, res) => {
  try {
    const { plan, priceId, email } = req.body || {};

    const price =
      priceId ||
      (plan === "license" ? process.env.PRICE_LICENSE : undefined);

    if (!price) return res.status(400).json({ error: "Unknown plan/priceId" });
    if (!email) return res.status(400).json({ error: "email required" });

    // One-time license = single payment. Only recurring plans should be
    // subscriptions — if a team/monthly plan is added, pass mode explicitly.
    const isSubscription =
      (plan === "team" || plan === "pro") && process.env.PRICE_TEAM_MONTHLY;

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price, quantity: 1 }],
      customer_email: email,
      metadata: { plan: isSubscription ? "team" : "license" },
      success_url: SITE_URL + "/success",
      cancel_url: SITE_URL + "/#pricing",
    });

    return res.json({ url: session.url });
  } catch (e: any) {
    console.error("Checkout exception:", e);
    const msg =
      e?.raw?.message || e?.message || "Checkout failed (see server logs)";
    return res.status(400).json({ error: msg });
  }
});

export default router;