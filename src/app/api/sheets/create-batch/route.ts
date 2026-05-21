import { NextResponse } from "next/server";
import { createBatchFromSheet, GoogleSheetsConfigError } from "@/lib/server/googleSheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createBatchFromSheet({
      type: body.type,
      channel: body.channel,
      niche: body.niche,
      limit: body.limit,
      operador: body.operador,
      notas_batch: body.notas_batch,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const status = error instanceof GoogleSheetsConfigError ? 503 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No pude crear el lote.",
      },
      { status },
    );
  }
}
