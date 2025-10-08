import fs from "fs";
import path from "path";
import { generateLicenseKey } from "../src/license";

const OUTPUT_FILE = path.join(__dirname, "../data/licenses.csv");

// How many keys to generate per plan
const NUM_KEYS = 50;

const plans = ["Startup", "Enterprise", "Pro"];

function generateKeys() {
  let rows: string[] = [];

  for (const plan of plans) {
    for (let i = 0; i < NUM_KEYS; i++) {
      const key = generateLicenseKey();
      rows.push(`${plan},${key}`);
    }
  }

  return rows;
}

function main() {
  const rows = generateKeys();

  if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, "plan,license_key\n" + rows.join("\n"), "utf8");
  console.log(`✅ Generated ${rows.length} license keys into ${OUTPUT_FILE}`);
}

main();
