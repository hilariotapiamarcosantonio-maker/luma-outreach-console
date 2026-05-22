import "server-only";

import { google, sheets_v4 } from "googleapis";
import { parseRowsToContacts } from "@/lib/leadImport";
import {
  cleanPhone,
  getLeadBusinessName,
  getLeadDemo,
  getLeadOffer,
  getLeadTicket,
  getLeadWhatsAppNumber,
  getRecommendedChannel,
  hasValue,
  normalizeText,
  resolveLeadNiche,
} from "@/lib/utils";
import type { Contact, ContactStatus, NicheKey, RecommendedChannel } from "@/types";

type SheetValue = string | number | boolean;
type SheetRow = SheetValue[];
type SheetObject = Record<string, string>;
type BatchSummary = {
  total_evaluados: number;
  con_whatsapp: number;
  con_instagram: number;
  excluidos_estado_bloqueante: number;
  excluidos_falta_canal: number;
  excluidos_contacto_reciente: number;
  excluidos_lote_activo: number;
  sin_mensaje: number;
  incluidos_lote: number;
  motivo_principal: string;
};

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const DEFAULT_PROSPECTOS_TAB = "Prospectos";
const DEFAULT_MASTER_TAB = "Prospectos_Master";
const DEFAULT_BATCHES_TAB = "Daily_Batches";
const DEFAULT_PROPOSALS_TAB = "Proposals";
const READ_RANGE = "A1:AZ1000";

const MANUAL_PROTECTED_HEADERS = new Set([
  "Prioridad",
  "Nombre del negocio / perfil",
  "Nombre de la persona",
  "Cargo / rol",
  "Oficina / marca",
  "Nicho",
  "WhatsApp visible",
  "Boton WhatsApp",
  "Botón WhatsApp",
  "Correo",
  "Instagram",
  "Ciudad / zona",
  "Cantidad de inmuebles",
  "Reviews / reputacion",
  "Reviews / reputación",
  "Senal comercial relevante",
  "Señal comercial relevante",
  "Dolor probable",
  "Angulo de contacto",
  "Ángulo de contacto",
  "Fuente URL",
]);

const OUTREACH_WRITE_HEADERS = new Set([
  "Estado",
  "estado",
  "Proximo paso",
  "Pr\u00f3ximo paso",
  "proximo_paso",
  "Fecha de contacto",
  "fecha_contacto",
  "Fecha de seguimiento",
  "fecha_seguimiento",
  "Notas",
  "notas",
  "_oferta_recomendada",
  "_mensaje_instagram",
  "_asunto_email",
  "_mensaje_email",
  "_tipo_respuesta",
  "_ultimo_canal_usado",
  "ultimo_canal_usado",
  "_cantidad_contactos",
  "cantidad_contactos",
  "_ts_actualizacion",
  "updated_at",
  "_id",
  "propuesta_link",
  "material_link",
  "material_demo_link",
  "monto_estimado",
  "fecha_propuesta",
  "decision_status",
]);

const ADVANCED_STATUSES = new Set([
  "contactado",
  "respondio",
  "respondió",
  "interesado",
  "seguimiento",
  "llamada",
  "cita",
  "propuesta enviada",
  "propuesta_enviada",
  "negociando",
  "cerrado",
  "referido",
  "no interesado",
  "no_interesado",
  "descartado",
  "perdido",
]);

const BLOCKED_BATCH_STATUSES = new Set([
  "contactado",
  "respondio",
  "respondió",
  "interesado",
  "llamada",
  "cita",
  "propuesta enviada",
  "propuesta_enviada",
  "negociando",
  "cerrado",
  "referido",
  "no interesado",
  "no_interesado",
  "descartado",
  "perdido",
  "sin accion por ahora",
  "sin_accion_por_ahora",
]);

const STATUS_TO_SHEET: Record<string, string> = {
  pending: "Pendiente",
  pendiente: "Pendiente",
  listo_contacto: "Pendiente",
  failed: "Pendiente",
  contacted: "Contactado",
  contactado: "Contactado",
  replied: "Respondi\u00f3",
  respondio: "Respondi\u00f3",
  "respondi\u00f3": "Respondi\u00f3",
  interested: "Interesado",
  interesado: "Interesado",
  follow_up: "Seguimiento",
  seguimiento: "Seguimiento",
  call: "Llamada",
  appointment: "Llamada",
  llamada: "Llamada",
  proposal_sent: "Propuesta enviada",
  propuesta_enviada: "Propuesta enviada",
  negotiating: "Negociando",
  negociando: "Negociando",
  closed: "Cerrado",
  cerrado: "Cerrado",
  lost: "Perdido",
  not_interested: "No interesado",
  no_interesado: "No interesado",
  discarded: "Descartado",
  descartado: "Descartado",
  referred: "Referido",
  referido: "Referido",
  sin_accion_por_ahora: "Sin acci\u00f3n por ahora",
  needs_review: "Revisi\u00f3n",
  sin_canal: "Sin canal",
};

const FIELD_TO_HEADERS: Record<string, string[]> = {
  status: ["Estado", "estado"],
  estado: ["Estado", "estado"],
  proximo_paso: ["Pr\u00f3ximo paso", "Proximo paso", "proximo_paso"],
  nextStep: ["Pr\u00f3ximo paso", "Proximo paso", "proximo_paso"],
  fecha_contacto: ["Fecha de contacto", "fecha_contacto"],
  lastContactDate: ["Fecha de contacto", "fecha_contacto"],
  fecha_seguimiento: ["Fecha de seguimiento", "fecha_seguimiento"],
  followup_due_date: ["Fecha de seguimiento", "fecha_seguimiento"],
  notas: ["Notas", "notas"],
  notes: ["Notas", "notas"],
  conversation_summary: ["Notas", "notas"],
  oferta_recomendada: ["_oferta_recomendada"],
  mensaje_instagram: ["_mensaje_instagram"],
  asunto_email: ["_asunto_email"],
  mensaje_email: ["_mensaje_email"],
  tipo_respuesta: ["_tipo_respuesta"],
  ultimo_canal_usado: ["_ultimo_canal_usado", "ultimo_canal_usado"],
  last_channel: ["_ultimo_canal_usado", "ultimo_canal_usado"],
  cantidad_contactos: ["_cantidad_contactos", "cantidad_contactos"],
  sentCount: ["_cantidad_contactos", "cantidad_contactos"],
  fecha_ultima_actualizacion: ["_ts_actualizacion", "updated_at"],
  _ts_actualizacion: ["_ts_actualizacion", "updated_at"],
  id: ["_id"],
  _id: ["_id"],
  propuesta_link: ["propuesta_link"],
  material_link: ["material_link", "material_demo_link"],
  monto_estimado: ["monto_estimado"],
  fecha_propuesta: ["fecha_propuesta"],
  decision_status: ["decision_status"],
};

const HEADER_SCORE_WORDS = [
  "prioridad",
  "nombre",
  "negocio",
  "whatsapp",
  "estado",
  "notas",
  "_id",
  "_reporte_luma",
];

let sheetsClientPromise: Promise<sheets_v4.Sheets> | null = null;

export class GoogleSheetsConfigError extends Error {}

export class AdvancedStateError extends Error {
  status = 409;
}

export function getSheetsConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new GoogleSheetsConfigError("Google Sheets no esta configurado en variables de entorno.");
  }

  return {
    spreadsheetId,
    clientEmail,
    privateKey,
    prospectosTab: process.env.GOOGLE_SHEET_TAB_PROSPECTOS?.trim() || DEFAULT_PROSPECTOS_TAB,
    masterTab: process.env.GOOGLE_SHEET_TAB_MASTER?.trim() || DEFAULT_MASTER_TAB,
    batchesTab: DEFAULT_BATCHES_TAB,
    proposalsTab: DEFAULT_PROPOSALS_TAB,
    hubBaseUrl: process.env.LUMA_HUB_BASE_URL?.trim() || "https://luma-intelligence-hub.vercel.app",
  };
}

async function getSheetsClient() {
  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      const config = getSheetsConfig();
      const auth = new google.auth.JWT({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: SCOPES,
      });
      return google.sheets({ version: "v4", auth });
    })();
  }

  return sheetsClientPromise;
}

function escapeSheetName(tab: string) {
  return `'${tab.replace(/'/g, "''")}'`;
}

function columnLetter(index: number) {
  let column = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}

function normalizeComparable(value: unknown) {
  return normalizeText(value).replace(/[_\s-]+/g, " ").trim();
}

function scoreHeaderRow(row: unknown[]) {
  const values = row.map((item) => normalizeComparable(item));
  return values.reduce((score, value) => {
    if (!value) return score;
    if (value.startsWith("_")) return score + 2;
    if (HEADER_SCORE_WORDS.some((word) => value.includes(normalizeComparable(word)))) return score + 1;
    return score;
  }, 0);
}

function findHeaderRowIndex(rows: unknown[][]) {
  let bestIndex = 0;
  let bestScore = -1;
  rows.slice(0, 25).forEach((row, index) => {
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });
  return bestIndex;
}

function buildHeaderIndex(headers: string[]) {
  const map = new Map<string, number>();
  headers.forEach((header, index) => {
    if (!header) return;
    map.set(header, index);
    map.set(normalizeComparable(header), index);
  });
  return map;
}

function getHeaderIndex(headers: string[], candidates: string[]) {
  const map = buildHeaderIndex(headers);
  for (const candidate of candidates) {
    const exact = map.get(candidate);
    if (exact !== undefined) return exact;
    const normalized = map.get(normalizeComparable(candidate));
    if (normalized !== undefined) return normalized;
  }
  return undefined;
}

function getCell(row: unknown[], headers: string[], candidates: string[]) {
  const index = getHeaderIndex(headers, candidates);
  if (index === undefined) return "";
  return String(row[index] ?? "").trim();
}

function asRows(values: unknown[][] | null | undefined): string[][] {
  return (values ?? []).map((row) => row.map((cell) => String(cell ?? "")));
}

async function getValues(tab: string, range = READ_RANGE) {
  const sheets = await getSheetsClient();
  const { spreadsheetId } = getSheetsConfig();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${escapeSheetName(tab)}!${range}`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return asRows(response.data.values as unknown[][] | undefined);
}

export async function readSheetTable(tab: string) {
  const rows = await getValues(tab);
  const headerRowIndex = findHeaderRowIndex(rows);
  const headers = rows[headerRowIndex]?.map((value) => String(value ?? "").trim()) ?? [];
  const dataRows = rows.slice(headerRowIndex + 1);

  return {
    tab,
    rows,
    headers,
    dataRows,
    headerRowIndex,
    headerRowNumber: headerRowIndex + 1,
  };
}

function stableLeadId(lead: Contact, rowNumber?: number) {
  if (hasValue(lead.id) && !String(lead.id).startsWith("sheet:")) return String(lead.id);
  const niche = normalizeComparable(resolveLeadNiche(lead)).replace(/\s+/g, "_") || "lead";
  const phone = cleanPhone(lead.whatsapp || lead.phone || lead.telefono);
  if (phone) return `${niche}:${phone}`;
  if (hasValue(lead.correo || lead.email)) return `${niche}:email:${normalizeComparable(lead.correo || lead.email).replace(/\s+/g, "-")}`;
  if (hasValue(lead.instagram)) return `${niche}:ig:${normalizeComparable(lead.instagram).replace(/\s+/g, "-")}`;
  if (hasValue(lead.web || lead.audit_domain)) return `${niche}:web:${normalizeComparable(lead.web || lead.audit_domain).replace(/\s+/g, "-")}`;
  return `${niche}:row_${rowNumber ?? "unknown"}`;
}

export async function readLeadsFromSheet(tab?: string) {
  const config = getSheetsConfig();
  const sheetTab = tab || config.prospectosTab;
  const table = await readSheetTable(sheetTab);
  const parsed = parseRowsToContacts(table.rows, [], `Google Sheets: ${sheetTab}`, sheetTab);
  const idIndex = getHeaderIndex(table.headers, ["_id", "id"]);
  const contacts = parsed.contacts.map((lead) => {
    const rowNumber = lead.importedRow;
    const sheetId = idIndex !== undefined && rowNumber ? table.rows[rowNumber - 1]?.[idIndex] : "";
    const normalized: Contact = {
      ...lead,
      id: hasValue(sheetId) ? String(sheetId) : stableLeadId({ ...lead, id: "" }, rowNumber),
      row_number: rowNumber,
      sheet_tab: sheetTab,
      source_origin: "google_sheets",
      sourceFile: `Google Sheets: ${sheetTab}`,
      imported_file_name: `Google Sheets: ${sheetTab}`,
    };
    return normalized;
  });

  return {
    tab: sheetTab,
    headerRowNumber: table.headerRowNumber,
    headers: table.headers,
    contacts,
    report: parsed.report,
  };
}

export async function readBatches() {
  const { batchesTab } = getSheetsConfig();
  const table = await readSheetTable(batchesTab);
  const items = table.dataRows
    .filter((row) => row.some((value) => hasValue(value)))
    .map((row) => objectFromRow(table.headers, row));
  return { tab: batchesTab, batches: items };
}

function objectFromRow(headers: string[], row: unknown[]): SheetObject {
  return headers.reduce<SheetObject>((acc, header, index) => {
    if (header) acc[header] = String(row[index] ?? "");
    return acc;
  }, {});
}

function isAdvancedStatus(value: unknown) {
  return ADVANCED_STATUSES.has(normalizeComparable(value));
}

function isBlockedBatchStatus(value: unknown) {
  return BLOCKED_BATCH_STATUSES.has(normalizeComparable(value));
}

function sheetStatus(value: unknown) {
  const raw = String(value ?? "");
  const key = normalizeText(raw).replace(/[\s-]+/g, "_");
  return STATUS_TO_SHEET[key] || STATUS_TO_SHEET[raw] || raw;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function noteBlock(note: string) {
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  return `[Outreach ${stamp}] ${note.trim()}`;
}

function parseNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveTargetHeader(headers: string[], field: string) {
  const candidates = FIELD_TO_HEADERS[field] ?? [field];
  const index = getHeaderIndex(headers, candidates);
  if (index === undefined) return null;
  const header = headers[index];
  if (!OUTREACH_WRITE_HEADERS.has(header) || MANUAL_PROTECTED_HEADERS.has(header)) return null;
  return { header, index };
}

function buildAllowedUpdates(headers: string[], updates: Record<string, unknown>) {
  const result = new Map<string, unknown>();
  for (const [field, rawValue] of Object.entries(updates)) {
    const target = resolveTargetHeader(headers, field);
    if (!target) continue;
    if (target.header === "Notas") continue;
    const value = target.header === "Estado" ? sheetStatus(rawValue) : rawValue;
    result.set(target.header, value ?? "");
  }
  return result;
}

function getUpdateNote(updates: Record<string, unknown>) {
  const note = updates.notas ?? updates.notes ?? updates.conversation_summary;
  return hasValue(note) ? String(note) : "";
}

export async function updateLeadInSheet(input: {
  tab?: string;
  lead_id?: string;
  row_number?: number;
  updates: Record<string, unknown>;
  confirmAdvancedState?: boolean;
  incrementContactCount?: boolean;
}) {
  const config = getSheetsConfig();
  const tab = input.tab || config.prospectosTab;
  const table = await readSheetTable(tab);
  const idColumn = getHeaderIndex(table.headers, ["_id", "id"]);
  let rowNumber = input.row_number;

  if (!rowNumber && input.lead_id && idColumn !== undefined) {
    const found = table.rows.findIndex((row, index) => index > table.headerRowIndex && String(row[idColumn] ?? "") === input.lead_id);
    if (found >= 0) rowNumber = found + 1;
  }

  if (!rowNumber || rowNumber <= table.headerRowNumber) {
    throw new Error("No pude resolver la fila del prospecto en Sheets.");
  }

  const currentRow = table.rows[rowNumber - 1] ?? [];
  const currentStatus = getCell(currentRow, table.headers, ["Estado"]);
  const nextStatus = input.updates.status ?? input.updates.estado;
  if (nextStatus && sheetStatus(nextStatus) !== currentStatus && isAdvancedStatus(currentStatus) && !input.confirmAdvancedState) {
    throw new AdvancedStateError("El estado actual es avanzado. Reintenta con confirmAdvancedState=true.");
  }

  const now = new Date().toISOString();
  const writes = buildAllowedUpdates(table.headers, input.updates);
  writes.set("_ts_actualizacion", now);

  const idTarget = resolveTargetHeader(table.headers, "_id");
  if (idTarget && input.lead_id && !hasValue(currentRow[idTarget.index])) {
    writes.set("_id", input.lead_id);
  }

  const fechaContactoTarget = resolveTargetHeader(table.headers, "fecha_contacto");
  const isOutbound = Boolean(input.incrementContactCount);
  if (fechaContactoTarget && isOutbound && !hasValue(currentRow[fechaContactoTarget.index])) {
    writes.set(fechaContactoTarget.header, todayDate());
  }

  const countTarget = resolveTargetHeader(table.headers, "cantidad_contactos");
  if (countTarget && isOutbound) {
    const currentCount = parseNumber(currentRow[countTarget.index]);
    writes.set(countTarget.header, currentCount + 1);
  }

  const note = getUpdateNote(input.updates);
  const notesTarget = resolveTargetHeader(table.headers, "notas");
  if (notesTarget && note) {
    const existing = String(currentRow[notesTarget.index] ?? "").trim();
    writes.set(notesTarget.header, existing ? `${existing}\n\n${noteBlock(note)}` : noteBlock(note));
  }

  const data = Array.from(writes.entries()).flatMap(([header, value]) => {
    const index = getHeaderIndex(table.headers, [header]);
    if (index === undefined) return [];
    return {
      range: `${escapeSheetName(tab)}!${columnLetter(index + 1)}${rowNumber}`,
      values: [[value]],
    };
  });

  if (data.length === 0) {
    return { updated: false, row_number: rowNumber, tab, fields: [] as string[] };
  }

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: config.spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });

  return { updated: true, row_number: rowNumber, tab, fields: Array.from(writes.keys()) };
}

function priorityRank(value?: string) {
  const priority = normalizeComparable(value);
  if (priority.includes("alta") || priority === "1" || priority.includes("high")) return 0;
  if (priority.includes("media") || priority === "2" || priority.includes("medium")) return 1;
  if (priority.includes("baja") || priority === "3" || priority.includes("low")) return 2;
  return 3;
}

function channelRank(channel: RecommendedChannel) {
  const order: RecommendedChannel[] = ["whatsapp", "instagram", "email", "linkedin", "web", "manual", "llamada", "sin_canal"];
  return order.indexOf(channel);
}

function parseLeadIdsJson(value?: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(typeof item === "object" ? item.id ?? item.row_number : item));
  } catch {
    return String(value)
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isRecentlyContacted(lead: Contact) {
  const value = lead.fecha_contacto || lead.lastContactDate || lead.last_interaction_date;
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const ageMs = Date.now() - date.getTime();
  return ageMs >= 0 && ageMs < 1000 * 60 * 60 * 24 * 3;
}

function isPastOrToday(value?: string) {
  if (!value) return false;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date.getTime() <= today.getTime();
}

function isInBatchScope(lead: Contact, niche?: NicheKey | "all") {
  return !niche || niche === "all" || resolveLeadNiche(lead) === niche;
}

function hasRequestedBatchChannel(lead: Contact, type: string, channel?: RecommendedChannel) {
  if (type === "followup_overdue") return true;
  const target = channel || (["whatsapp", "instagram", "email"].includes(type) ? (type as RecommendedChannel) : undefined);
  if (target === "whatsapp") return getRecommendedChannel(lead) === "whatsapp" && hasValue(getLeadWhatsAppNumber(lead));
  if (target === "instagram") return hasValue(lead.instagram);
  if (target === "email") return hasValue(lead.correo || lead.email);
  if (target === "linkedin") return hasValue(lead.linkedin);
  return getRecommendedChannel(lead) !== "sin_canal";
}

function hasBatchMessageForChannel(lead: Contact, type: string, channel?: RecommendedChannel) {
  const target = channel || (["whatsapp", "instagram", "email"].includes(type) ? (type as RecommendedChannel) : getRecommendedChannel(lead));
  if (target === "instagram") return hasValue(lead.mensaje_instagram);
  if (target === "email") return hasValue(lead.mensaje_email || lead.asunto_email);
  if (target === "whatsapp") return hasValue(lead.mensaje_whatsapp || lead.suggestedMessage || lead.mensaje_recomendado_safe);
  return hasValue(lead.mensaje_whatsapp || lead.mensaje_instagram || lead.mensaje_email || lead.suggestedMessage || lead.mensaje_recomendado_safe);
}

function getBatchMainReason(summary: BatchSummary) {
  const exclusions = [
    { value: summary.excluidos_estado_bloqueante, label: "estado bloqueante" },
    { value: summary.excluidos_falta_canal, label: "falta de canal visible" },
    { value: summary.excluidos_contacto_reciente, label: "contacto reciente" },
    { value: summary.excluidos_lote_activo, label: "ya estaba en lote activo" },
    { value: summary.sin_mensaje, label: "sin mensaje importado; se usara fallback consultivo" },
  ].filter((item) => item.value > 0);
  const main = exclusions.sort((a, b) => b.value - a.value)[0];

  if (summary.incluidos_lote > 0) {
    return `Se crearon ${summary.incluidos_lote} leads porque solo ${summary.incluidos_lote} cumplen canal visible + estado elegible + no contactado recientemente.${
      main ? ` Motivo principal de exclusion: ${main.label}.` : ""
    }`;
  }

  return main
    ? `No se crearon leads. Motivo principal: ${main.label}.`
    : "No se crearon leads porque ningun prospecto cumplio los criterios del lote.";
}

function getBatchLeadKey(lead: Contact) {
  return String(lead.id || lead.row_number || "");
}

function isAlreadyInActiveBatch(lead: Contact, activeIds: Set<string>) {
  const key = getBatchLeadKey(lead);
  const rowKey = lead.row_number ? String(lead.row_number) : "";
  return activeIds.has(key) || (rowKey ? activeIds.has(rowKey) : false);
}

function buildBatchSummary(
  contacts: Contact[],
  activeIds: Set<string>,
  type: string,
  channel: RecommendedChannel | undefined,
  niche: NicheKey | "all" | undefined,
  included: Contact[],
): BatchSummary {
  const includedIds = new Set(included.map((lead) => getBatchLeadKey(lead)));
  const summary: BatchSummary = {
    total_evaluados: 0,
    con_whatsapp: 0,
    con_instagram: 0,
    excluidos_estado_bloqueante: 0,
    excluidos_falta_canal: 0,
    excluidos_contacto_reciente: 0,
    excluidos_lote_activo: 0,
    sin_mensaje: 0,
    incluidos_lote: included.length,
    motivo_principal: "",
  };

  contacts.forEach((lead) => {
    if (!isInBatchScope(lead, niche)) return;
    summary.total_evaluados += 1;
    if (hasValue(getLeadWhatsAppNumber(lead))) summary.con_whatsapp += 1;
    if (hasValue(lead.instagram)) summary.con_instagram += 1;
    if (!hasBatchMessageForChannel(lead, type, channel)) summary.sin_mensaje += 1;

    if (includedIds.has(getBatchLeadKey(lead))) return;
    if (isAlreadyInActiveBatch(lead, activeIds)) {
      summary.excluidos_lote_activo += 1;
      return;
    }
    if (type === "followup_overdue") {
      const due = lead.followup_due_date || lead.fecha_seguimiento;
      if (!isPastOrToday(due)) summary.excluidos_falta_canal += 1;
      else if (["not_interested", "closed", "discarded", "lost"].includes(lead.status)) summary.excluidos_estado_bloqueante += 1;
      return;
    }
    if (isBlockedBatchStatus(lead.estado || lead.status)) {
      summary.excluidos_estado_bloqueante += 1;
      return;
    }
    if (isRecentlyContacted(lead)) {
      summary.excluidos_contacto_reciente += 1;
      return;
    }
    if (!hasRequestedBatchChannel(lead, type, channel)) {
      summary.excluidos_falta_canal += 1;
    }
  });

  summary.motivo_principal = getBatchMainReason(summary);
  return summary;
}

function isEligibleForBatch(lead: Contact, activeIds: Set<string>, type: string, channel?: RecommendedChannel, niche?: NicheKey | "all") {
  if (isAlreadyInActiveBatch(lead, activeIds)) return false;

  if (type === "followup_overdue") {
    const due = lead.followup_due_date || lead.fecha_seguimiento;
    if (!isPastOrToday(due)) return false;
    return !["not_interested", "closed", "discarded", "lost"].includes(lead.status);
  }

  if (isBlockedBatchStatus(lead.estado || lead.status) || isRecentlyContacted(lead)) return false;
  if (!isInBatchScope(lead, niche)) return false;
  return hasRequestedBatchChannel(lead, type, channel);
}

async function appendStructuredRow(tab: string, headers: string[], row: SheetObject) {
  const values = headers.map((header) => row[header] ?? "");
  const sheets = await getSheetsClient();
  const { spreadsheetId } = getSheetsConfig();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${escapeSheetName(tab)}!A:AZ`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [values],
    },
  });
}

export async function createBatchFromSheet(input: {
  type?: "today" | "whatsapp" | "instagram" | "email" | "niche" | "followup_overdue";
  channel?: RecommendedChannel;
  niche?: NicheKey | "all";
  limit?: number;
  operador?: string;
  notas_batch?: string;
}) {
  const config = getSheetsConfig();
  const type = input.type || "today";
  const channel = input.channel || (["whatsapp", "instagram", "email"].includes(type) ? (type as RecommendedChannel) : undefined);
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const { contacts } = await readLeadsFromSheet(config.prospectosTab);
  const batches = await readBatches();
  const activeIds = new Set(
    batches.batches
      .filter((batch) => !["cerrado", "closed", "done", "completado"].includes(normalizeComparable(batch.estado_batch)))
      .flatMap((batch) => parseLeadIdsJson(batch.lead_ids_json)),
  );

  const candidates = contacts
    .filter((lead) => isEligibleForBatch(lead, activeIds, type, channel, input.niche))
    .sort((a, b) => {
      const priorityDelta = priorityRank(a.prioridad || a.priority) - priorityRank(b.prioridad || b.priority);
      if (priorityDelta !== 0) return priorityDelta;
      return channelRank(getRecommendedChannel(a)) - channelRank(getRecommendedChannel(b));
    })
    .slice(0, limit);
  const summary = buildBatchSummary(contacts, activeIds, type, channel, input.niche, candidates);

  const batchId = `BATCH-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;
  const leadRefs = candidates.map((lead) => ({
    id: lead.id,
    row_number: lead.row_number,
    channel: getRecommendedChannel(lead),
    nombre_negocio: getLeadBusinessName(lead),
  }));

  const batchHeaders = (await readSheetTable(config.batchesTab)).headers;
  await appendStructuredRow(config.batchesTab, batchHeaders, {
    batch_id: batchId,
    fecha: todayDate(),
    tipo_lote: type,
    nicho: input.niche && input.niche !== "all" ? input.niche : candidates[0] ? resolveLeadNiche(candidates[0]) : "",
    canal: channel || "",
    total_leads: String(candidates.length),
    lead_ids_json: JSON.stringify(leadRefs),
    contactados: "0",
    sin_dato: String(candidates.filter((lead) => getRecommendedChannel(lead) === "sin_canal").length),
    bloqueados: String(contacts.length - candidates.length),
    nuevos_agregados: String(candidates.length),
    operador: input.operador || "Luma Outreach Console",
    estado_batch: "active",
    notas_batch: input.notas_batch || "",
    created_at: new Date().toISOString(),
  });

  return { batch_id: batchId, leads: candidates, total: candidates.length, summary };
}

export async function saveProposal(input: {
  lead_id?: string;
  row_number?: number;
  nombre_negocio?: string;
  nicho?: string;
  oferta?: string;
  ticket_rd?: string;
  demo_url?: string;
  canal_envio?: string;
  estado_propuesta?: string;
  monto_estimado_rd?: string;
  link_propuesta?: string;
  notas_propuesta?: string;
}) {
  const config = getSheetsConfig();
  const headers = (await readSheetTable(config.proposalsTab)).headers;
  const proposalId = `PROP-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;

  let lead: Contact | undefined;
  if (input.row_number || input.lead_id) {
    const leads = await readLeadsFromSheet(config.prospectosTab);
    lead = leads.contacts.find((item) =>
      input.row_number ? item.row_number === input.row_number : item.id === input.lead_id,
    );
  }

  const row: SheetObject = {
    proposal_id: proposalId,
    lead_id: input.lead_id || lead?.id || "",
    row_number: String(input.row_number || lead?.row_number || ""),
    nombre_negocio: input.nombre_negocio || (lead ? getLeadBusinessName(lead) : ""),
    nicho: input.nicho || (lead ? resolveLeadNiche(lead) : ""),
    oferta: input.oferta || (lead ? getLeadOffer(lead) : ""),
    ticket_rd: input.ticket_rd || (lead ? getLeadTicket(lead) : ""),
    demo_url: input.demo_url || (lead ? getLeadDemo(lead).url : ""),
    fecha_propuesta: todayDate(),
    canal_envio: input.canal_envio || (lead ? getRecommendedChannel(lead) : ""),
    estado_propuesta: input.estado_propuesta || "enviada",
    monto_estimado_rd: input.monto_estimado_rd || "",
    link_propuesta: input.link_propuesta || "",
    notas_propuesta: input.notas_propuesta || "",
    created_at: new Date().toISOString(),
  };

  await appendStructuredRow(config.proposalsTab, headers, row);
  return { proposal_id: proposalId, row };
}
