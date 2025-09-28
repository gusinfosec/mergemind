import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import fs from "fs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { buildEmail } from "./emailTemplate.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe needs raw body to verify webhook signature
app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle completed checkout
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Which price ID was purchased?
      const priceId = session.metadata?.price_id || session.display_items?.[0]?.price?.id;

      let planName, downloadLink;
      if (priceId === process.env.PRICE_PRO_MONTHLY) {
        planName = "Pro";
        downloadLink = process.env.DOWNLOAD_LINK_PRO;
      } else if (priceId === process.env.PRICE_STARTUP_MONTHLY) {
        planName = "Startup";
        downloadLink = process.env.DOWNLOAD_LINK_STARTUP;
      } else if (priceId === process.env.PRICE_ENTERPRISE_MONTHLY) {
        planName = "Enterprise";
        downloadLink = process.env.DOWNLOAD_LINK_ENTERPRISE;
      } else {
        console.warn("⚠️ Unknown price ID:", priceId);
        return res.json({ received: true });
      }

      // Grab customer email
      const customerEmail = session.customer_details.email;

      // Grab license key (simple pool from file)
      let licenseKey = "TEMP-KEY";
      try {
        const keys = fs.readFileSync("license-keys.txt", "utf-8").split("\n").filter(Boolean);
        if (keys.length > 0) {
          licenseKey = keys[0];
          fs.writeFileSync("license-keys.txt", keys.slice(1).join("\n")); // consume key
        }
      } catch (e) {
        console.error("⚠️ Could not load license keys:", e.message);
      }

      // Build email
      const { subject, text, html } = buildEmail(planName, downloadLink, licenseKey);

      // Configure transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Send email
      transporter.sendMail(
        {
          from: process.env.FROM_EMAIL,
          to: customerEmail,
          subject,
          text,
          html,
        },
        (err, info) => {
          if (err) {
            console.error("❌ Error sending email:", err);
          } else {
            console.log("✅ Email sent:", info.response);
          }
        }
      );
    }

    res.json({ received: true });
  }
);

app.listen(port, () => {
  console.log(`🚀 Webhook server running on port ${port}`);
});
