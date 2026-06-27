// frontend/app/api/history/route.ts
//
// GET → shallow historical context for the 3 demo events (cached price snapshot
// + 1 cached Exa news call each). Thin bridge to historyAgent.

import { NextResponse } from "next/server";
import { historyAll } from "@backend/agents/historyAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cards = await historyAll();
    return NextResponse.json({ cards });
  } catch (err) {
    return NextResponse.json({ error: "Could not load history.", detail: String(err) }, { status: 500 });
  }
}
