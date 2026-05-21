import { NextResponse } from "next/server";
import { AdvancedStateError, GoogleSheetsConfigError, updateLeadInSheet } from "@/lib/server/googleSheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await updateLeadInSheet({
      tab: body.tab,
      lead_id: body.lead_id,
      row_number: body.row_number,
      updates: body.updates ?? {},
      confirmAdvancedState: Boolean(body.confirmAdvancedState),
      incrementContactCount: Boolean(body.incrementContactCount),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const status =
      error instanceof AdvancedStateError
        ? 409
        : error instanceof GoogleSheetsConfigError
          ? 503
          : 500;
    return NextResponse.json(
      {
        ok: false,
        requiresConfirmation: error instanceof AdvancedStateError,
        error: error instanceof Error ? error.message : "No pude actualizar el prospecto.",
      },
      { status },
    );
  }
}
