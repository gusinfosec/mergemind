import fs from "fs";
import path from "path";

const DB_FILE = path.join(__dirname, "../licenses.json");

export function generateLicenseKey(): string {
  return "LIC-" + Math.random().toString(36).substring(2, 15).toUpperCase();
}

export async function storeLicense(email: string, key: string) {
  let data: Record<string, string> = {};
  if (fs.existsSync(DB_FILE)) {
    data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  }
  data[email] = key;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
