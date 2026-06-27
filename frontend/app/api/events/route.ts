// frontend/app/api/events/route.ts
//
// Lightweight list of the hardcoded demo events, used to render the "popular
// markets" quick-pick chips on the Scanner. No pricing here — just labels.

import { NextResponse } from "next/server";
import { EVENTS } from "@backend/data/events";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    events: EVENTS.map((e) => ({
      id: e.id,
      title: e.title,
      side: e.side,
      category: e.category,
    })),
  });
}
