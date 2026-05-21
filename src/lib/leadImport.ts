import { Contact, ContactStatus, NicheKey, RecommendedChannel, ImportReport } from "@/types";
import { getDefaultProductForNiche, getProductByKey } from "@/data/products";
import {
  cleanPhone,
  getFallbackConsultativeMessage,
  getRecommendedChannel,
  hasUnsafeOutreachLanguage,
  hasCommercialValue,
  hasValue,
  inferNicheFromText,
  isLockedStatus,
  isValidWhatsAppPhone,
  normalizeText,
} from "@/lib/utils";

type Row = unknown[];

type CanonicalField =
  | "id"
  | "nicho"
  | "prioridad"
  | "nombre_negocio"
  | "nombre_persona"
  | "cargo_rol"
  | "empresa_marca"
  | "web"
  | "audit_domain"
  | "audit_slug"
  | "reporte_luma"
  | "whatsapp"
  | "telefono"
  | "correo"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "ciudad_zona"
  | "fuente_dato"
  | "fuente_auditoria"
  | "senal_comercial"
  | "dolor_probable"
  | "oportunidad_visible"
  | "oferta_recomendada"
  | "angulo_contacto"
  | "mensaje_whatsapp"
  | "mensaje_instagram"
  | "asunto_email"
  | "mensaje_email"
  | "estado"
  | "tipo_respuesta"
  | "proximo_paso"
  | "fecha_contacto"
  | "fecha_seguimiento"
  | "notas"
  | "score_interno"
  | "score_captacion"
  | "score_autoridad"
  | "score_medicion"
  | "score_seguimiento"
  | "score_mobile"
  | "ultimo_canal_usado"
  | "cantidad_contactos"
  | "fecha_ultima_actualizacion"
  | "atributos_nicho_json"
  | "metricas_publicas_json"
  | "audit_raw_ref"
  | "csv_raw_ref"
  | "followup_due_date"
  | "last_interaction_date"
  | "attempt_count"
  | "last_channel"
  | "conversation_summary"
  | "propuesta_link"
  | "material_link"
  | "monto_estimado"
  | "fecha_propuesta"
  | "decision_status"
  | "imported_at";

type ColumnMap = Partial<Record<CanonicalField, number>>;

export const UNIFIED_LEAD_FIELDS: CanonicalField[] = [
  "id",
  "nicho",
  "prioridad",
  "nombre_negocio",
  "nombre_persona",
  "cargo_rol",
  "empresa_marca",
  "web",
  "audit_domain",
  "audit_slug",
  "reporte_luma",
  "whatsapp",
  "telefono",
  "correo",
  "instagram",
  "facebook",
  "linkedin",
  "ciudad_zona",
  "fuente_dato",
  "fuente_auditoria",
  "senal_comercial",
  "dolor_probable",
  "oportunidad_visible",
  "oferta_recomendada",
  "angulo_contacto",
  "mensaje_whatsapp",
  "mensaje_instagram",
  "asunto_email",
  "mensaje_email",
  "estado",
  "tipo_respuesta",
  "proximo_paso",
  "fecha_contacto",
  "fecha_seguimiento",
  "notas",
  "score_interno",
  "score_captacion",
  "score_autoridad",
  "score_medicion",
  "score_seguimiento",
  "score_mobile",
  "ultimo_canal_usado",
  "cantidad_contactos",
  "fecha_ultima_actualizacion",
  "atributos_nicho_json",
  "metricas_publicas_json",
  "audit_raw_ref",
  "csv_raw_ref",
  "followup_due_date",
  "last_interaction_date",
  "attempt_count",
  "last_channel",
  "conversation_summary",
  "propuesta_link",
  "material_link",
  "monto_estimado",
  "fecha_propuesta",
  "decision_status",
  "imported_at",
];

const FIELD_ALIASES: Record<CanonicalField, string[]> = {
  id: ["id", "lead_id", "lead id", "uuid"],
  nicho: ["nicho", "sector", "industria", "categoria", "category", "niche"],
  prioridad: ["prioridad", "priority"],
  nombre_negocio: [
    "nombre_negocio",
    "nombre del negocio",
    "nombre del negocio / perfil",
    "businessName",
    "business_name",
    "negocio",
    "empresa",
    "compania",
    "compania",
    "perfil",
    "business",
    "company",
  ],
  nombre_persona: [
    "nombre_persona",
    "nombre de la persona",
    "person_name",
    "persona",
    "contacto",
    "nombre completo",
    "cliente",
    "lead",
    "nombre",
  ],
  cargo_rol: ["cargo_rol", "cargo / rol", "cargo", "rol", "puesto", "role"],
  empresa_marca: ["empresa_marca", "oficina / marca", "oficina", "marca", "sucursal", "agency", "brand"],
  web: ["web", "website", "sitio", "sitio web", "url", "link"],
  audit_domain: ["audit_domain", "domain", "dominio", "dominio auditado"],
  audit_slug: ["audit_slug", "slug", "audit slug"],
  reporte_luma: ["reporte_luma", "reporte luma", "auditoria", "auditoria luma", "audit"],
  whatsapp: ["whatsapp", "wa", "numero whatsapp", "numero de whatsapp"],
  telefono: ["telefono", "telefono", "celular", "movil", "phone", "mobile"],
  correo: ["correo", "email", "mail"],
  instagram: ["instagram", "perfil instagram", "ig", "usuario ig", "username", "handle"],
  facebook: ["facebook", "fb"],
  linkedin: ["linkedin"],
  ciudad_zona: ["ciudad_zona", "ciudad / zona", "ciudad", "zona", "ubicacion", "ubicacion", "city", "area"],
  fuente_dato: ["fuente_dato", "fuente dato", "source", "fuente"],
  fuente_auditoria: ["fuente_auditoria", "fuente auditoria", "audit source"],
  senal_comercial: ["senal_comercial", "senal comercial relevante", "senal comercial", "senal", "senal", "signal"],
  dolor_probable: ["dolor_probable", "dolor probable", "painPoint", "pain_point", "dolor", "pain", "problema"],
  oportunidad_visible: ["oportunidad_visible", "oportunidad visible", "oportunidad"],
  oferta_recomendada: ["oferta_recomendada", "oferta recomendada", "offer", "oferta"],
  angulo_contacto: ["angulo_contacto", "angulo de contacto", "contactAngle", "contact_angle", "angulo", "enfoque"],
  mensaje_whatsapp: ["mensaje_whatsapp", "mensaje whatsapp", "suggestedMessage", "suggested_message", "mensaje sugerido", "mensaje", "plantilla", "message", "copy"],
  mensaje_instagram: ["mensaje_instagram", "mensaje instagram", "dm instagram"],
  asunto_email: ["asunto_email", "asunto email", "subject", "email subject"],
  mensaje_email: ["mensaje_email", "mensaje email", "email body", "body email"],
  estado: ["estado", "status", "etapa", "pipeline"],
  tipo_respuesta: ["tipo_respuesta", "tipo respuesta", "respuesta"],
  proximo_paso: ["proximo_paso", "proximo paso", "siguiente paso", "next step"],
  fecha_contacto: ["fecha_contacto", "fecha de contacto", "contact date", "ultimo contacto"],
  fecha_seguimiento: ["fecha_seguimiento", "fecha de seguimiento", "seguimiento", "follow up", "follow-up"],
  notas: ["notas", "observaciones", "comentarios", "notes"],
  score_interno: ["score_interno", "score interno", "score"],
  score_captacion: ["score_captacion", "score captacion"],
  score_autoridad: ["score_autoridad", "score autoridad"],
  score_medicion: ["score_medicion", "score medicion"],
  score_seguimiento: ["score_seguimiento", "score seguimiento"],
  score_mobile: ["score_mobile", "score mobile"],
  ultimo_canal_usado: ["ultimo_canal_usado", "ultimo canal usado", "canal usado"],
  cantidad_contactos: ["cantidad_contactos", "cantidad contactos", "contact attempts", "intentos"],
  fecha_ultima_actualizacion: [
    "fecha_ultima_actualizacion",
    "fecha ultima actualizacion",
    "updated",
    "last update",
  ],
  atributos_nicho_json: ["atributos_nicho_json", "atributos nicho json"],
  metricas_publicas_json: ["metricas_publicas_json", "metricas publicas json"],
  audit_raw_ref: ["audit_raw_ref", "audit raw ref"],
  csv_raw_ref: ["csv_raw_ref", "csv raw ref"],
  followup_due_date: ["followup_due_date", "follow up due date", "fecha proximo seguimiento", "proxima fecha seguimiento"],
  last_interaction_date: ["last_interaction_date", "ultima interaccion", "fecha ultima interaccion"],
  attempt_count: ["attempt_count", "intentos realizados", "intentos", "cantidad intentos"],
  last_channel: ["last_channel", "ultimo canal", "canal ultimo usado"],
  conversation_summary: ["conversation_summary", "resumen conversacion", "resumen de conversacion"],
  propuesta_link: ["propuesta_link", "link propuesta", "proposal link", "url propuesta"],
  material_link: ["material_link", "link material", "link proyecto", "project link", "material propuesta"],
  monto_estimado: ["monto_estimado", "monto estimado", "ticket estimado", "valor propuesta", "proposal amount"],
  fecha_propuesta: ["fecha_propuesta", "fecha propuesta", "proposal date"],
  decision_status: ["decision_status", "decision", "estado decision", "proposal decision"],
  imported_at: ["imported_at", "imported at", "fecha importacion", "fecha de importacion"],
};

const EMPTY_VALUES = new Set([
  "",
  "-",
  "--",
  "no visible",
  "n/a",
  "na",
  "null",
  "undefined",
  "sin dato",
  "sin datos",
  "pendiente de definir",
  "pendiente de lectura comercial",
  "oferta luma por definir",
]);

const HEADER_VALUES = new Set([
  "id",
  "nicho",
  "niche",
  "prioridad",
  "priority",
  "nombre_negocio",
  "nombre del negocio",
  "nombre del negocio / perfil",
  "business_name",
  "businessname",
  "nombre_persona",
  "nombre de la persona",
  "person_name",
  "cargo_rol",
  "cargo / rol",
  "empresa_marca",
  "oficina / marca",
  "ciudad_zona",
  "ciudad / zona",
  "mensaje_whatsapp",
  "mensaje sugerido",
  "senal_comercial",
  "senal comercial relevante",
  "dolor_probable",
  "dolor probable",
  "angulo_contacto",
  "angulo de contacto",
]);

function isEmptyCell(value: unknown) {
  return EMPTY_VALUES.has(normalizeText(value));
}

function headerComparable(value: unknown) {
  return normalizeText(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function isHeaderLikeValue(value: unknown) {
  const comparable = headerComparable(value);
  return HEADER_VALUES.has(comparable) || HEADER_VALUES.has(comparable.replace(/\s+/g, "_"));
}

function cell(row: Row, index?: number) {
  if (index === undefined || index < 0) return "";
  const value = row[index];
  return isEmptyCell(value) ? "" : String(value ?? "").trim();
}

function realCell(row: Row, index?: number) {
  const value = cell(row, index);
  return isHeaderLikeValue(value) ? "" : value;
}

function includesAlias(header: string, aliases: string[]) {
  const normalizedHeader = normalizeText(header).replace(/[\s-]+/g, "_");
  return aliases.some((alias) => {
    const normalizedAlias = normalizeText(alias).replace(/[\s-]+/g, "_");
    return normalizedHeader === normalizedAlias || normalizedHeader.includes(normalizedAlias);
  });
}

function findColumn(headers: string[], field: CanonicalField) {
  const aliases = FIELD_ALIASES[field];

  const exactIndex = headers.findIndex((header) =>
    aliases.some((alias) => normalizeText(header).replace(/[\s-]+/g, "_") === normalizeText(alias).replace(/[\s-]+/g, "_")),
  );
  if (exactIndex >= 0) return exactIndex;

  return headers.findIndex((header) => includesAlias(header, aliases));
}

function buildColumnMap(headers: string[]) {
  return UNIFIED_LEAD_FIELDS.reduce<ColumnMap>((map, field) => {
    const index = findColumn(headers, field);
    if (index >= 0) map[field] = index;
    return map;
  }, {});
}

function scoreHeaderRow(row: Row) {
  const headers = row.map((value) => String(value ?? ""));
  const map = buildColumnMap(headers);
  let score = Object.keys(map).length;
  if (map.whatsapp !== undefined || map.telefono !== undefined) score += 4;
  if (map.estado !== undefined) score += 2;
  if (map.nombre_persona !== undefined || map.nombre_negocio !== undefined) score += 2;
  return score;
}

function detectHeaderRow(rows: Row[]) {
  let bestIndex = 0;
  let bestScore = 0;
  rows.slice(0, 25).forEach((row, index) => {
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  const headers = rows[bestIndex]?.map((value) => String(value ?? "").trim()) ?? [];
  return { headerIndex: bestIndex, headers, columns: buildColumnMap(headers) };
}

function mapStatus(value: unknown): ContactStatus {
  const status = normalizeText(value);
  if (status.includes("listo_contacto") || status.includes("listo contacto")) return "listo_contacto";
  if (!status || status.includes("pend") || status.includes("nuevo")) return "pending";
  if (status.includes("sin accion") || status.includes("sin_accion") || status.includes("pausado por ahora")) return "sin_accion_por_ahora";
  if (status.includes("needs_review") || status.includes("revision") || status.includes("review")) return "needs_review";
  if (status.includes("sin canal")) return "sin_canal";
  if (status.includes("dato") && status.includes("incompleto")) return "datos_incompletos";
  if (status.includes("conflicto")) return "conflicto_contacto";
  if (status.includes("mensaje") && status.includes("falt")) return "mensaje_faltante";
  if (status.includes("buscar canal")) return "buscar_canal";
  if (status.includes("no interesado") || status.includes("no_interesado") || status.includes("descart")) return "not_interested";
  if (status.includes("perdido") || status.includes("lost")) return "lost";
  if (status.includes("cerrado") || status.includes("closed")) return "closed";
  if (status.includes("negoci")) return "negotiating";
  if (status.includes("propuesta")) return "proposal_sent";
  if (status.includes("diagnostico")) return "diagnostico";
  if (status.includes("reunion")) return "reunion_pendiente";
  if (status.includes("cita") || status.includes("agenda") || status.includes("meeting")) return "appointment";
  if (status.includes("llamada") || status.includes("call")) return "call";
  if (status.includes("seguimiento") || status.includes("follow")) return "follow_up";
  if (status.includes("respond") || status.includes("reply")) return "replied";
  if (status.includes("interesado") || status.includes("interes")) return "interested";
  if (status.includes("refer")) return "referred";
  if (status.includes("contactado") || status.includes("enviado") || status.includes("sent")) return "contacted";
  if (status.includes("fall") || status.includes("fallido") || status.includes("error") || status.includes("invalid")) return "failed";
  return "pending";
}

function normalizeNiche(value: unknown, context: unknown[] = []): NicheKey {
  return inferNicheFromText(value, context);
}

function normalizeChannel(value: unknown): RecommendedChannel | undefined {
  const channel = normalizeText(value);
  if (!channel) return undefined;
  if (channel.includes("whatsapp")) return "whatsapp";
  if (channel.includes("instagram")) return "instagram";
  if (channel.includes("email") || channel.includes("correo")) return "email";
  if (channel.includes("linkedin")) return "linkedin";
  if (channel.includes("llamada") || channel.includes("telefono") || channel.includes("call")) return "llamada";
  if (channel.includes("web") || channel.includes("sitio")) return "web";
  if (channel.includes("manual")) return "manual";
  if (channel.includes("sin")) return "sin_canal";
  return undefined;
}

function isBrokerAgentWithoutWebRow(niche: NicheKey, row: Row, web: string, auditDomain: string, instagram: string) {
  if (niche !== "real_estate") return false;
  if (hasValue(web || auditDomain)) return false;
  const text = normalizeText(row.join(" "));
  return (
    hasValue(instagram) ||
    text.includes("broker") ||
    text.includes("agente") ||
    text.includes("asesor") ||
    text.includes("real estate") ||
    text.includes("inmobili")
  );
}

function isPhotographyQuoteRow(row: Row) {
  const text = normalizeText(row.join(" "));
  return (
    text.includes("fotograf") &&
    (text.includes("cotiz") ||
      text.includes("proyecto") ||
      text.includes("evento") ||
      text.includes("brief") ||
      text.includes("paquete") ||
      text.includes("sesion") ||
      text.includes("archivo"))
  );
}

function fallbackOffer(niche: NicheKey, row: Row, web: string, auditDomain: string, instagram: string) {
  if (isBrokerAgentWithoutWebRow(niche, row, web, auditDomain, instagram)) return getProductByKey("estate_starter").name;
  if (isPhotographyQuoteRow(row)) return getProductByKey("b2b_quote_os").name;
  if (niche === "unknown") return "Oferta Luma por definir";
  return getDefaultProductForNiche(niche).name;
}

function fallbackPain(niche: NicheKey, row: Row, web: string, auditDomain: string, instagram: string) {
  if (isBrokerAgentWithoutWebRow(niche, row, web, auditDomain, instagram)) {
    return "Dependencia de redes sociales y conversaciones dispersas sin una ruta clara de captacion y seguimiento.";
  }
  return "";
}

function fallbackOpportunity(niche: NicheKey, row: Row, web: string, auditDomain: string, instagram: string) {
  if (isBrokerAgentWithoutWebRow(niche, row, web, auditDomain, instagram)) {
    return "Construir una presencia propia de autoridad, captacion y seguimiento para no depender unicamente de Instagram o WhatsApp.";
  }
  if (isPhotographyQuoteRow(row)) {
    return getProductByKey("b2b_quote_os").opportunity;
  }
  if (niche !== "unknown") {
    return getDefaultProductForNiche(niche).opportunity;
  }
  return "";
}

function fallbackSignal(niche: NicheKey, row: Row) {
  const rowText = normalizeText(row.join(" "));
  if (niche === "real_estate") {
    if (rowText.includes("inmueble") || rowText.includes("review") || rowText.includes("resena")) {
      return "Se observan senales publicas de volumen operativo en propiedades/resenas visibles.";
    }
    return "Presencia publica con senales de operacion comercial activa en propiedades, perfiles o canales digitales.";
  }
  return "Presencia publica con senales de operacion comercial activa en perfiles o canales digitales.";
}

function safeMessageForContact(contact: Contact) {
  const original = contact.mensaje_whatsapp || contact.suggestedMessage || "";
  if (!hasCommercialValue(original) || hasUnsafeOutreachLanguage(original)) {
    return getFallbackConsultativeMessage(contact);
  }
  return original;
}

function makeId(seed?: string) {
  if (hasValue(seed)) return String(seed).trim();
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mergeVariable(target: Record<string, unknown>, key: string, value: unknown) {
  if (!key || isEmptyCell(value)) return;
  target[key.trim()] = value;
}

function value(row: Row, columns: ColumnMap, field: CanonicalField) {
  return realCell(row, columns[field]);
}

function numberValue(value: unknown) {
  const numeric = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function buildVariables(row: Row, headers: string[], columns: ColumnMap) {
  const variables: Record<string, unknown> = {};

  headers.forEach((header, index) => {
    const rowValue = cell(row, index);
    if (header && rowValue) mergeVariable(variables, header, rowValue);
  });

  mergeVariable(variables, "Nombre", value(row, columns, "nombre_persona") || value(row, columns, "nombre_negocio"));
  mergeVariable(variables, "Negocio", value(row, columns, "nombre_negocio"));
  mergeVariable(variables, "Empresa", value(row, columns, "empresa_marca") || value(row, columns, "nombre_negocio"));
  mergeVariable(variables, "Nicho", value(row, columns, "nicho"));
  mergeVariable(variables, "Ciudad", value(row, columns, "ciudad_zona"));
  mergeVariable(variables, "Dolor", value(row, columns, "dolor_probable"));
  mergeVariable(variables, "Oportunidad", value(row, columns, "oportunidad_visible"));
  mergeVariable(variables, "Angulo", value(row, columns, "angulo_contacto"));
  mergeVariable(variables, "Oferta", value(row, columns, "oferta_recomendada"));

  return variables;
}

function contactKeys(
  contact: Partial<Pick<Contact, "id" | "phone" | "name" | "businessName" | "correo" | "email" | "instagram">>,
) {
  const keys: string[] = [];
  if (hasValue(contact.id)) keys.push(`id:${contact.id}`);
  if (isValidWhatsAppPhone(contact.phone)) keys.push(`phone:${cleanPhone(contact.phone)}`);
  if (hasValue(contact.correo || contact.email)) keys.push(`email:${normalizeText(contact.correo || contact.email)}`);
  if (hasValue(contact.instagram)) keys.push(`instagram:${normalizeText(contact.instagram)}`);
  if (hasValue(contact.name || contact.businessName)) {
    keys.push(`name:${normalizeText(`${contact.name ?? ""} ${contact.businessName ?? ""}`)}`);
  }
  return keys;
}

function buildExistingIndex(contacts: Contact[]) {
  const index = new Map<string, Contact>();
  contacts.forEach((contact) => {
    contactKeys(contact).forEach((key) => index.set(key, contact));
  });
  return index;
}

function rowIdentityValues(row: Row, columns: ColumnMap) {
  return [
    value(row, columns, "nombre_negocio"),
    value(row, columns, "nombre_persona"),
    value(row, columns, "whatsapp"),
    value(row, columns, "telefono"),
    value(row, columns, "instagram"),
    value(row, columns, "correo"),
    value(row, columns, "web"),
    value(row, columns, "audit_domain"),
  ];
}

function isHeaderLikeRow(row: Row, columns: ColumnMap) {
  const keyIndexes = [
    columns.nombre_negocio,
    columns.nombre_persona,
    columns.nicho,
    columns.prioridad,
    columns.whatsapp,
    columns.correo,
  ].filter((index): index is number => index !== undefined);

  const headerMatches = keyIndexes.filter((index) => isHeaderLikeValue(cell(row, index))).length;
  return headerMatches >= 2 || rowIdentityValues(row, columns).every((item) => !item) && headerMatches > 0;
}

function isTooEmptyStructuralRow(row: Row) {
  const visibleCells = row.filter((item) => hasValue(item) && !isHeaderLikeValue(item));
  const noVisibleCells = row.filter((item) => normalizeText(item) === "no visible");
  return visibleCells.length === 0 || (visibleCells.length <= 1 && noVisibleCells.length >= 4);
}

function hasLeadMinimum(row: Row, columns: ColumnMap) {
  return rowIdentityValues(row, columns).some((item) => hasValue(item));
}

function trashRowLabel(row: Row, absoluteRowNumber: number) {
  const preview = row
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" | ");
  return `Fila ${absoluteRowNumber}: ${preview || "vacia/estructural"}`;
}

export function parseRowsToContacts(
  rows: Row[],
  existingContacts: Contact[],
  fileName: string,
  sheetName?: string,
) {
  const { headerIndex, headers, columns } = detectHeaderRow(rows);
  const existingIndex = buildExistingIndex(existingContacts);
  const contacts: Contact[] = [];
  const importedKeys = new Set<string>();
  let updated = 0;
  let skippedEmpty = 0;
  let skippedNoPhone = 0;
  let skippedHeaderLike = 0;
  let skippedStructural = 0;
  let skippedTooEmpty = 0;
  let preservedStatuses = 0;
  const possibleTrashRows: string[] = [];

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const absoluteRowNumber = headerIndex + offset + 2;
    if (!row.some((rowValue) => !isEmptyCell(rowValue))) {
      skippedEmpty += 1;
      if (possibleTrashRows.length < 8) possibleTrashRows.push(trashRowLabel(row, absoluteRowNumber));
      return;
    }

    if (isHeaderLikeRow(row, columns)) {
      skippedHeaderLike += 1;
      if (possibleTrashRows.length < 8) possibleTrashRows.push(trashRowLabel(row, absoluteRowNumber));
      return;
    }

    if (isTooEmptyStructuralRow(row) && !hasLeadMinimum(row, columns)) {
      skippedTooEmpty += 1;
      if (possibleTrashRows.length < 8) possibleTrashRows.push(trashRowLabel(row, absoluteRowNumber));
      return;
    }

    if (!hasLeadMinimum(row, columns)) {
      skippedStructural += 1;
      if (possibleTrashRows.length < 8) possibleTrashRows.push(trashRowLabel(row, absoluteRowNumber));
      return;
    }

    const whatsapp = cleanPhone(value(row, columns, "whatsapp"));
    const telefono = cleanPhone(value(row, columns, "telefono") || whatsapp);
    const correo = value(row, columns, "correo");
    const instagram = value(row, columns, "instagram");
    const linkedin = value(row, columns, "linkedin");
    const web = value(row, columns, "web");
    const auditDomain = value(row, columns, "audit_domain");

    if (!isValidWhatsAppPhone(whatsapp)) {
      skippedNoPhone += 1;
    }

    const variables = buildVariables(row, headers, columns);
    const nombre_negocio = value(row, columns, "nombre_negocio") || value(row, columns, "empresa_marca");
    const nombre_persona = value(row, columns, "nombre_persona");
    const businessName = nombre_negocio || value(row, columns, "web") || value(row, columns, "audit_domain");
    const name = nombre_persona || businessName || correo || instagram || `Lead ${headerIndex + offset + 2}`;
    const niche = normalizeNiche(value(row, columns, "nicho"), [...row, fileName]);
    const importedStatus = mapStatus(value(row, columns, "estado"));
    const instagramMessage = value(row, columns, "mensaje_instagram");
    const lookupContact = {
      id: value(row, columns, "id"),
      phone: whatsapp || telefono,
      name,
      businessName,
      correo,
      email: correo,
      instagram,
    };
    const lookupKeys = contactKeys(lookupContact);
    const existing = lookupKeys.map((key) => existingIndex.get(key)).find(Boolean);

    let status = importedStatus;
    if (existing && isLockedStatus(existing.status)) {
      status = existing.status;
      preservedStatuses += 1;
    }

    if (
      status === "pending" &&
      hasValue(instagram) &&
      !isValidWhatsAppPhone(whatsapp) &&
      !isValidWhatsAppPhone(telefono) &&
      hasValue(instagramMessage)
    ) {
      status = "listo_contacto";
    }

    if (
      !hasValue(whatsapp) &&
      !hasValue(telefono) &&
      !hasValue(instagram) &&
      !hasValue(correo) &&
      !hasValue(linkedin) &&
      !hasValue(web) &&
      !hasValue(auditDomain) &&
      status === "pending"
    ) {
      status = "sin_canal";
    }

    if (existing) updated += 1;

    const cantidad_contactos =
      existing?.cantidad_contactos ??
      existing?.sentCount ??
      numberValue(value(row, columns, "cantidad_contactos")) ??
      (status === "pending" || status === "failed" || status === "sin_canal" || status === "sin_accion_por_ahora" ? 0 : 1);

    const contact: Contact = {
      id: existing?.id ?? makeId(value(row, columns, "id")),
      name,
      businessName,
      priority: value(row, columns, "prioridad"),
      phone: whatsapp || telefono,
      status,
      nextStep: existing?.nextStep || value(row, columns, "proximo_paso"),
      notes: existing?.notes || value(row, columns, "notas"),
      suggestedMessage: value(row, columns, "mensaje_whatsapp"),
      painPoint: value(row, columns, "dolor_probable"),
      contactAngle: value(row, columns, "angulo_contacto"),
      sourceUrl: value(row, columns, "reporte_luma") || value(row, columns, "web"),
      email: correo,
      instagram,
      city: value(row, columns, "ciudad_zona"),
      sourceFile: fileName,
      importedRow: absoluteRowNumber,
      lastContactDate: existing?.lastContactDate || value(row, columns, "fecha_contacto"),
      variables,
      sentCount: Number(cantidad_contactos) || 0,
      nicho: niche,
      prioridad: value(row, columns, "prioridad"),
      nombre_negocio,
      nombre_persona,
      cargo_rol: value(row, columns, "cargo_rol"),
      empresa_marca: value(row, columns, "empresa_marca"),
      web,
      audit_domain: auditDomain,
      audit_slug: value(row, columns, "audit_slug"),
      reporte_luma: value(row, columns, "reporte_luma"),
      whatsapp,
      telefono,
      correo,
      facebook: value(row, columns, "facebook"),
      linkedin,
      ciudad_zona: value(row, columns, "ciudad_zona"),
      fuente_dato: value(row, columns, "fuente_dato"),
      fuente_auditoria: value(row, columns, "fuente_auditoria"),
      senal_comercial: value(row, columns, "senal_comercial") || fallbackSignal(niche, row),
      dolor_probable: value(row, columns, "dolor_probable") || fallbackPain(niche, row, web, auditDomain, instagram),
      oportunidad_visible: value(row, columns, "oportunidad_visible") || fallbackOpportunity(niche, row, web, auditDomain, instagram),
      oferta_recomendada: value(row, columns, "oferta_recomendada") || fallbackOffer(niche, row, web, auditDomain, instagram),
      angulo_contacto: value(row, columns, "angulo_contacto"),
      mensaje_whatsapp: value(row, columns, "mensaje_whatsapp"),
      mensaje_instagram: instagramMessage,
      asunto_email: value(row, columns, "asunto_email"),
      mensaje_email: value(row, columns, "mensaje_email"),
      estado: status,
      tipo_respuesta: value(row, columns, "tipo_respuesta"),
      proximo_paso: existing?.proximo_paso || value(row, columns, "proximo_paso"),
      fecha_contacto: existing?.fecha_contacto || value(row, columns, "fecha_contacto"),
      fecha_seguimiento: existing?.fecha_seguimiento || value(row, columns, "fecha_seguimiento"),
      notas: existing?.notas || existing?.notes || value(row, columns, "notas"),
      score_interno: numberValue(value(row, columns, "score_interno")) ?? value(row, columns, "score_interno"),
      score_captacion: numberValue(value(row, columns, "score_captacion")) ?? value(row, columns, "score_captacion"),
      score_autoridad: numberValue(value(row, columns, "score_autoridad")) ?? value(row, columns, "score_autoridad"),
      score_medicion: numberValue(value(row, columns, "score_medicion")) ?? value(row, columns, "score_medicion"),
      score_seguimiento: numberValue(value(row, columns, "score_seguimiento")) ?? value(row, columns, "score_seguimiento"),
      score_mobile: numberValue(value(row, columns, "score_mobile")) ?? value(row, columns, "score_mobile"),
      ultimo_canal_usado:
        existing?.ultimo_canal_usado || normalizeChannel(value(row, columns, "ultimo_canal_usado")),
      cantidad_contactos: Number(cantidad_contactos) || 0,
      fecha_ultima_actualizacion:
        existing?.fecha_ultima_actualizacion || value(row, columns, "fecha_ultima_actualizacion"),
      atributos_nicho_json: value(row, columns, "atributos_nicho_json"),
      metricas_publicas_json: value(row, columns, "metricas_publicas_json"),
      audit_raw_ref: value(row, columns, "audit_raw_ref"),
      csv_raw_ref: value(row, columns, "csv_raw_ref"),
      batch_name: inferCampaignName(fileName, rows),
      imported_file_name: fileName,
      followup_due_date:
        existing?.followup_due_date || value(row, columns, "followup_due_date") || value(row, columns, "fecha_seguimiento"),
      last_interaction_date:
        existing?.last_interaction_date || value(row, columns, "last_interaction_date") || value(row, columns, "fecha_contacto"),
      attempt_count:
        existing?.attempt_count ??
        numberValue(value(row, columns, "attempt_count")) ??
        (Number(cantidad_contactos) || 0),
      last_channel:
        existing?.last_channel ||
        normalizeChannel(value(row, columns, "last_channel")) ||
        existing?.ultimo_canal_usado ||
        normalizeChannel(value(row, columns, "ultimo_canal_usado")),
      conversation_summary:
        existing?.conversation_summary || value(row, columns, "conversation_summary") || value(row, columns, "notas"),
      propuesta_link: existing?.propuesta_link || value(row, columns, "propuesta_link"),
      material_link: existing?.material_link || value(row, columns, "material_link"),
      monto_estimado:
        existing?.monto_estimado ??
        numberValue(value(row, columns, "monto_estimado")) ??
        value(row, columns, "monto_estimado"),
      fecha_propuesta: existing?.fecha_propuesta || value(row, columns, "fecha_propuesta"),
      decision_status: existing?.decision_status || value(row, columns, "decision_status"),
      imported_at: existing?.imported_at || value(row, columns, "imported_at"),
    };

    contact.mensaje_recomendado_safe = safeMessageForContact(contact);
    contact.oferta_recomendada = hasCommercialValue(contact.oferta_recomendada)
      ? contact.oferta_recomendada
      : fallbackOffer(niche, row, web, auditDomain, instagram);
    contact.oportunidad_visible = hasCommercialValue(contact.oportunidad_visible)
      ? contact.oportunidad_visible
      : fallbackOpportunity(niche, row, web, auditDomain, instagram);
    contact.senal_comercial = hasCommercialValue(contact.senal_comercial)
      ? contact.senal_comercial
      : fallbackSignal(niche, row);

    contactKeys(contact).forEach((key) => importedKeys.add(key));
    contacts.push(contact);
  });

  const preservedExisting = existingContacts.filter((contact) => {
    const keys = contactKeys(contact);
    return keys.length === 0 || !keys.some((key) => importedKeys.has(key));
  });

  const report: ImportReport = {
    fileName,
    sheetName,
    rowsRead: rows.length,
    totalRows: Math.max(0, rows.length - headerIndex - 1),
    imported: contacts.length,
    updated,
    skippedEmpty,
    skippedNoPhone,
    skippedHeaderLike,
    skippedStructural,
    skippedTooEmpty,
    preservedStatuses,
    headerRow: headerIndex + 1,
    detectedColumns: Object.entries(columns).map(([field, index]) => `${field}: ${headers[index]}`),
    ignoredRows: skippedEmpty + skippedHeaderLike + skippedStructural + skippedTooEmpty,
    channelCounts: contacts.reduce(
      (acc, contact) => {
        acc[getRecommendedChannel(contact)] += 1;
        return acc;
      },
      { whatsapp: 0, instagram: 0, email: 0, linkedin: 0, llamada: 0, web: 0, manual: 0, sin_canal: 0 } as Record<RecommendedChannel, number>,
    ),
    nichesDetected: Array.from(new Set(contacts.map((contact) => String(contact.nicho || "unknown")))),
    possibleTrashRows,
  };

  return { contacts: [...preservedExisting, ...contacts], report };
}

export function inferCampaignName(fileName: string, rows: Row[]) {
  const normalizedFile = normalizeText(fileName);
  if (normalizedFile.includes("first_50")) return "Lote manual inmobiliario - primeros 50";
  if (normalizedFile.includes("unified_leads_real_estate")) return "Base unificada inmobiliaria";
  if (normalizedFile.includes("whatsapp")) return "Lote WhatsApp-ready";
  if (normalizedFile.includes("instagram")) return "Lote Instagram-ready";
  if (normalizedFile.includes("email")) return "Lote Email-ready";

  const firstCell = String(rows[0]?.[0] ?? "").trim();
  if (firstCell && firstCell.length <= 80 && !firstCell.includes(",")) return firstCell;
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
}
