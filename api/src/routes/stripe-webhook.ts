 import type { Request, Response } from "express";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  // Use the version your installed stripe types expect
  apiVersion: "2023-10-16",
});

const DATA_DIR = path.join(process.cwd(), "api", "data");
const CSV_PATH = path.join(DATA_DIR, "licenses.csv");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, "email,license,created\n", "utf8");
  }
}

function appendLicense(email: string, key: string) {
  ensureStore();
  const row = `${email},${key},${new Date().toISOString()}\n`;
  fs.appendFileSync(CSV_PATH, row, "utf8");
}

async function sendLicenseEmail(email: string, license: string) {
  // TODO: wire Nodemailer here; for now, log for visibility.
  console.log(`[email] would send to ${email}: ${license}`);
}

// 👉 Make handler ASYNC so we can await safely.
const handler = async (req: Request, res: Response) => {
  try {
    const sig = req.headers["stripe-signature"] as string;
    const whsec = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!whsec) {
      console.error("Webhook secret missing");
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
        console.warn("[license] no email on session");
      } else {
        const license = randomUUID();
        appendLicense(email, license);
        await sendLicenseEmail(email, license);
        console.log("[license] issued + emailed", { email, license });
      }
    }

    return res.status(200).send("ok");
  } catch (e: any) {
    console.error("[webhook] verification/handler error:", e?.message || e);
    return res.status(400).send(`Webhook Error: ${e.message || "unknown"}`);
  }
};

export default handler;
