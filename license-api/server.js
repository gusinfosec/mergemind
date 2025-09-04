tee license-api/server.js > /dev/null <<'EOF'
import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const licensesPath = path.join(process.cwd(), "licenses.json");

// Stripe webhook (raw body required)
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const email = session.customer_details?.email || "unknown";
        const licenseKey = crypto.randomUUID();

        let store = {};
        if (fs.existsSync(licensesPath)) {
          store = JSON.parse(fs.readFileSync(licensesPath, "utf8"));
        }
        store[licenseKey] = {
          email,
          createdAt: new Date().toISOString(),
          active: true,
        };
        fs.writeFileSync(licensesPath, JSON.stringify(store, null, 2));

        console.log("✅ Issued license for", email, licenseKey);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook error", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// JSON body for normal endpoints
app.use(cors());
app.use(bodyParser.json());

// Verify license
app.get("/license/verify", (req, res) => {
  const key = req.query.key;
  if (!key) return res.status(400).json({ ok: false, reason: "missing_key" });
  if (!fs.existsSync(licensesPath))
    return res.json({ ok: false, reason: "no_store" });

  const store = JSON.parse(fs.readFileSync(licensesPath, "utf8"));
  const lic = store[key];
  if (!lic || !lic.active)
    return res.json({ ok: false, reason: "not_found_or_inactive" });

  return res.json({ ok: true, plan: "pro", email: lic.email });
});

// Health
app.get("/healthz", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 License API running on port ${port}`));
EOF
