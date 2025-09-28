 import { Router } from "express";
import Stripe from "stripe";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  // Match the types bundled with your installed stripe package
  apiVersion: "2023-10-16",
});

router.post("/checkout", async (req, res) => {
  try {
    const { plan, priceId, email } = req.body || {};

    const price =
      priceId ||
      (plan === "pro_monthly" ? process.env.PRICE_PRO_MONTHLY : undefined);

    if (!price) return res.status(400).json({ error: "Unknown plan/priceId" });
    if (!email) return res.status(400).json({ error: "email required" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: email,
      success_url: (process.env.APP_URL || "http://localhost:5173") + "/success",
      cancel_url: (process.env.APP_URL || "http://localhost:5173") + "/cancel",
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
