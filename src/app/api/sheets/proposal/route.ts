import { NextResponse } from "next/server";
import { GoogleSheetsConfigError, saveProposal } from "@/lib/server/googleSheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveProposal({
      lead_id: body.lead_id,
      row_number: body.row_number,
      nombre_negocio: body.nombre_negocio,
      nicho: body.nicho,
      oferta: body.oferta,
      ticket_rd: body.ticket_rd,
      demo_url: body.demo_url,
      canal_envio: body.canal_envio,
      estado_propuesta: body.estado_propuesta,
      monto_estimado_rd: body.monto_estimado_rd,
      link_propuesta: body.link_propuesta,
      notas_propuesta: body.notas_propuesta,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const status = error instanceof GoogleSheetsConfigError ? 503 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No pude guardar la propuesta.",
      },
      { status },
    );
  }
}
