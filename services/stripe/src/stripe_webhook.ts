import { Request, Response } from "express";
import Stripe from "stripe";
import { generateLicenseKey, storeLicense } from "./license";
import { sendLicenseEmail } from "./email"; // 👈 new import

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export default async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;

    if (email) {
      const licenseKey = generateLicenseKey();
      await storeLicense(email, licenseKey);

      // Try to get plan from session metadata or price
      const plan =
        session.metadata?.plan ||
        (session.mode === "subscription" ? "Startup" : "Pro");

      try {
        await sendLicenseEmail(email, licenseKey, plan);
        console.log(`✅ License issued and emailed to ${email}: ${licenseKey}`);
      } catch (mailErr: any) {
        console.error("⚠️ Failed to send license email:", mailErr.message);
      }
    }
  }

  res.json({ received: true });
}
