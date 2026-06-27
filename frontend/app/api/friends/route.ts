// frontend/app/api/friends/route.ts
//
// Serves the hardcoded DEMO friends for the Leaderboard. The live user row is
// computed client-side from localStorage and merged in by the component.

import { NextResponse } from "next/server";
import { FRIENDS } from "@backend/data/friends";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ friends: FRIENDS });
}
