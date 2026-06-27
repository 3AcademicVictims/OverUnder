// frontend/app/api/scan/route.ts
//
// The one API route. It is a thin bridge: it owns no business logic — it calls
// the backend pipeline agents (parse -> synthesis) and returns the ScanResult.
//
// POST { query: string }  ->  { result } | { error, suggestions }

import { NextResponse } from "next/server";
import { parseAgent } from "@backend/agents/parseAgent";
import { synthesisAgent } from "@backend/agents/synthesisAgent";
import { EVENTS } from "@backend/data/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let query = "";
  try {
    const body = await req.json();
    query = typeof body?.query === "string" ? body.query : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!query.trim()) {
    return NextResponse.json({ error: "Type something to scan." }, { status: 400 });
  }

  const parsed = parseAgent(query);
  if (!parsed.eventId) {
    return NextResponse.json(
      {
        error: `No demo market matches "${query.trim()}".`,
        suggestions: EVENTS.map((e) => ({ id: e.id, title: e.title })),
      },
      { status: 404 }
    );
  }

  try {
    const result = await synthesisAgent(parsed.eventId);
    if (!result) {
      return NextResponse.json({ error: "Could not build a result for that event." }, { status: 500 });
    }
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: "Pipeline error while scanning.", detail: String(err) },
      { status: 500 }
    );
  }
}
