import { NextResponse } from "next/server";
import { GoogleSheetsConfigError, getSheetsConfig, readLeadsFromSheet } from "@/lib/server/googleSheets";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const config = getSheetsConfig();
    const url = new URL(request.url);
    const requestedTab = url.searchParams.get("tab");
    const tab =
      requestedTab === "master"
        ? config.masterTab
        : requestedTab === "prospectos" || !requestedTab
          ? config.prospectosTab
          : requestedTab;
    const result = await readLeadsFromSheet(tab);
    return NextResponse.json({
      ok: true,
      source: "google_sheets",
      spreadsheet_id: config.spreadsheetId,
      ...result,
    });
  } catch (error) {
    const status = error instanceof GoogleSheetsConfigError ? 503 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No pude leer Google Sheets.",
      },
      { status },
    );
  }
}
