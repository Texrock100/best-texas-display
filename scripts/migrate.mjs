// Runs a .sql file against DATABASE_URL.
// Usage: node scripts/migrate.mjs scripts/migrate-auth.sql
import { readFileSync, existsSync } from "node:fs";
import { Client } from "pg";

// Load environment from .env.local / .env (so DATABASE_URL is available without extra setup).
for (const envFile of [".env.local", ".env"]) {
  if (!existsSync(envFile)) continue;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/migrate.mjs <path-to.sql>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to your environment or .env first.");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new Client({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ Applied ${file}`);
} catch (err) {
  console.error(`✗ Failed to apply ${file}:`, err.message);
  process.exit(1);
} finally {
  await client.end();
}
