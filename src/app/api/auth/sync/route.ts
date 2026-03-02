import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Deprecated. Use /auth/callback." },
    { status: 410 },
  );
}
