 // api/src/app.ts
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// --- Robust .env loader (works in dev + prod) ---
const envCandidates = [
  path.resolve(process.cwd(), ".env"),            // when started from repo root
  path.resolve(__dirname, "../../../.env"),       // dist/api/src -> repo/.env
  path.resolve(__dirname, "../../.env"),          // api/src -> repo/.env (ts-node)
];

let loadedFrom = "none";
for (const p of envCandidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedFrom = p;
    break;
  }
}

// Visible boot diagnostics
console.log("[ENV] loaded .env from:", loadedFrom);
console.log("[ENV] __dirname:", __dirname);
console.log("DEBUG boot: PRICE_PRO_MONTHLY =", process.env.PRICE_PRO_MONTHLY);

// --- App setup ---
const app = express();

// CORS for your UI (adjust if you serve from a different origin)
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:5173",
    credentials: true,
  })
);

// --- Routes (import AFTER env so they can read process.env) ---
import billingRoutes from "./routes/billing";
import webhookHandler from "./routes/stripe-webhook";

// Stripe webhook MUST use raw body and be mounted BEFORE express.json
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler
);

// Normal JSON for all other routes
app.use(express.json());

// Other API routes
app.use("/api", billingRoutes);

// Health check
app.get("/", (_req, res) => res.send("OK"));

// Start
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`API running on :${port}`);
  console.log("CORS origin:", process.env.APP_URL || "http://localhost:5173");
});
