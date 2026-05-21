import { NextResponse } from "next/server";
import { GoogleSheetsConfigError, readBatches } from "@/lib/server/googleSheets";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await readBatches();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const status = error instanceof GoogleSheetsConfigError ? 503 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No pude leer los lotes.",
      },
      { status },
    );
  }
}
