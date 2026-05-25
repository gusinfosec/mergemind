import { Router, Request, Response, NextFunction } from "express";
import {
  validateKey,
  createLicense,
  revokeKey,
  listLicenses,
  Plan,
} from "../lib/keyStore";

const router = Router();

// ---------------------------------------------------------------------------
// Public — POST /api/validate-key
// ---------------------------------------------------------------------------
router.post("/validate-key", (req: Request, res: Response) => {
  const { key, repo } = req.body as { key?: string; repo?: string };

  if (!key) {
    return res.status(400).json({
      valid: false,
      plan: "free",
      message: "No license key provided.",
    });
  }

  const result = validateKey(key);

  if (!result.valid) {
    return res.status(200).json({
      valid: false,
      plan: "free",
      message:
        "Invalid or expired MergeMind license. Visit mergemind.dev to get a key.",
    });
  }

  console.log(
    `[license] validated key for ${result.record.email} (${result.record.plan})` +
      (repo ? ` on ${repo}` : "")
  );

  return res.status(200).json({
    valid: true,
    plan: result.record.plan,
    message: `License active — ${result.record.plan} plan.`,
  });
});

// ---------------------------------------------------------------------------
// Admin middleware — checks x-admin-secret header
// ---------------------------------------------------------------------------
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    console.error("[admin] ADMIN_SECRET env var not set");
    return res.status(500).json({ error: "Admin not configured on this server." });
  }
  if (req.headers["x-admin-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  next();
}

// ---------------------------------------------------------------------------
// Admin — POST /api/admin/keys  (create a key)
// ---------------------------------------------------------------------------
router.post("/admin/keys", requireAdmin, (req: Request, res: Response) => {
  const { email, plan } = req.body as { email?: string; plan?: string };

  if (!email) return res.status(400).json({ error: "email required" });

  const validPlans: Plan[] = ["free", "license", "team"];
  const resolvedPlan: Plan = validPlans.includes(plan as Plan)
    ? (plan as Plan)
    : "license";

  const record = createLicense(email, resolvedPlan);
  console.log(`[admin] created ${resolvedPlan} key for ${email}: ${record.key}`);

  return res.status(201).json({
    key: record.key,
    email: record.email,
    plan: record.plan,
    createdAt: record.createdAt,
  });
});

// ---------------------------------------------------------------------------
// Admin — DELETE /api/admin/keys/:key  (revoke a key)
// ---------------------------------------------------------------------------
router.delete("/admin/keys/:key", requireAdmin, (req: Request, res: Response) => {
  const { key } = req.params;
  const ok = revokeKey(key);
  if (!ok) return res.status(404).json({ error: "Key not found." });
  console.log(`[admin] revoked key: ${key}`);
  return res.json({ revoked: true, key });
});

// ---------------------------------------------------------------------------
// Admin — GET /api/admin/keys  (list all keys)
// ---------------------------------------------------------------------------
router.get("/admin/keys", requireAdmin, (_req: Request, res: Response) => {
  const licenses = listLicenses();
  return res.json({ count: licenses.length, licenses });
});

export default router;
