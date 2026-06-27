import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// The keys live in the repo-root .env (one level up from this frontend app).
// Next only auto-loads env files from its own dir, so we load the root .env here
// and copy any keys that aren't already set. Server-only — never logged.
function loadRootEnv() {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.join(here, "..", ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // best-effort; agents fall back to cache/mock if keys are missing
  }
}
loadRootEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The pipeline agents live in ../backend (outside this app dir). Next needs
  // externalDir to transpile and import TypeScript modules from there.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
