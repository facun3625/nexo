import { NextRequest, NextResponse } from "next/server";

import { createDatabaseBackup } from "@/lib/backup";
import { secretMatches } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !secretMatches(req.headers.get("authorization"), cronSecret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await createDatabaseBackup();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Backup falló" },
      { status: 500 },
    );
  }
}
