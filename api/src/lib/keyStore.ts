import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

export type Plan = "free" | "pro" | "team";

export interface LicenseRecord {
  key: string;
  email: string;
  plan: Plan;
  createdAt: string;
  active: boolean;
}

interface Store {
  keys: Record<string, LicenseRecord>;
}

const DB_PATH =
  process.env.KEYS_DB_PATH ||
  path.join(process.cwd(), "api", "data", "keys.json");

function read(): Store {
  try {
    if (!fs.existsSync(DB_PATH)) return { keys: {} };
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return { keys: {} };
  }
}

function write(store: Store): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function generateKey(): string {
  return "mm_live_" + randomBytes(16).toString("hex");
}

export function createLicense(email: string, plan: Plan): LicenseRecord {
  const store = read();
  const record: LicenseRecord = {
    key: generateKey(),
    email,
    plan,
    createdAt: new Date().toISOString(),
    active: true,
  };
  store.keys[record.key] = record;
  write(store);
  return record;
}

export function validateKey(
  key: string
): { valid: true; record: LicenseRecord } | { valid: false } {
  if (!key) return { valid: false };
  const store = read();
  const record = store.keys[key];
  if (!record || !record.active) return { valid: false };
  return { valid: true, record };
}

export function revokeKey(key: string): boolean {
  const store = read();
  if (!store.keys[key]) return false;
  store.keys[key].active = false;
  write(store);
  return true;
}

export function listLicenses(): LicenseRecord[] {
  const store = read();
  return Object.values(store.keys);
}
