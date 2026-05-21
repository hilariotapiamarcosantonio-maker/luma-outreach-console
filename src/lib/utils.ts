import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getNicheDefinition } from "@/data/niches";
import { Contact, ContactStatus, NicheKey, RecommendedChannel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LOCKED_STATUSES = new Set<ContactStatus>([
  "sin_accion_por_ahora",
  "contacted",
  "replied",
  "respondio",
  "interested",
  "follow_up",
  "appointment",
  "call",
  "diagnostico",
  "reunion_pendiente",
  "proposal_sent",
  "propuesta_enviada",
  "negotiating",
  "closed",
  "lost",
  "not_interested",
  "needs_review",
  "sin_canal",
  "datos_incompletos",
  "conflicto_contacto",
  "mensaje_faltante",
  "buscar_canal",
  "discarded",
  "referred",
]);

const SENDABLE_STATUSES = new Set<ContactStatus>(["pending", "listo_contacto", "failed"]);
const BROKER_NO_WEB_OFFER = "Luma Estate OS Starter";
const BROKER_NO_WEB_TICKET = "RD$45,000 - RD$75,000";
const BROKER_NO_WEB_OPPORTUNITY =
  "Construir una presencia propia de autoridad, captacion y seguimiento para no depender unicamente de Instagram o WhatsApp.";
const BROKER_NO_WEB_PAIN =
  "Dependencia de redes sociales y conversaciones dispersas sin una ruta clara de captacion y seguimiento.";
const BLANK_COMMERCIAL_VALUES = new Set([
  "",
  "-",
  "--",
  "no visible",
  "pendiente",
  "pendiente de definir",
  "pendiente de lectura comercial",
  "oferta luma por definir",
  "n/a",
  "na",
  "null",
  "undefined",
  "sin dato",
  "sin datos",
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function hasValue(value: unknown) {
  const normalized = normalizeText(value);
  return Boolean(normalized && !BLANK_COMMERCIAL_VALUES.has(normalized));
}

export function hasCommercialValue(value: unknown) {
  return hasValue(value);
}

export function formatMessage(template: string, variables: Record<string, unknown> = {}) {
  let message = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\[${escapeRegExp(key)}\\]`, "gi");
    message = message.replace(regex, String(value ?? ""));
  });
  return message;
}

export function cleanPhone(phone: unknown) {
  const raw = String(phone ?? "").trim();
  const normalized = normalizeText(raw);
  if (
    !raw ||
    normalized === "no visible" ||
    normalized === "sin telefono" ||
    normalized === "sin whatsapp" ||
    normalized === "n/a" ||
    normalized === "na"
  ) {
    return "";
  }

  let cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2);
  }

  if (
    cleaned.length === 10 &&
    (cleaned.startsWith("809") || cleaned.startsWith("829") || cleaned.startsWith("849"))
  ) {
    cleaned = `1${cleaned}`;
  }

  return cleaned;
}

export function isValidWhatsAppPhone(phone: unknown) {
  const cleaned = cleanPhone(phone);
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function getLeadWhatsAppNumber(lead: Contact) {
  const direct = cleanPhone(lead.whatsapp);
  if (isValidWhatsAppPhone(direct)) return direct;

  const legacyPhone = cleanPhone(lead.phone);
  if (!hasValue(lead.telefono) && isValidWhatsAppPhone(legacyPhone)) return legacyPhone;

  return "";
}

export function getLeadPhoneNumber(lead: Contact) {
  const phone = cleanPhone(lead.telefono || lead.phone || lead.whatsapp);
  return isValidWhatsAppPhone(phone) ? phone : "";
}

export function generateWhatsAppLink(phone: string, text: string, web = true) {
  const cleaned = cleanPhone(phone);
  if (!isValidWhatsAppPhone(cleaned)) return "";
  const encodedText = encodeURIComponent(text);
  return web
    ? `https://web.whatsapp.com/send?phone=${cleaned}&text=${encodedText}`
    : `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodedText}`;
}

export function generateInstagramLink(instagram?: string) {
  if (!hasValue(instagram)) return "";
  const raw = String(instagram).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "").replace(/^instagram\.com\//i, "");
  return `https://www.instagram.com/${encodeURIComponent(handle)}`;
}

export function isLockedStatus(status: ContactStatus) {
  return LOCKED_STATUSES.has(status);
}

export function canSendContact(contact: Contact, skipAlreadyContacted = true) {
  if (!isValidWhatsAppPhone(getLeadWhatsAppNumber(contact)) || contact.status === "sending") return false;
  if (!skipAlreadyContacted) return true;
  return SENDABLE_STATUSES.has(contact.status);
}

export function inferNicheFromText(value: unknown, context: unknown[] = []): NicheKey {
  const niche = normalizeText(value);
  const contextText = normalizeText(context.join(" "));
  const combined = `${niche} ${contextText}`;

  if (
    combined.includes("real_estate") ||
    combined.includes("real estate") ||
    combined.includes("inmobili") ||
    combined.includes("broker") ||
    combined.includes("agente") ||
    combined.includes("plusval") ||
    combined.includes("inmueble") ||
    combined.includes("inmuebles") ||
    combined.includes("propiedad") ||
    combined.includes("propiedades") ||
    combined.includes("residencial") ||
    combined.includes("comercial") ||
    combined.includes("turistico") ||
    combined.includes("inversion") ||
    combined.includes("punta cana") ||
    combined.includes("zona norte")
  ) {
    return "real_estate";
  }
  if (!niche) return "unknown";
  if (niche.includes("developer") || niche.includes("construct") || niche.includes("desarroll")) return "developers";
  if (niche.includes("academy") || niche.includes("academ") || niche.includes("curso") || niche.includes("taller")) return "academy";
  if (niche.includes("beauty") || niche.includes("belleza") || niche.includes("spa") || niche.includes("odont")) return "beauty";
  if (niche.includes("route") || niche.includes("ruta") || niche.includes("catalog") || niche.includes("producto")) return "route_products";
  if (niche.includes("printing") || niche.includes("imprent") || niche.includes("graf") || niche.includes("letrero")) return "printing_graphics";
  if (niche.includes("professional") || niche.includes("abogado") || niche.includes("contable") || niche.includes("fotograf") || niche.includes("consult")) {
    return "professional_services";
  }
  if (niche.includes("b2b") || niche.includes("industrial") || niche.includes("seguridad") || niche.includes("limpieza") || niche.includes("logistica")) return "b2b_services";
  return "unknown";
}

export function resolveLeadNiche(lead: Contact): NicheKey {
  return inferNicheFromText(lead.nicho, [
    lead.nombre_negocio,
    lead.businessName,
    lead.empresa_marca,
    lead.nombre_persona,
    lead.web,
    lead.audit_domain,
    lead.fuente_dato,
    lead.fuente_auditoria,
    lead.senal_comercial,
    lead.dolor_probable,
    lead.oportunidad_visible,
    lead.variables ? Object.values(lead.variables).join(" ") : "",
  ]);
}

export function getLeadBusinessName(lead: Contact) {
  return (
    lead.nombre_negocio ||
    lead.businessName ||
    lead.empresa_marca ||
    lead.name ||
    lead.nombre_persona ||
    "Sin negocio"
  );
}

export function getLeadPersonName(lead: Contact) {
  return lead.nombre_persona || lead.name || lead.cargo_rol || "Contacto por confirmar";
}

export function getLeadCity(lead: Contact) {
  return lead.ciudad_zona || lead.city || "";
}

export function isInstagramOnlyLead(lead: Contact) {
  return (
    hasValue(lead.instagram) &&
    !hasValue(getLeadWhatsAppNumber(lead)) &&
    !hasValue(lead.correo || lead.email) &&
    !hasValue(lead.linkedin) &&
    !hasValue(getLeadPhoneNumber(lead)) &&
    !hasValue(lead.web || lead.audit_domain)
  );
}

export function isBrokerAgentWithoutWeb(lead: Contact) {
  if (resolveLeadNiche(lead) !== "real_estate") return false;
  if (hasValue(lead.web || lead.audit_domain)) return false;

  const text = normalizeText([
    lead.nombre_negocio,
    lead.businessName,
    lead.empresa_marca,
    lead.nombre_persona,
    lead.cargo_rol,
    lead.nicho,
    lead.fuente_dato,
    lead.notas,
    lead.notes,
    lead.instagram,
  ].join(" "));

  return (
    hasValue(lead.instagram) ||
    text.includes("broker") ||
    text.includes("agente") ||
    text.includes("asesor") ||
    text.includes("real estate") ||
    text.includes("inmobili")
  );
}

export function getRecommendedChannel(lead: Contact): RecommendedChannel {
  if (isValidWhatsAppPhone(getLeadWhatsAppNumber(lead))) return "whatsapp";
  if (hasValue(lead.instagram)) return "instagram";
  if (hasValue(lead.correo || lead.email)) return "email";
  if (hasValue(lead.linkedin)) return "linkedin";
  if (isValidWhatsAppPhone(getLeadPhoneNumber(lead))) return "llamada";
  if (hasValue(lead.web || lead.audit_domain)) return "web";
  if (hasValue(lead.sourceUrl || lead.reporte_luma || lead.audit_raw_ref || lead.csv_raw_ref)) return "manual";
  return "sin_canal";
}

export function getFallbackConsultativeMessage(lead: Contact) {
  const business = getLeadBusinessName(lead);
  const person = getLeadPersonName(lead);
  const namePart = person && person !== "Contacto por confirmar" ? person : business;

  return `Hola, ${namePart}. Soy Marcos Hilario, de Luma Premium.\n\nHice una revision preliminar basada en senales publicas de ${business} y vi una oportunidad visible en la ruta comercial digital: captacion, filtro y seguimiento de interesados.\n\nNo es una critica ni una auditoria interna. Es una observacion breve desde afuera.\n\nTe la puedo compartir?`;
}

export function getInstagramDmFallback(lead: Contact) {
  const business = getLeadBusinessName(lead);
  const person = getLeadPersonName(lead);
  const namePart = person && person !== "Contacto por confirmar" ? person : business;

  return `Hola, ${namePart}. Soy Marcos Hilario, de Luma Premium.\n\nVi tu presencia en Instagram y note una oportunidad visible para convertir mejor la atencion que ya generas en una ruta mas clara de captacion y seguimiento.\n\nNo es una critica ni una auditoria interna; es una observacion breve basada en senales publicas.\n\nTe la puedo compartir?`;
}

export function startsWithColdPlusvalMessage(value?: string) {
  const message = normalizeText(value);
  return message.startsWith("vi tu perfil en plusval") || message.includes("note que manejas");
}

export function hasUnsafeOutreachLanguage(value?: string) {
  const message = normalizeText(value);
  return (
    startsWithColdPlusvalMessage(value) ||
    message.startsWith("score") ||
    message.startsWith("tu score") ||
    message.includes("tu negocio esta mal") ||
    message.includes("estas perdiendo") ||
    message.includes("estas dejando dinero") ||
    message.includes("pierdes clientes") ||
    message.includes("perdidas") ||
    message.includes("mal optimizado") ||
    message.includes("auditoria negativa")
  );
}

export function getSafeRecommendedMessage(lead: Contact) {
  if (hasCommercialValue(lead.mensaje_recomendado_safe)) return String(lead.mensaje_recomendado_safe);
  const original = lead.mensaje_whatsapp || lead.suggestedMessage || "";
  if (!hasCommercialValue(original) || hasUnsafeOutreachLanguage(original)) {
    return getFallbackConsultativeMessage(lead);
  }
  return original;
}

export function getChannelMessage(lead: Contact, channel: RecommendedChannel) {
  if (channel === "whatsapp") {
    return getSafeRecommendedMessage(lead);
  }

  if (channel === "instagram") {
    return hasCommercialValue(lead.mensaje_instagram) && !hasUnsafeOutreachLanguage(lead.mensaje_instagram)
      ? String(lead.mensaje_instagram)
      : getInstagramDmFallback(lead);
  }

  if (channel === "email") {
    return hasCommercialValue(lead.mensaje_email) && !hasUnsafeOutreachLanguage(lead.mensaje_email)
      ? String(lead.mensaje_email)
      : getFallbackConsultativeMessage(lead);
  }

  return getFallbackConsultativeMessage(lead);
}

export function getEmailSubject(lead: Contact) {
  return lead.asunto_email || `Observacion breve para ${getLeadBusinessName(lead)}`;
}

export function getLeadOffer(lead: Contact) {
  const offer = String(lead.oferta_recomendada ?? "");
  if (
    hasCommercialValue(offer) &&
    !(isBrokerAgentWithoutWeb(lead) && normalizeText(offer) === normalizeText("Luma Estate OS Foundation"))
  ) {
    return offer;
  }
  if (isBrokerAgentWithoutWeb(lead)) return BROKER_NO_WEB_OFFER;
  return getNicheDefinition(resolveLeadNiche(lead)).offer;
}

export function getLeadTicket(lead: Contact) {
  if (isBrokerAgentWithoutWeb(lead)) return BROKER_NO_WEB_TICKET;
  return getNicheDefinition(resolveLeadNiche(lead)).ticket;
}

export function getLeadPain(lead: Contact) {
  if (hasCommercialValue(lead.dolor_probable || lead.painPoint)) return String(lead.dolor_probable || lead.painPoint);
  if (isBrokerAgentWithoutWeb(lead)) return BROKER_NO_WEB_PAIN;
  return "Dolor pendiente de lectura comercial.";
}

export function getLeadOpportunity(lead: Contact) {
  if (hasCommercialValue(lead.oportunidad_visible)) return String(lead.oportunidad_visible);
  if (isBrokerAgentWithoutWeb(lead)) return BROKER_NO_WEB_OPPORTUNITY;
  const niche = resolveLeadNiche(lead);

  if (niche === "real_estate") {
    return "Ordenar la ruta de captacion, filtro y seguimiento para que los interesados lleguen mejor clasificados antes de hablar con el equipo comercial.";
  }
  if (niche === "academy") {
    return "Organizar inscripcion, cupos, fechas, pagos y seguimiento para reducir friccion en WhatsApp.";
  }
  if (niche === "beauty") {
    return "Convertir consultas de Instagram/WhatsApp en citas mejor filtradas y con seguimiento.";
  }
  if (niche === "b2b_services" || niche === "printing_graphics" || niche === "route_products" || niche === "professional_services") {
    return "Mejorar la ruta de solicitud/cotizacion para que el prospecto entregue informacion util desde el primer contacto.";
  }
  if (niche === "developers") {
    return "Ordenar captacion, filtro y seguimiento de interesados por proyecto antes de que el equipo comercial invierta tiempo.";
  }
  return "Ordenar la ruta de captacion, filtro y seguimiento para convertir consultas en oportunidades mejor calificadas.";
}

export function getLeadSignal(lead: Contact) {
  if (hasCommercialValue(lead.senal_comercial)) return String(lead.senal_comercial);
  const metrics = normalizeText(`${lead.metricas_publicas_json ?? ""} ${lead.variables?.Inmuebles ?? ""} ${lead.variables?.Reviews ?? ""}`);
  if (metrics && metrics !== "{}") {
    return "Se observan senales publicas de volumen operativo en propiedades/resenas visibles.";
  }
  if (resolveLeadNiche(lead) === "real_estate") {
    return "Presencia publica con senales de operacion comercial activa en propiedades, perfiles o canales digitales.";
  }
  return "Presencia publica con senales de operacion comercial activa en perfiles o canales digitales.";
}

export function getReportDisplay(lead: Contact) {
  if (hasCommercialValue(lead.reporte_luma)) return String(lead.reporte_luma);
  if (hasCommercialValue(lead.audit_raw_ref || lead.audit_slug || lead.audit_domain)) {
    return "Ruta de auditoria disponible localmente.";
  }
  return "Reporte pendiente de conexion.";
}

export function statusLabel(status: ContactStatus) {
  const labels: Record<ContactStatus, string> = {
    pending: "Pendiente",
    listo_contacto: "Listo contacto",
    sin_accion_por_ahora: "Sin accion por ahora",
    contacted: "Contactado",
    replied: "Respondió",
    respondio: "Respondió",
    interested: "Interesado",
    follow_up: "Seguimiento",
    appointment: "Cita",
    call: "Llamada",
    diagnostico: "Diagnostico",
    reunion_pendiente: "Reunion pendiente",
    proposal_sent: "Propuesta enviada",
    propuesta_enviada: "Propuesta enviada",
    negotiating: "Negociando",
    closed: "Cerrado",
    lost: "Perdido",
    not_interested: "No interesado",
    needs_review: "Necesita revision",
    sin_canal: "Sin canal",
    datos_incompletos: "Datos incompletos",
    conflicto_contacto: "Conflicto contacto",
    mensaje_faltante: "Mensaje faltante",
    buscar_canal: "Buscar canal",
    discarded: "Descartado",
    referred: "Referido",
    sending: "Abriendo",
    failed: "Fallido",
  };

  return labels[status] ?? status;
}
