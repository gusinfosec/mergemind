import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import stripeWebhook from "./stripe_webhook";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Stripe requires raw body for webhook verification
app.use("/webhook", bodyParser.raw({ type: "application/json" }));
app.post("/webhook", stripeWebhook);

app.listen(PORT, () => {
  console.log(`🚀 MergeMind Stripe webhook running on port ${PORT}`);
});
