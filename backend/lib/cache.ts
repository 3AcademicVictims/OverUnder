// backend/lib/cache.ts
//
// Tiny JSON cache used by every agent. Per AGENTS.md: cache every external API
// response to data/cache/*.json, and on any fetch failure read from cache so the
// demo renders even if every API is down.
//
// The Next.js app runs from /frontend, so cwd is the frontend dir at runtime.
// We resolve the cache dir relative to THIS module instead, which is robust no
// matter where the process is started.

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

function cacheDir(): string {
  // this file lives at backend/lib/cache.ts -> cache dir is ../data/cache
  let here: string;
  try {
    here = path.dirname(fileURLToPath(import.meta.url));
  } catch {
    // CJS fallback (Next may compile to CJS); __dirname is defined there.
    here = typeof __dirname !== "undefined" ? __dirname : path.join(process.cwd(), "..", "backend", "lib");
  }
  return path.join(here, "..", "data", "cache");
}

function fileFor(key: string): string {
  const safe = key.replace(/[^a-z0-9_-]/gi, "_");
  return path.join(cacheDir(), `${safe}.json`);
}

export interface CacheEnvelope<T> {
  key: string;
  fetchedAt: string;
  data: T;
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await fs.mkdir(cacheDir(), { recursive: true });
    const envelope: CacheEnvelope<T> = { key, fetchedAt: new Date().toISOString(), data };
    await fs.writeFile(fileFor(key), JSON.stringify(envelope, null, 2), "utf8");
  } catch {
    // Caching is best-effort; never let a write failure break the request.
  }
}

export async function readCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const raw = await fs.readFile(fileFor(key), "utf8");
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}
