"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDownUp,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileUp,
  Filter,
  Flame,
  Gauge,
  Gem,
  Inbox,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  MessagesSquare,
  Phone,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DEFAULT_WORKSPACE, getWorkspaceConfig, type WorkspaceConfig } from "@/config/workspaces";
import { NICHES, UNKNOWN_NICHE, getNicheDefinition } from "@/data/niches";
import { PRODUCT_CATALOG } from "@/data/products";
import { inferCampaignName, parseRowsToContacts, UNIFIED_LEAD_FIELDS } from "@/lib/leadImport";
import {
  cleanPhone,
  cn,
  generateInstagramLink,
  generateWhatsAppLink,
  getChannelMessage,
  getEmailSubject,
  getLeadBusinessName,
  getLeadCity,
  getLeadDemo,
  getLeadOffer,
  getLeadPain,
  getLeadOpportunity,
  getLeadPhoneNumber,
  getLeadPersonName,
  getLeadSignal,
  getLeadTicket,
  getLeadWhatsAppNumber,
  getReportDisplay,
  getRecommendedChannel,
  getSafeRecommendedMessage,
  hasValue,
  hasUnsafeOutreachLanguage,
  isBrokerAgentWithoutWeb,
  isInstagramOnlyLead,
  resolveLeadNiche,
  statusLabel,
} from "@/lib/utils";
import type { AppState, Contact, ContactStatus, ImportHistoryItem, ImportMode, ImportReport, NicheKey, RecommendedChannel, SendConfig } from "@/types";

const STORAGE_KEY = "luma_outreach_console_state_v1";
const LEGACY_STORAGE_KEY = "luma_outreach_legacy_crm_data";
const LUMA_HUB_BASE_URL = "https://luma-intelligence-hub.vercel.app";

function getDefaultTemplate(workspace: WorkspaceConfig) {
  return `Hola, [Nombre]. Soy ${workspace.operatorName}, de ${workspace.companyName}. Hice una revision preliminar basada en senales publicas y vi una oportunidad visible en la ruta digital/comercial de [Negocio]. Te puedo enviar una observacion breve?`;
}

const DEFAULT_TEMPLATE = getDefaultTemplate(DEFAULT_WORKSPACE);

const DEFAULT_CONFIG: SendConfig = {
  minDelay: 45,
  maxDelay: 90,
  batchSize: 3,
  batchDelay: 300,
  maxSessionSends: 5,
  skipAlreadyContacted: true,
  useSuggestedMessage: true,
};

type ParsedUpload = {
  rows: unknown[][];
  sheetName?: string;
};

type PendingImport = ParsedUpload & {
  fileName: string;
};

type ViewKey =
  | "command"
  | "nichos"
  | "today"
  | "prospects"
  | "followup"
  | "calls"
  | "proposals"
  | "review"
  | "import"
  | "settings";

type DateFilter =
  | "all"
  | "contactados_hoy"
  | "seguimiento_hoy"
  | "seguimiento_vencido"
  | "seguimiento_semana"
  | "importados_recientemente"
  | "sin_fecha_seguimiento";

type QuickFilter =
  | "all"
  | "whatsapp_ready"
  | "instagram_ready"
  | "email_ready"
  | "instagram_only"
  | "sin_canal"
  | "sin_web"
  | "brokers_sin_web";

type Toast = {
  message: string;
  type: "info" | "success" | "error";
};

type SheetsSyncState = {
  connected: boolean;
  isSyncing: boolean;
  isSaving: boolean;
  lastSyncAt?: string;
  lastSaveAt?: string;
  error?: string;
  mode: "google_sheets" | "local_fallback";
};

type BatchCreationSummary = {
  total_evaluados: number;
  con_whatsapp: number;
  con_instagram: number;
  excluidos_estado_bloqueante: number;
  excluidos_falta_canal: number;
  excluidos_contacto_reciente: number;
  excluidos_lote_activo?: number;
  sin_mensaje?: number;
  incluidos_lote: number;
  motivo_principal?: string;
};

interface LumaOutreachConsoleProps {
  workspaceSlug?: string;
  initialView?: ViewKey;
  initialNiche?: NicheKey | "all";
  routeBatchId?: string;
  routeLeadId?: string;
}

const NAV_ITEMS: Array<{ key: ViewKey; label: string; icon: LucideIcon }> = [
  { key: "command", label: "Command Center", icon: LayoutDashboard },
  { key: "nichos", label: "Nichos", icon: BriefcaseBusiness },
  { key: "today", label: "Lote de Hoy", icon: Flame },
  { key: "prospects", label: "Prospectos", icon: Users },
  { key: "followup", label: "Seguimiento", icon: MessagesSquare },
  { key: "calls", label: "Llamadas", icon: Phone },
  { key: "proposals", label: "Propuestas", icon: FileSpreadsheet },
  { key: "review", label: "Revision", icon: AlertTriangle },
  { key: "import", label: "Importar", icon: FileUp },
  { key: "settings", label: "Configuracion", icon: Settings2 },
];

const STATUS_ACTIONS: Array<{ status: ContactStatus; label: string }> = [
  { status: "contacted", label: "Contactado" },
  { status: "replied", label: "Respondio" },
  { status: "interested", label: "Interesado" },
  { status: "follow_up", label: "Seguimiento" },
  { status: "sin_accion_por_ahora", label: "Sin accion por ahora" },
  { status: "call", label: "Llamada" },
  { status: "proposal_sent", label: "Propuesta enviada" },
  { status: "not_interested", label: "No interesado" },
];

const FOLLOW_UP_STATUSES = new Set<ContactStatus>([
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
]);

const CALL_STATUSES = new Set<ContactStatus>(["call", "appointment", "diagnostico", "reunion_pendiente"]);
const PROPOSAL_STATUSES = new Set<ContactStatus>(["proposal_sent", "propuesta_enviada", "negotiating", "closed", "lost"]);
const OUTBOUND_ATTEMPT_STATUSES = new Set<ContactStatus>(["contacted", "follow_up", "call", "appointment", "proposal_sent", "propuesta_enviada"]);
const REVIEW_STATUSES = new Set<ContactStatus>([
  "needs_review",
  "sin_canal",
  "datos_incompletos",
  "conflicto_contacto",
  "mensaje_faltante",
  "buscar_canal",
]);
const CONTACTABLE_STATUSES = new Set<ContactStatus>(["pending", "failed"]);
CONTACTABLE_STATUSES.add("listo_contacto");
const PROSPECTS_PAGE_SIZE = 100;

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: "Toda fecha",
  contactados_hoy: "Contactados hoy",
  seguimiento_hoy: "Seguimiento hoy",
  seguimiento_vencido: "Seguimiento vencido",
  seguimiento_semana: "Seguimiento esta semana",
  importados_recientemente: "Importados recientemente",
  sin_fecha_seguimiento: "Sin fecha de seguimiento",
};

const QUICK_FILTER_LABELS: Record<QuickFilter, string> = {
  all: "Sin filtro rapido",
  whatsapp_ready: "WhatsApp-ready",
  instagram_ready: "Instagram-ready",
  email_ready: "Email-ready",
  instagram_only: "Instagram-only",
  sin_canal: "Sin canal",
  sin_web: "Sin web",
  brokers_sin_web: "Brokers sin web",
};

const QUICK_FILTERS: Array<{ key: QuickFilter; label: string }> = [
  { key: "whatsapp_ready", label: "WhatsApp-ready" },
  { key: "instagram_ready", label: "Instagram-ready" },
  { key: "email_ready", label: "Email-ready" },
  { key: "instagram_only", label: "Instagram-only" },
  { key: "sin_canal", label: "Sin canal" },
  { key: "sin_web", label: "Sin web" },
  { key: "brokers_sin_web", label: "Brokers sin web" },
];

const CHANNEL_LABELS: Record<RecommendedChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "Email",
  linkedin: "LinkedIn",
  llamada: "Llamada",
  web: "Web",
  manual: "Manual",
  sin_canal: "Sin canal",
};

const CHANNEL_STYLES: Record<RecommendedChannel, string> = {
  whatsapp: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  instagram: "border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100",
  email: "border-sky-300/20 bg-sky-300/10 text-sky-100",
  linkedin: "border-blue-300/20 bg-blue-300/10 text-blue-100",
  llamada: "border-orange-300/20 bg-orange-300/10 text-orange-100",
  web: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  manual: "border-white/10 bg-white/[0.06] text-white/[0.62]",
  sin_canal: "border-white/10 bg-white/[0.04] text-white/[0.45]",
};

const STATUS_STYLES: Partial<Record<ContactStatus, string>> = {
  pending: "border-white/10 bg-white/[0.04] text-white/[0.55]",
  listo_contacto: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  sin_accion_por_ahora: "border-white/10 bg-white/[0.04] text-white/[0.45]",
  contacted: "border-sky-300/20 bg-sky-300/10 text-sky-100",
  replied: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  respondio: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  interested: "border-lime-300/20 bg-lime-300/10 text-lime-100",
  follow_up: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  call: "border-orange-300/20 bg-orange-300/10 text-orange-100",
  appointment: "border-purple-300/20 bg-purple-300/10 text-purple-100",
  proposal_sent: "border-[#C7A45A]/30 bg-[#C7A45A]/10 text-[#F5D78C]",
  propuesta_enviada: "border-[#C7A45A]/30 bg-[#C7A45A]/10 text-[#F5D78C]",
  negotiating: "border-yellow-300/20 bg-yellow-300/10 text-yellow-100",
  closed: "border-emerald-300/25 bg-emerald-300/[0.12] text-emerald-100",
  lost: "border-red-300/20 bg-red-300/10 text-red-100",
  not_interested: "border-red-300/20 bg-red-300/10 text-red-100",
  needs_review: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  sin_canal: "border-white/10 bg-white/[0.04] text-white/[0.45]",
  datos_incompletos: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  conflicto_contacto: "border-red-300/20 bg-red-300/10 text-red-100",
  mensaje_faltante: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  buscar_canal: "border-sky-300/20 bg-sky-300/10 text-sky-100",
  discarded: "border-red-300/20 bg-red-300/10 text-red-100",
};

const CALL_SCRIPT =
  "Gracias por tomar la llamada. Te muestro rapido lo que vi desde senales publicas, que puede significar comercialmente y que estructura tendria sentido si deciden mejorarlo.";

const GOOGLE_SHEETS_COLUMNS = [
  "id",
  "nicho",
  "prioridad",
  "nombre_negocio",
  "nombre_persona",
  "whatsapp",
  "correo",
  "instagram",
  "senal_comercial",
  "dolor_probable",
  "oportunidad_visible",
  "oferta_recomendada",
  "angulo_contacto",
  "estado",
  "proximo_paso",
  "fecha_contacto",
  "fecha_seguimiento",
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
  "notas",
  "ultimo_canal_usado",
  "cantidad_contactos",
  "fecha_ultima_actualizacion",
  "imported_at",
];

function createEmptyState(workspace: WorkspaceConfig = DEFAULT_WORKSPACE): AppState {
  return {
    contacts: [],
    template: getDefaultTemplate(workspace),
    config: DEFAULT_CONFIG,
    isPaused: false,
    isSending: false,
    currentIndex: 0,
    sessionSentCount: 0,
    campaignName: workspace.brandName,
    importHistory: [],
    workspace: {
      activeLeadCount: 0,
      activeNiches: [],
      lastImportMode: "replace",
      datasetStatus: "limpio",
      activeBatchMainNiche: "unknown",
    },
  };
}

function normalizeLoadedContact(contact: Contact): Contact {
  let status = contact.status === "sending" ? "pending" : contact.status || "pending";
  const phone = cleanPhone(contact.phone || contact.whatsapp || contact.telefono);
  const whatsapp = cleanPhone(contact.whatsapp || (!hasValue(contact.telefono) ? contact.phone : ""));
  const telefono = cleanPhone(contact.telefono || (!hasValue(whatsapp) ? contact.phone : ""));
  const resolvedNiche = resolveLeadNiche({ ...contact, status } as Contact);
  const attempts = Number(contact.attempt_count ?? contact.cantidad_contactos ?? contact.sentCount ?? 0) || 0;
  const channelSeed = { ...contact, status, nicho: resolvedNiche, phone, whatsapp, telefono } as Contact;
  if (status === "pending" && isInstagramOnlyLead(channelSeed) && hasValue(contact.mensaje_instagram)) {
    status = "listo_contacto";
  }
  const lastChannel = contact.last_channel || contact.ultimo_canal_usado || getRecommendedChannel(channelSeed);

  return {
    ...contact,
    phone,
    whatsapp,
    telefono,
    name: contact.name || contact.nombre_persona || contact.nombre_negocio || "Sin nombre",
    businessName: contact.businessName || contact.nombre_negocio || contact.empresa_marca,
    status,
    estado: status,
    nicho: resolvedNiche,
    sentCount: contact.sentCount ?? contact.cantidad_contactos ?? 0,
    cantidad_contactos: contact.cantidad_contactos ?? contact.sentCount ?? 0,
    attempt_count: attempts,
    followup_due_date: contact.followup_due_date || contact.fecha_seguimiento,
    last_interaction_date: contact.last_interaction_date || contact.fecha_contacto || contact.lastContactDate || contact.fecha_ultima_actualizacion,
    last_channel: lastChannel,
    conversation_summary: contact.conversation_summary || contact.notas || contact.notes || contact.tipo_respuesta,
    variables: contact.variables ?? {},
    oferta_recomendada: getLeadOffer(contact),
    dolor_probable: contact.dolor_probable || getLeadPain(contact),
    oportunidad_visible: getLeadOpportunity(contact),
    senal_comercial: getLeadSignal(contact),
    mensaje_recomendado_safe: contact.mensaje_recomendado_safe || getSafeRecommendedMessage(contact),
    decision_status: contact.decision_status || (PROPOSAL_STATUSES.has(status) ? status : undefined),
  };
}

function isToday(value?: string) {
  if (!value) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value === new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
}

function parseDateValue(value?: string) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isPastDate(value?: string) {
  const date = parseDateValue(value);
  if (!date) return false;
  return startOfLocalDay(date).getTime() < startOfLocalDay(new Date()).getTime();
}

function isThisCalendarWeek(value?: string) {
  const date = parseDateValue(value);
  if (!date) return false;
  const today = startOfLocalDay(new Date());
  const weekStartsOnMonday = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - weekStartsOnMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return startOfLocalDay(date).getTime() >= weekStart.getTime() && startOfLocalDay(date).getTime() <= weekEnd.getTime();
}

function isWithinLastDays(value: string | undefined, days: number) {
  const date = parseDateValue(value);
  if (!date) return false;
  const now = new Date();
  const floor = new Date(now);
  floor.setDate(now.getDate() - days);
  return date.getTime() >= floor.getTime() && date.getTime() <= now.getTime();
}

function priorityRank(value?: string) {
  const priority = String(value ?? "").toLowerCase();
  if (priority.includes("alta") || priority.includes("high") || priority === "1") return 0;
  if (priority.includes("media") || priority.includes("medium") || priority === "2") return 1;
  if (priority.includes("baja") || priority.includes("low") || priority === "3") return 2;
  return 3;
}

function createChannelCounts(): Record<RecommendedChannel, number> {
  return { whatsapp: 0, instagram: 0, email: 0, linkedin: 0, llamada: 0, web: 0, manual: 0, sin_canal: 0 };
}

function visibleValue(value: unknown) {
  return hasValue(value) ? String(value) : "No visible";
}

function formatLocalDateTime(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function normalizeExternalUrl(value?: string) {
  if (!hasValue(value)) return "";
  const raw = String(value).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

function getLeadReportUrl(lead: Contact) {
  if (hasValue(lead.reporte_luma)) return normalizeExternalUrl(String(lead.reporte_luma));
  if (hasValue(lead.audit_slug)) {
    return `${LUMA_HUB_BASE_URL.replace(/\/$/, "")}/audit/${encodeURIComponent(String(lead.audit_slug).trim())}`;
  }
  return "";
}

function getLeadSourceLabel(lead: Contact) {
  if (lead.source_origin === "google_sheets" || lead.sourceFile?.toLowerCase().includes("google sheets")) return "Google Sheets";
  if (lead.source_origin === "csv" || lead.sourceFile || lead.imported_file_name) return "CSV";
  return "local";
}

function getHost(value?: string) {
  const url = normalizeExternalUrl(value);
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function isSuspiciousDomainValue(value?: string) {
  if (!hasValue(value)) return false;
  const raw = String(value).trim();
  if (raw.includes(" ")) return true;
  const host = getHost(raw);
  return !host || !host.includes(".") || host.includes("_") || host.length < 4;
}

function needsDomainReview(lead: Contact) {
  const web = visibleValue(lead.web) !== "No visible" ? String(lead.web) : "";
  const auditDomain = visibleValue(lead.audit_domain) !== "No visible" ? String(lead.audit_domain) : "";
  if (isSuspiciousDomainValue(web) || isSuspiciousDomainValue(auditDomain)) return true;
  const webHost = getHost(web);
  const auditHost = getHost(auditDomain);
  return Boolean(webHost && auditHost && webHost !== auditHost);
}

function hasOnlyInstagram(lead: Contact) {
  return isInstagramOnlyLead(lead);
}

type ReviewReason = {
  key: string;
  label: string;
  detail: string;
  tone?: "neutral" | "warning" | "danger" | "success";
};

function getReviewReasons(lead: Contact): ReviewReason[] {
  const reasons: ReviewReason[] = [];
  const channel = getRecommendedChannel(lead);
  const messageMissing =
    channel === "instagram"
      ? !hasValue(lead.mensaje_instagram)
      : channel === "email"
        ? !hasValue(lead.mensaje_email)
        : channel === "whatsapp"
          ? !hasValue(lead.mensaje_whatsapp || lead.suggestedMessage)
          : !hasValue(lead.mensaje_whatsapp || lead.mensaje_instagram || lead.mensaje_email || lead.suggestedMessage);
  const businessMissing = !hasValue(lead.nombre_negocio || lead.businessName || lead.name);
  const instagramWithoutWeb = hasValue(lead.instagram) && !hasValue(lead.web || lead.audit_domain);

  if (channel === "sin_canal") {
    reasons.push({ key: "sin_canal", label: "Sin canal visible", detail: "No hay WhatsApp, Instagram, email, LinkedIn, telefono o web usable.", tone: "danger" });
  }
  if (hasOnlyInstagram(lead)) {
    reasons.push({ key: "solo_instagram", label: "Solo Instagram", detail: "Prospecto valido. Puede contactarse por DM para ofrecer infraestructura digital.", tone: "success" });
  }
  if (!hasValue(lead.web || lead.audit_domain)) {
    reasons.push({
      key: "sin_web",
      label: instagramWithoutWeb ? "Sin web, contacto por Instagram" : "Sin web",
      detail: instagramWithoutWeb
        ? "Contacto disponible por Instagram. Requiere enfoque DM."
        : "No hay sitio visible; no bloquea contacto si otro canal existe.",
      tone: instagramWithoutWeb ? "success" : "neutral",
    });
  }
  if (needsDomainReview(lead)) {
    reasons.push({ key: "dominio_no_validado", label: "Dominio no validado", detail: "Web o audit_domain parece invalido o no coincide. Revisar dominio.", tone: "warning" });
  }
  if (resolveLeadNiche(lead) === "unknown") {
    reasons.push({ key: "nicho_pendiente", label: "Nicho pendiente", detail: "No se pudo clasificar el nicho con confianza.", tone: "warning" });
  }
  if (messageMissing) {
    reasons.push({ key: "mensaje_faltante", label: "Mensaje faltante", detail: "No vino mensaje por canal; se usara fallback consultivo si Marcos decide contactar.", tone: "warning" });
  }
  if (lead.status === "conflicto_contacto") {
    reasons.push({ key: "conflicto_datos", label: "Conflicto de datos", detail: "El estado indica conflicto de contacto.", tone: "danger" });
  }
  if (lead.status === "datos_incompletos" || businessMissing) {
    reasons.push({ key: "datos_incompletos", label: "Datos incompletos", detail: "Falta nombre de negocio/persona o informacion clave.", tone: "warning" });
  }

  return reasons;
}

function isReadyLead(lead: Contact) {
  const channel = getRecommendedChannel(lead);
  return channel !== "sin_canal" && CONTACTABLE_STATUSES.has(lead.status);
}

function isReviewLead(lead: Contact) {
  return REVIEW_STATUSES.has(lead.status) || getReviewReasons(lead).length > 0;
}

function buildLeadSearchText(lead: Contact) {
  const niche = getNicheDefinition(resolveLeadNiche(lead));
  const demo = getLeadDemo(lead);
  return [
    getLeadBusinessName(lead),
    getLeadPersonName(lead),
    lead.name,
    lead.nombre_negocio,
    lead.nombre_persona,
    lead.phone,
    lead.telefono,
    getLeadPhoneNumber(lead),
    getLeadWhatsAppNumber(lead),
    lead.whatsapp,
    lead.instagram,
    lead.correo,
    lead.email,
    lead.web,
    lead.audit_domain,
    niche.label,
    niche.shortLabel,
    lead.nicho,
    statusLabel(lead.status),
    lead.estado,
    CHANNEL_LABELS[getRecommendedChannel(lead)],
    lead.last_channel,
    lead.ultimo_canal_usado,
    lead.proximo_paso,
    lead.nextStep,
    lead.fecha_contacto,
    lead.fecha_seguimiento,
    lead.followup_due_date,
    getLeadOffer(lead),
    getLeadTicket(lead),
    lead.monto_estimado,
    lead.decision_status,
    lead.propuesta_link,
    lead.material_link,
    demo.label,
    demo.url,
    lead.notas,
    lead.notes,
    lead.conversation_summary,
    lead.senal_comercial,
    lead.dolor_probable,
    lead.oportunidad_visible,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function leadMatchesQuery(lead: Contact, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return buildLeadSearchText(lead).includes(normalized);
}

function readUpload(file: File): Promise<ParsedUpload> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "xlsx" || extension === "xls") {
    return file.arrayBuffer().then((buffer) => {
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName =
        workbook.SheetNames.find((name) => name.toLowerCase().includes("prospect")) || workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        blankrows: false,
        defval: "",
      });
      return { rows, sheetName };
    });
  }

  return file.text().then((text) => {
    const parsed = Papa.parse<unknown[]>(text, {
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0].message);
    }

    return { rows: parsed.data as unknown[][] };
  });
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", className)}>
      {children}
    </span>
  );
}

function EmptyState({
  title,
  body,
  icon: Icon = Inbox,
}: {
  title: string;
  body: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="luma-empty">
      <Icon size={34} strokeWidth={1.4} />
      <div>
        <p className="text-sm font-semibold text-[var(--luma-ivory)]">{title}</p>
        <p className="mt-1 max-w-xl text-sm text-[var(--luma-muted)]">{body}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: "neutral" | "gold" | "success" | "warning";
}) {
  return (
    <div className={cn("luma-panel p-5", tone === "gold" && "luma-panel-gold")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="luma-kicker">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--luma-ivory)]">{value}</p>
        </div>
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-lg border",
            tone === "success"
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : tone === "warning"
                ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                : "border-white/10 bg-white/[0.04] text-[var(--luma-gold)]",
          )}
        >
          <Icon size={18} />
        </div>
      </div>
      {detail && <p className="mt-4 text-sm leading-relaxed text-[var(--luma-muted)]">{detail}</p>}
    </div>
  );
}

function LeadChannelBadge({ channel }: { channel: RecommendedChannel }) {
  return <Badge className={CHANNEL_STYLES[channel]}>{CHANNEL_LABELS[channel]}</Badge>;
}

function LeadStatusBadge({ status }: { status: ContactStatus }) {
  return <Badge className={STATUS_STYLES[status] ?? "border-white/10 bg-white/[0.04] text-white/[0.55]"}>{statusLabel(status)}</Badge>;
}

function ActionButton({
  children,
  onClick,
  icon: Icon,
  variant = "default",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "default" | "gold" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variant === "gold"
          ? "border-[#C7A45A]/40 bg-[#C7A45A]/[0.14] text-[#F5D78C] hover:bg-[#C7A45A]/20"
          : variant === "danger"
            ? "border-red-300/20 bg-red-300/10 text-red-100 hover:bg-red-300/15"
            : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/16 hover:bg-white/[0.07]",
      )}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function TextPreviewBlock({
  title,
  value,
  onCopy,
  actionLabel = "Ver mas",
}: {
  title: string;
  value: string;
  onCopy: () => void;
  actionLabel?: string;
}) {
  const cleanValue = hasValue(value) ? String(value).trim() : "Sin dato registrado.";
  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="luma-kicker">{title}</p>
        <button type="button" onClick={onCopy} className="text-white/[0.45] transition hover:text-[var(--luma-gold)]">
          <Copy size={14} />
        </button>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--luma-muted)]">{cleanValue}</p>
      <details className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
        <summary className="cursor-pointer text-xs font-semibold text-[#F5D78C]">{actionLabel}</summary>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--luma-muted)]">{cleanValue}</p>
        <button type="button" onClick={onCopy} className="mt-3 text-xs font-semibold text-[#F5D78C]">
          Copiar completo
        </button>
      </details>
    </div>
  );
}

function buildProposalSummary(lead: Contact) {
  const niche = getNicheDefinition(resolveLeadNiche(lead));
  const demo = getLeadDemo(lead);
  const channel = (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel;
  return [
    `Prospecto: ${getLeadBusinessName(lead)}`,
    `Persona: ${getLeadPersonName(lead)}`,
    `Nicho: ${niche.shortLabel}`,
    `Oferta Luma: ${getLeadOffer(lead)}`,
    `Ticket sugerido: ${getLeadTicket(lead)}`,
    `Demo asociada: ${demo.label} - ${demo.url}`,
    `Canal usado: ${CHANNEL_LABELS[channel] || channel}`,
    `Fecha: ${formatDate(lead.fecha_propuesta)}`,
    `Estado actual: ${statusLabel(lead.status)}`,
    `Proximo paso: ${lead.proximo_paso || lead.nextStep || "Definir seguimiento comercial."}`,
    `Link propuesta: ${visibleValue(lead.propuesta_link)}`,
    `Notas: ${lead.conversation_summary || lead.notas || lead.notes || "Sin nota comercial."}`,
  ].join("\n");
}

function LeadOperationalCard({
  lead,
  selected,
  expanded,
  variant = "default",
  saving,
  onToggleSelection,
  onToggleMore,
  onDetails,
  onCopyMessage,
  onCopyEmail,
  onOpenWhatsApp,
  onOpenInstagram,
  onOpenWeb,
  onOpenDemo,
  onSave,
  onPrepareProposal,
  onUpdateStatus,
  onAssignChannel,
  onCopyContactData,
  onCopyProposalSummary,
  onSaveProposalLink,
  onSaveMaterialLink,
  onNotesBlur,
}: {
  lead: Contact;
  selected: boolean;
  expanded: boolean;
  variant?: "default" | "proposal";
  saving?: boolean;
  onToggleSelection: () => void;
  onToggleMore: () => void;
  onDetails: () => void;
  onCopyMessage: () => void;
  onCopyEmail: () => void;
  onOpenWhatsApp: () => void;
  onOpenInstagram: () => void;
  onOpenWeb: () => void;
  onOpenDemo: () => void;
  onSave: () => void;
  onPrepareProposal: () => void;
  onUpdateStatus: (status: ContactStatus, channel?: RecommendedChannel) => void;
  onAssignChannel: (channel: RecommendedChannel) => void;
  onCopyContactData: () => void;
  onCopyProposalSummary: () => void;
  onSaveProposalLink: () => void;
  onSaveMaterialLink: () => void;
  onNotesBlur: (value: string) => void;
}) {
  const channel = (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel;
  const niche = getNicheDefinition(resolveLeadNiche(lead));
  const demo = getLeadDemo(lead);
  const message = getChannelMessage(lead, channel);
  const whatsappNumber = getLeadWhatsAppNumber(lead);
  const emailAddress = lead.correo || lead.email || "";
  const webTarget = lead.web || lead.audit_domain || "";
  const reportUrl = getLeadReportUrl(lead);
  const notes = lead.conversation_summary || lead.notas || lead.notes || "";
  const signal = getLeadSignal(lead);
  const opportunity = getLeadOpportunity(lead);
  const pain = getLeadPain(lead);
  const nextStep = lead.proximo_paso || lead.nextStep || "Definir siguiente movimiento.";
  const proposalSummary = buildProposalSummary(lead);

  return (
    <article className="luma-lead-card">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/60">
              <input type="checkbox" checked={selected} onChange={onToggleSelection} className="h-4 w-4 accent-[#C7A45A]" />
              Seleccionar
            </label>
            <LeadStatusBadge status={lead.status} />
            <LeadChannelBadge channel={channel} />
            <Badge className="border-white/10 bg-white/[0.04] text-white/60">{niche.shortLabel}</Badge>
            <Badge className="border-white/10 bg-white/[0.04] text-white/60">Origen: {getLeadSourceLabel(lead)}</Badge>
            {!hasValue(message) && <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">Mensaje fallback</Badge>}
          </div>

          <button type="button" onClick={onDetails} className="mt-4 block max-w-full text-left">
            <h3 className="truncate text-xl font-semibold tracking-tight text-[var(--luma-ivory)] transition hover:text-[#F5D78C]">
              {getLeadBusinessName(lead)}
            </h3>
            <p className="mt-1 truncate text-sm text-[var(--luma-muted)]">
              {getLeadPersonName(lead)} {lead.cargo_rol ? `- ${lead.cargo_rol}` : ""} {getLeadCity(lead) ? `- ${getLeadCity(lead)}` : ""}
            </p>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <ActionButton icon={Clipboard} variant="gold" onClick={onDetails}>
            Ver detalles
          </ActionButton>
          <ActionButton icon={Copy} onClick={onCopyMessage}>
            Copiar mensaje
          </ActionButton>
          <ActionButton icon={MessageCircle} onClick={onOpenWhatsApp} disabled={!hasValue(whatsappNumber)}>
            WhatsApp
          </ActionButton>
          <ActionButton icon={ExternalLink} onClick={onOpenInstagram} disabled={!hasValue(lead.instagram)}>
            Instagram
          </ActionButton>
          <ActionButton icon={Mail} onClick={onCopyEmail} disabled={!hasValue(emailAddress)}>
            Email
          </ActionButton>
          <ActionButton icon={Save} variant="gold" onClick={onSave} disabled={saving}>
            Guardar
          </ActionButton>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoBlock title="WhatsApp" value={visibleValue(whatsappNumber)} />
        <InfoBlock title="Instagram" value={visibleValue(lead.instagram)} />
        <InfoBlock title="Email" value={visibleValue(emailAddress)} />
        <InfoBlock title="Web" value={visibleValue(webTarget)} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoBlock title="Proximo paso" value={nextStep} />
        <InfoBlock title="Fecha seguimiento" value={formatDate(lead.followup_due_date || lead.fecha_seguimiento)} />
        <InfoBlock title="Oferta Luma" value={getLeadOffer(lead)} />
        <InfoBlock title="Ticket / demo" value={`${getLeadTicket(lead)}\n${demo.label}`} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <TextPreviewBlock title="Mensaje recomendado" value={message} onCopy={onCopyMessage} actionLabel="Ver mensaje" />
        <TextPreviewBlock title="Senal comercial" value={signal} onCopy={() => navigator.clipboard?.writeText(signal)} />
        <TextPreviewBlock title="Oportunidad visible" value={opportunity} onCopy={() => navigator.clipboard?.writeText(opportunity)} />
        <TextPreviewBlock title="Notas" value={notes || "Sin notas registradas."} onCopy={() => navigator.clipboard?.writeText(notes || "")} />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
          <p className="luma-kicker">Cambiar estado</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton onClick={() => onUpdateStatus("contacted", channel)}>Contactado</ActionButton>
            <ActionButton onClick={() => onUpdateStatus("replied", channel)}>Respondio</ActionButton>
            <ActionButton onClick={() => onUpdateStatus("follow_up", channel)}>Seguimiento</ActionButton>
            <ActionButton onClick={() => onUpdateStatus("call", "llamada")}>Llamada</ActionButton>
            <ActionButton variant="gold" onClick={() => onUpdateStatus("proposal_sent", channel)}>Propuesta enviada</ActionButton>
            <ActionButton onClick={() => onUpdateStatus("not_interested", channel)}>No interesado</ActionButton>
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
          <p className="luma-kicker">Canal usado</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton onClick={() => onAssignChannel("whatsapp")}>WhatsApp</ActionButton>
            <ActionButton onClick={() => onAssignChannel("instagram")}>Instagram</ActionButton>
            <ActionButton onClick={() => onAssignChannel("email")}>Email</ActionButton>
            <ActionButton onClick={() => onAssignChannel("llamada")}>Llamada</ActionButton>
            <ActionButton onClick={() => onAssignChannel("manual")}>Manual</ActionButton>
          </div>
        </div>
      </div>

      {variant === "proposal" && (
        <div className="mt-4 rounded-lg border border-[#C7A45A]/25 bg-[#C7A45A]/[0.06] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="luma-kicker">Pipeline comercial</p>
              <p className="mt-2 text-sm leading-relaxed text-[#F5D78C]">
                {getLeadBusinessName(lead)} - {getLeadOffer(lead)} - {getLeadTicket(lead)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton icon={Copy} onClick={onCopyProposalSummary}>Copiar resumen</ActionButton>
              <ActionButton icon={ExternalLink} onClick={onOpenDemo}>Abrir demo</ActionButton>
              <ActionButton icon={Clipboard} variant="gold" onClick={onPrepareProposal}>Preparar propuesta</ActionButton>
              <ActionButton onClick={onSaveProposalLink}>Guardar link</ActionButton>
              <ActionButton onClick={() => onUpdateStatus("negotiating", channel)}>Negociando</ActionButton>
              <ActionButton onClick={() => onUpdateStatus("closed", channel)}>Cerrado</ActionButton>
              <ActionButton variant="danger" onClick={() => onUpdateStatus("lost", channel)}>Perdido</ActionButton>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoBlock title="Link propuesta" value={visibleValue(lead.propuesta_link)} />
            <InfoBlock title="Canal usado" value={CHANNEL_LABELS[channel] || String(channel)} />
            <InfoBlock title="Fecha propuesta" value={formatDate(lead.fecha_propuesta)} />
            <InfoBlock title="Estado propuesta" value={lead.decision_status || statusLabel(lead.status)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton onClick={onSaveMaterialLink}>Guardar material/demo</ActionButton>
            <ActionButton icon={Save} variant="gold" onClick={onSave} disabled={saving}>
              Guardar en Sheets
            </ActionButton>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={onToggleMore}>{expanded ? "Ocultar datos" : "Ver mas"}</ActionButton>
        <ActionButton icon={Clipboard} onClick={onCopyContactData}>Copiar datos</ActionButton>
        <ActionButton icon={ExternalLink} onClick={onOpenWeb} disabled={!hasValue(webTarget)}>Abrir web</ActionButton>
        <ActionButton icon={ExternalLink} onClick={onOpenDemo}>Abrir demo</ActionButton>
        {hasValue(reportUrl) && (
          <ActionButton icon={ExternalLink} onClick={() => window.open(reportUrl, "_blank", "noopener,noreferrer")}>
            Ver Reporte Luma
          </ActionButton>
        )}
        {variant !== "proposal" && (
          <ActionButton icon={Clipboard} variant="gold" onClick={onPrepareProposal}>
            Preparar propuesta
          </ActionButton>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 rounded-lg border border-white/[0.08] bg-black/10 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoBlock title="Telefono" value={visibleValue(getLeadPhoneNumber(lead))} />
            <InfoBlock title="Reporte Luma" value={getReportDisplay(lead)} />
            <InfoBlock title="Propuesta asociada" value={visibleValue(lead.propuesta_link)} />
            <InfoBlock title="Origen" value={getLeadSourceLabel(lead)} />
            <InfoBlock title="Dolor probable" value={pain} />
            <InfoBlock title="Angulo" value={lead.angulo_contacto || lead.contactAngle || "Angulo pendiente."} />
            <InfoBlock title="Demo asociada" value={`${demo.label}\n${demo.url}`} />
            <InfoBlock title="Ultimo canal" value={CHANNEL_LABELS[channel] || String(channel)} />
          </div>
          <textarea
            defaultValue={notes}
            onBlur={(event) => onNotesBlur(event.target.value)}
            placeholder="Nota comercial: respuesta, objecion, compromiso, siguiente accion..."
            className="luma-input min-h-24 resize-y text-sm"
          />
        </div>
      )}
    </article>
  );
}

function LeadDetailDrawer({
  lead,
  open,
  saving,
  onClose,
  onCopyMessage,
  onOpenWhatsApp,
  onOpenInstagram,
  onCopyEmail,
  onOpenWeb,
  onOpenDemo,
  onPrepareProposal,
  onSave,
  onUpdateStatus,
  onAssignChannel,
}: {
  lead: Contact | null;
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onCopyMessage: (lead: Contact) => void;
  onOpenWhatsApp: (lead: Contact) => void;
  onOpenInstagram: (lead: Contact) => void;
  onCopyEmail: (lead: Contact) => void;
  onOpenWeb: (lead: Contact) => void;
  onOpenDemo: (lead: Contact) => void;
  onPrepareProposal: (lead: Contact) => void;
  onSave: (lead: Contact) => void;
  onUpdateStatus: (lead: Contact, status: ContactStatus, channel?: RecommendedChannel) => void;
  onAssignChannel: (lead: Contact, channel: RecommendedChannel) => void;
}) {
  if (!open || !lead) return null;

  const channel = (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel;
  const niche = getNicheDefinition(resolveLeadNiche(lead));
  const demo = getLeadDemo(lead);
  const message = getChannelMessage(lead, channel);
  const emailAddress = lead.correo || lead.email || "";
  const webTarget = lead.web || lead.audit_domain || "";
  const reportUrl = getLeadReportUrl(lead);

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto border-l border-white/[0.1] bg-[var(--luma-surface)] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="luma-kicker">Lead detail drawer</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--luma-ivory)]">{getLeadBusinessName(lead)}</h2>
            <p className="mt-1 text-sm text-[var(--luma-muted)]">
              {getLeadPersonName(lead)} - {niche.shortLabel}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar detalles"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <LeadStatusBadge status={lead.status} />
          <LeadChannelBadge channel={channel} />
          <Badge className="border-white/10 bg-white/[0.04] text-white/60">Origen: {getLeadSourceLabel(lead)}</Badge>
          <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">{getLeadTicket(lead)}</Badge>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock title="Nombre negocio" value={getLeadBusinessName(lead)} />
          <InfoBlock title="Persona" value={getLeadPersonName(lead)} />
          <InfoBlock title="Nicho" value={niche.shortLabel} />
          <InfoBlock title="Producto / oferta" value={getLeadOffer(lead)} />
          <InfoBlock title="Ticket" value={getLeadTicket(lead)} />
          <InfoBlock title="WhatsApp" value={visibleValue(getLeadWhatsAppNumber(lead))} />
          <InfoBlock title="Instagram" value={visibleValue(lead.instagram)} />
          <InfoBlock title="Email" value={visibleValue(emailAddress)} />
          <InfoBlock title="Web" value={visibleValue(webTarget)} />
          <InfoBlock title="Estado" value={statusLabel(lead.status)} />
          <InfoBlock title="Canal usado" value={CHANNEL_LABELS[channel] || String(channel)} />
          <InfoBlock title="Proximo paso" value={lead.proximo_paso || lead.nextStep || "Definir siguiente movimiento."} />
          <InfoBlock title="Fecha seguimiento" value={formatDate(lead.followup_due_date || lead.fecha_seguimiento)} />
          <InfoBlock title="Demo asociada" value={`${demo.label}\n${demo.url}`} />
          <InfoBlock title="Reporte Luma" value={getReportDisplay(lead)} />
          <InfoBlock title="Propuesta asociada" value={visibleValue(lead.propuesta_link)} />
          <InfoBlock title="Origen" value={getLeadSourceLabel(lead)} />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <TextPreviewBlock title="Mensaje recomendado" value={message} onCopy={() => onCopyMessage(lead)} actionLabel="Ver mensaje" />
          <TextPreviewBlock title="Notas" value={lead.conversation_summary || lead.notas || lead.notes || "Sin notas registradas."} onCopy={() => navigator.clipboard?.writeText(String(lead.conversation_summary || lead.notas || lead.notes || ""))} />
          <TextPreviewBlock title="Senal comercial" value={getLeadSignal(lead)} onCopy={() => navigator.clipboard?.writeText(getLeadSignal(lead))} />
          <TextPreviewBlock title="Oportunidad visible" value={getLeadOpportunity(lead)} onCopy={() => navigator.clipboard?.writeText(getLeadOpportunity(lead))} />
        </div>

        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/10 p-4">
          <p className="luma-kicker">Acciones manuales</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton icon={Copy} onClick={() => onCopyMessage(lead)}>Copiar mensaje</ActionButton>
            <ActionButton icon={MessageCircle} onClick={() => onOpenWhatsApp(lead)} disabled={!hasValue(getLeadWhatsAppNumber(lead))}>Abrir WhatsApp</ActionButton>
            <ActionButton icon={ExternalLink} onClick={() => onOpenInstagram(lead)} disabled={!hasValue(lead.instagram)}>Abrir Instagram</ActionButton>
            <ActionButton icon={Mail} onClick={() => onCopyEmail(lead)} disabled={!hasValue(emailAddress)}>Copiar email</ActionButton>
            <ActionButton icon={ExternalLink} onClick={() => onOpenWeb(lead)} disabled={!hasValue(webTarget)}>Abrir web</ActionButton>
            <ActionButton icon={ExternalLink} onClick={() => onOpenDemo(lead)}>Abrir demo</ActionButton>
            {hasValue(reportUrl) && (
              <ActionButton icon={ExternalLink} onClick={() => window.open(reportUrl, "_blank", "noopener,noreferrer")}>
                Ver Reporte Luma
              </ActionButton>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
            <p className="luma-kicker">Marcar avance</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton onClick={() => onUpdateStatus(lead, "contacted", channel)}>Marcar contactado</ActionButton>
              <ActionButton onClick={() => onUpdateStatus(lead, "call", "llamada")}>Marcar llamada</ActionButton>
              <ActionButton variant="gold" onClick={() => onUpdateStatus(lead, "proposal_sent", channel)}>Marcar propuesta enviada</ActionButton>
              <ActionButton onClick={() => onUpdateStatus(lead, "follow_up", channel)}>Marcar seguimiento</ActionButton>
              <ActionButton variant="danger" onClick={() => onUpdateStatus(lead, "not_interested", channel)}>Marcar no interesado</ActionButton>
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
            <p className="luma-kicker">Canal usado</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton onClick={() => onAssignChannel(lead, "whatsapp")}>WhatsApp</ActionButton>
              <ActionButton onClick={() => onAssignChannel(lead, "instagram")}>Instagram</ActionButton>
              <ActionButton onClick={() => onAssignChannel(lead, "email")}>Email</ActionButton>
              <ActionButton onClick={() => onAssignChannel(lead, "llamada")}>Llamada</ActionButton>
              <ActionButton onClick={() => onAssignChannel(lead, "manual")}>Manual</ActionButton>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-5 flex flex-wrap gap-2 border-t border-white/[0.08] bg-[var(--luma-surface)] py-4">
          <ActionButton icon={Clipboard} variant="gold" onClick={() => onPrepareProposal(lead)}>Preparar propuesta</ActionButton>
          <ActionButton icon={Save} variant="gold" onClick={() => onSave(lead)} disabled={saving}>Guardar en Sheets</ActionButton>
        </div>
      </aside>
    </div>
  );
}

function PrepareProposalModal({
  lead,
  link,
  note,
  saving,
  onLinkChange,
  onNoteChange,
  onClose,
  onSave,
  onCopyMessage,
  onOpenWhatsApp,
  onOpenInstagram,
  onCopyEmail,
  onOpenDemo,
}: {
  lead: Contact | null;
  link: string;
  note: string;
  saving?: boolean;
  onLinkChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSave: (lead: Contact) => void;
  onCopyMessage: (lead: Contact) => void;
  onOpenWhatsApp: (lead: Contact) => void;
  onOpenInstagram: (lead: Contact) => void;
  onCopyEmail: (lead: Contact) => void;
  onOpenDemo: (lead: Contact) => void;
}) {
  if (!lead) return null;
  const channel = (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel;
  const demo = getLeadDemo(lead);
  const message = getChannelMessage(lead, channel);

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/[0.1] bg-[var(--luma-surface)] p-5 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="luma-kicker">Preparar propuesta</p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--luma-ivory)]">{getLeadBusinessName(lead)}</h3>
            <p className="mt-1 text-sm text-[var(--luma-muted)]">
              No se envia automaticamente. Marcos copia, abre el canal y decide manualmente.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar preparar propuesta"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock title="Lead" value={`${getLeadBusinessName(lead)}\n${getLeadPersonName(lead)}`} />
          <InfoBlock title="Producto Luma recomendado" value={getLeadOffer(lead)} />
          <InfoBlock title="Ticket sugerido" value={getLeadTicket(lead)} />
          <InfoBlock title="Demo asociada" value={`${demo.label}\n${demo.url}`} />
          <InfoBlock title="Canal recomendado" value={CHANNEL_LABELS[channel] || String(channel)} />
          <InfoBlock title="Proximo paso" value={lead.proximo_paso || lead.nextStep || "Definir seguimiento comercial."} />
        </div>

        <div className="mt-5">
          <TextPreviewBlock title="Mensaje de propuesta" value={message} onCopy={() => onCopyMessage(lead)} actionLabel="Ver mensaje" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="luma-kicker">Link propuesta</span>
            <input
              value={link}
              onChange={(event) => onLinkChange(event.target.value)}
              placeholder="Pega aqui el link de propuesta cuando exista"
              className="luma-input mt-2"
            />
          </label>
          <label className="block">
            <span className="luma-kicker">Nota</span>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Nota de contexto, alcance o objecion para seguimiento"
              className="luma-input mt-2 min-h-24 resize-y text-sm"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ActionButton icon={Copy} onClick={() => onCopyMessage(lead)}>Copiar mensaje</ActionButton>
          <ActionButton icon={MessageCircle} onClick={() => onOpenWhatsApp(lead)} disabled={!hasValue(getLeadWhatsAppNumber(lead))}>Abrir WhatsApp</ActionButton>
          <ActionButton icon={ExternalLink} onClick={() => onOpenInstagram(lead)} disabled={!hasValue(lead.instagram)}>Abrir Instagram</ActionButton>
          <ActionButton icon={Mail} onClick={() => onCopyEmail(lead)} disabled={!hasValue(lead.correo || lead.email)}>Copiar email</ActionButton>
          <ActionButton icon={ExternalLink} onClick={() => onOpenDemo(lead)}>Abrir demo</ActionButton>
          <ActionButton icon={Save} variant="gold" onClick={() => onSave(lead)} disabled={saving}>
            Guardar propuesta en Sheets
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export function LumaOutreachConsole({
  workspaceSlug = DEFAULT_WORKSPACE.workspaceSlug,
  initialView = "command",
  initialNiche = "all",
  routeBatchId,
  routeLeadId,
}: LumaOutreachConsoleProps) {
  const workspaceConfig = useMemo(() => getWorkspaceConfig(workspaceSlug), [workspaceSlug]);
  const [state, setState] = useState<AppState>(() => createEmptyState(workspaceConfig));
  const [activeView, setActiveView] = useState<ViewKey>(initialView);
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState<NicheKey | "all">(initialNiche);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState<RecommendedChannel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"priority" | "status" | "date">("priority");
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [todayFilter, setTodayFilter] = useState<"all" | "pending" | "contacted" | "interested">("all");
  const [todaySearch, setTodaySearch] = useState("");
  const [followupSearch, setFollowupSearch] = useState("");
  const [proposalSearch, setProposalSearch] = useState("");
  const [todayCompact, setTodayCompact] = useState(false);
  const [prospectsPage, setProspectsPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Record<string, boolean>>({});
  const [expandedLeadIds, setExpandedLeadIds] = useState<Record<string, boolean>>({});
  const [lastBatchSummary, setLastBatchSummary] = useState<BatchCreationSummary | null>(null);
  const [detailDrawerLeadId, setDetailDrawerLeadId] = useState<string | null>(null);
  const [proposalDraftLeadId, setProposalDraftLeadId] = useState<string | null>(null);
  const [proposalDraftLink, setProposalDraftLink] = useState("");
  const [proposalDraftNote, setProposalDraftNote] = useState("");
  const [sheetsSync, setSheetsSync] = useState<SheetsSyncState>({
    connected: false,
    isSyncing: false,
    isSaving: false,
    mode: "local_fallback",
  });
  const [dirtyLeadPatches, setDirtyLeadPatches] = useState<Record<string, Partial<Contact>>>({});
  const initialSheetsSyncAttempted = useRef(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceStorageKey = useMemo(
    () => `${STORAGE_KEY}_${workspaceConfig.workspaceSlug}`,
    [workspaceConfig.workspaceSlug],
  );

  const syncFromSheets = useCallback(
    async (silent = false) => {
      setSheetsSync((prev) => ({ ...prev, isSyncing: true, error: undefined }));
      try {
        const response = await fetch("/api/sheets/leads?tab=prospectos", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "No pude sincronizar desde Google Sheets.");
        }

        const nextContacts = ((payload.contacts ?? []) as Contact[]).map(normalizeLoadedContact);
        const activeNiches = Array.from(new Set(nextContacts.map((lead) => resolveLeadNiche(lead))));
        const now = new Date().toISOString();
        setState((prev) => ({
          ...prev,
          contacts: nextContacts,
          sourceFileName: `Google Sheets: ${payload.tab || "Prospectos"}`,
          campaignName: "Google Sheets",
          importReport: payload.report,
          workspace: {
            ...(prev.workspace ?? {
              activeLeadCount: nextContacts.length,
              activeNiches,
            }),
            activeLeadCount: nextContacts.length,
            lastImportedFileName: `Google Sheets: ${payload.tab || "Prospectos"}`,
            lastImportDate: now,
            lastImportMode: "replace",
            activeNiches,
            datasetStatus: nextContacts.some(isReviewLead) ? "requiere_revision" : "limpio",
          },
        }));
        setDirtyLeadPatches({});
        setSheetsSync({
          connected: true,
          isSyncing: false,
          isSaving: false,
          lastSyncAt: now,
          mode: "google_sheets",
        });
        if (!silent) setToast({ message: `${nextContacts.length} prospectos sincronizados desde Google Sheets.`, type: "success" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error de sincronizacion con Google Sheets.";
        setSheetsSync((prev) => ({
          ...prev,
          connected: false,
          isSyncing: false,
          error: message,
          mode: "local_fallback",
        }));
        if (!silent) setToast({ message, type: "error" });
      }
    },
    [],
  );

  useEffect(() => {
    const saved =
      localStorage.getItem(workspaceStorageKey) ||
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Partial<AppState>;
      setState((prev) => ({
        ...prev,
        ...parsed,
        contacts: (parsed.contacts ?? []).map(normalizeLoadedContact),
        config: { ...DEFAULT_CONFIG, ...(parsed.config ?? {}) },
        template: parsed.template || DEFAULT_TEMPLATE,
        importHistory: parsed.importHistory ?? [],
        workspace: parsed.workspace || {
          activeLeadCount: parsed.contacts?.length ?? 0,
          lastImportedFileName: parsed.sourceFileName,
          activeNiches: Array.from(new Set((parsed.contacts ?? []).map((lead) => resolveLeadNiche(lead as Contact)))),
          lastImportMode: "replace",
          datasetStatus: "limpio",
        },
        isSending: false,
        isPaused: false,
        sessionSentCount: 0,
      }));
      setToast({ message: "Estado local cargado. La consola sigue en modo manual-safe.", type: "success" });
    } catch {
      setToast({ message: "No pude leer el estado local. Puedes importar el lote otra vez.", type: "error" });
    }
  }, [workspaceStorageKey]);

  useEffect(() => {
    if (initialSheetsSyncAttempted.current) return;
    initialSheetsSyncAttempted.current = true;
    void syncFromSheets(true);
  }, [syncFromSheets]);

  useEffect(() => {
    const toSave: AppState = {
      ...state,
      contacts: state.contacts.map((lead) => ({
        ...lead,
        status: lead.status === "sending" ? "pending" : lead.status,
        estado: lead.status === "sending" ? "pending" : lead.status,
      })),
      isSending: false,
      isPaused: false,
      sessionSentCount: 0,
    };
    localStorage.setItem(workspaceStorageKey, JSON.stringify(toSave));
  }, [state, workspaceStorageKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    setProspectsPage(1);
  }, [channelFilter, dateFilter, nicheFilter, priorityFilter, quickFilter, reviewOnly, search, sortMode, statusFilter]);

  const contacts = state.contacts;
  const routeContextLabel = routeLeadId
    ? `Prospecto ${routeLeadId}`
    : routeBatchId
      ? `Lote ${routeBatchId}`
      : workspaceConfig.workspaceSlug;
  const commercialFrontCount = useMemo(() => Math.max(NICHES.length, PRODUCT_CATALOG.length), []);
  const selectedLeadIdList = useMemo(
    () => Object.entries(selectedLeadIds).filter(([, selected]) => selected).map(([id]) => id),
    [selectedLeadIds],
  );
  const selectedLeads = useMemo(
    () => contacts.filter((lead) => selectedLeadIds[lead.id]),
    [contacts, selectedLeadIds],
  );
  const detailDrawerLead = useMemo(
    () => contacts.find((lead) => lead.id === detailDrawerLeadId) ?? null,
    [contacts, detailDrawerLeadId],
  );
  const proposalDraftLead = useMemo(
    () => contacts.find((lead) => lead.id === proposalDraftLeadId) ?? null,
    [contacts, proposalDraftLeadId],
  );

  const metrics = useMemo(() => {
    const total = contacts.length;
    const ready = contacts.filter(isReadyLead).length;
    const contactedToday = contacts.filter((lead) => isToday(lead.fecha_contacto || lead.lastContactDate)).length;
    const responses = contacts.filter((lead) =>
      ["replied", "respondio", "interested", "follow_up", "call", "appointment", "proposal_sent", "propuesta_enviada", "negotiating", "closed"].includes(
        lead.status,
      ),
    ).length;
    const interested = contacts.filter((lead) =>
      ["interested", "follow_up", "call", "appointment", "proposal_sent", "propuesta_enviada", "negotiating", "closed"].includes(lead.status),
    ).length;
    const calls = contacts.filter((lead) => CALL_STATUSES.has(lead.status)).length;
    const proposals = contacts.filter((lead) => PROPOSAL_STATUSES.has(lead.status)).length;
    const closed = contacts.filter((lead) => lead.status === "closed").length;
    const estimatedRevenue = closed * 25000;
    const goalProgress = Math.min(100, Math.round((estimatedRevenue / workspaceConfig.defaultGoalAmount) * 100));

    const channels = contacts.reduce(
      (acc, lead) => {
        acc[getRecommendedChannel(lead)] += 1;
        return acc;
      },
      createChannelCounts(),
    );

    const review = contacts.filter(isReviewLead).length;

    return {
      total,
      ready,
      contactedToday,
      responses,
      interested,
      calls,
      proposals,
      closed,
      estimatedRevenue,
      goalProgress,
      channels,
      review,
    };
  }, [contacts, workspaceConfig.defaultGoalAmount]);

  const nicheMetrics = useMemo(() => {
    return NICHES.map((niche) => {
      const nicheLeads = contacts.filter((lead) => resolveLeadNiche(lead) === niche.key);
      const contacted = nicheLeads.filter((lead) => Number(lead.cantidad_contactos ?? lead.sentCount ?? 0) > 0 || lead.status === "contacted").length;
      const responded = nicheLeads.filter((lead) =>
        ["replied", "respondio", "interested", "follow_up", "call", "appointment", "proposal_sent", "propuesta_enviada", "negotiating", "closed"].includes(
          lead.status,
        ),
      ).length;

      return {
        ...niche,
        total: nicheLeads.length,
        ready: nicheLeads.filter(isReadyLead).length,
        contacted,
        responded,
        calls: nicheLeads.filter((lead) => CALL_STATUSES.has(lead.status)).length,
        proposals: nicheLeads.filter((lead) => PROPOSAL_STATUSES.has(lead.status)).length,
        closed: nicheLeads.filter((lead) => lead.status === "closed").length,
        brokersWithoutWeb: nicheLeads.filter(isBrokerAgentWithoutWeb).length,
        conversion: contacted > 0 ? Math.round((responded / contacted) * 100) : 0,
      };
    });
  }, [contacts]);

  const todayBatch = useMemo(() => {
    const activeIds = state.workspace?.activeBatchLeadIds ?? [];
    if (activeIds.length > 0) {
      const byId = new Map(contacts.map((lead) => [lead.id, lead]));
      return activeIds.map((id) => byId.get(id)).filter((lead): lead is Contact => Boolean(lead));
    }

    return [...contacts]
      .filter((lead) => lead.sourceFile?.includes("first_50") || isReadyLead(lead) || lead.status === "pending")
      .sort((a, b) => priorityRank(a.prioridad || a.priority) - priorityRank(b.prioridad || b.priority))
      .slice(0, 100);
  }, [contacts, state.workspace?.activeBatchLeadIds]);

  const todayStats = useMemo(() => {
    const contacted = todayBatch.filter((lead) => Number(lead.cantidad_contactos ?? lead.sentCount ?? 0) > 0 || lead.status === "contacted").length;
    const pending = todayBatch.filter((lead) => CONTACTABLE_STATUSES.has(lead.status)).length;
    const responded = todayBatch.filter((lead) => ["replied", "respondio", "interested", "follow_up", "call", "appointment", "proposal_sent", "propuesta_enviada"].includes(lead.status)).length;
    const interested = todayBatch.filter((lead) => ["interested", "follow_up", "call", "appointment", "proposal_sent", "propuesta_enviada", "negotiating", "closed"].includes(lead.status)).length;
    const followups = todayBatch.filter((lead) => FOLLOW_UP_STATUSES.has(lead.status)).length;
    const nextLead = todayBatch.find((lead) => CONTACTABLE_STATUSES.has(lead.status) && getRecommendedChannel(lead) !== "sin_canal");
    return { contacted, pending, responded, interested, followups, nextLead };
  }, [todayBatch]);

  const visibleTodayBatch = useMemo(() => {
    const filteredByStatus =
      todayFilter === "pending"
        ? todayBatch.filter((lead) => CONTACTABLE_STATUSES.has(lead.status))
        : todayFilter === "contacted"
          ? todayBatch.filter((lead) => Number(lead.cantidad_contactos ?? lead.sentCount ?? 0) > 0 || lead.status === "contacted")
          : todayFilter === "interested"
            ? todayBatch.filter((lead) => ["interested", "follow_up", "call", "appointment", "proposal_sent", "propuesta_enviada", "negotiating", "closed"].includes(lead.status))
            : todayBatch;
    return filteredByStatus.filter((lead) => leadMatchesQuery(lead, todaySearch));
  }, [todayBatch, todayFilter, todaySearch]);

  const getLeadImportDate = useCallback(
    (lead: Contact) => lead.imported_at || lead.active_batch_created_at || (lead.imported_file_name === state.workspace?.lastImportedFileName ? state.workspace?.lastImportDate : undefined),
    [state.workspace?.lastImportDate, state.workspace?.lastImportedFileName],
  );

  const filteredLeads = useMemo(() => {
    return [...contacts]
      .filter((lead) => {
        if (!leadMatchesQuery(lead, search)) return false;
        if (nicheFilter !== "all" && resolveLeadNiche(lead) !== nicheFilter) return false;
        if (priorityFilter !== "all" && (lead.prioridad || lead.priority || "sin prioridad") !== priorityFilter) return false;
        if (channelFilter !== "all" && getRecommendedChannel(lead) !== channelFilter) return false;
        if (quickFilter === "whatsapp_ready" && getRecommendedChannel(lead) !== "whatsapp") return false;
        if (quickFilter === "instagram_ready" && getRecommendedChannel(lead) !== "instagram") return false;
        if (quickFilter === "email_ready" && getRecommendedChannel(lead) !== "email") return false;
        if (quickFilter === "instagram_only" && !isInstagramOnlyLead(lead)) return false;
        if (quickFilter === "sin_canal" && getRecommendedChannel(lead) !== "sin_canal") return false;
        if (quickFilter === "sin_web" && hasValue(lead.web || lead.audit_domain)) return false;
        if (quickFilter === "brokers_sin_web" && !isBrokerAgentWithoutWeb(lead)) return false;
        if (statusFilter !== "all" && lead.status !== statusFilter) return false;
        const followupDate = lead.followup_due_date || lead.fecha_seguimiento;
        if (dateFilter === "contactados_hoy" && !isToday(lead.fecha_contacto || lead.lastContactDate)) return false;
        if (dateFilter === "seguimiento_hoy" && !isToday(followupDate)) return false;
        if (dateFilter === "seguimiento_vencido" && !isPastDate(followupDate)) return false;
        if (dateFilter === "seguimiento_semana" && !isThisCalendarWeek(followupDate)) return false;
        if (dateFilter === "importados_recientemente" && !isWithinLastDays(getLeadImportDate(lead), 7)) return false;
        if (dateFilter === "sin_fecha_seguimiento" && hasValue(followupDate)) return false;
        if (reviewOnly && !isReviewLead(lead)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === "priority") return priorityRank(a.prioridad || a.priority) - priorityRank(b.prioridad || b.priority);
        if (sortMode === "status") return statusLabel(a.status).localeCompare(statusLabel(b.status));
        const dateA = new Date(a.fecha_ultima_actualizacion || a.fecha_contacto || a.lastContactDate || 0).getTime();
        const dateB = new Date(b.fecha_ultima_actualizacion || b.fecha_contacto || b.lastContactDate || 0).getTime();
        return dateB - dateA;
      });
  }, [channelFilter, contacts, dateFilter, getLeadImportDate, nicheFilter, priorityFilter, quickFilter, reviewOnly, search, sortMode, statusFilter]);

  const uniquePriorities = useMemo(() => {
    const values = new Set<string>();
    contacts.forEach((lead) => {
      const priority = lead.prioridad || lead.priority;
      if (hasValue(priority)) values.add(String(priority));
    });
    return Array.from(values).sort((a, b) => priorityRank(a) - priorityRank(b));
  }, [contacts]);

  const totalProspectPages = Math.max(1, Math.ceil(filteredLeads.length / PROSPECTS_PAGE_SIZE));
  const visibleProspectRows = filteredLeads.slice((prospectsPage - 1) * PROSPECTS_PAGE_SIZE, prospectsPage * PROSPECTS_PAGE_SIZE);

  const uniqueStatuses = useMemo(() => {
    const values = new Set<ContactStatus>(["sin_accion_por_ahora"]);
    contacts.forEach((lead) => values.add(lead.status));
    return Array.from(values);
  }, [contacts]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (search.trim()) labels.push(`Busqueda: ${search.trim()}`);
    if (nicheFilter !== "all") labels.push(`Nicho: ${getNicheDefinition(nicheFilter).shortLabel}`);
    if (priorityFilter !== "all") labels.push(`Prioridad: ${priorityFilter}`);
    if (channelFilter !== "all") labels.push(`Canal: ${CHANNEL_LABELS[channelFilter]}`);
    if (quickFilter !== "all") labels.push(`Filtro rapido: ${QUICK_FILTER_LABELS[quickFilter]}`);
    if (statusFilter !== "all") labels.push(`Estado: ${statusLabel(statusFilter)}`);
    if (dateFilter !== "all") labels.push(`Fecha: ${DATE_FILTER_LABELS[dateFilter]}`);
    if (reviewOnly) labels.push("Solo revision");
    return labels;
  }, [channelFilter, dateFilter, nicheFilter, priorityFilter, quickFilter, reviewOnly, search, statusFilter]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setNicheFilter("all");
    setPriorityFilter("all");
    setChannelFilter("all");
    setQuickFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
    setReviewOnly(false);
  }, []);

  const handleMobileNavSelect = useCallback((view: ViewKey) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  }, []);

  const toggleLeadSelection = useCallback((leadId: string) => {
    setSelectedLeadIds((prev) => ({
      ...prev,
      [leadId]: !prev[leadId],
    }));
  }, []);

  const selectVisibleLeads = useCallback((leads: Contact[]) => {
    setSelectedLeadIds((prev) => {
      const next = { ...prev };
      leads.forEach((lead) => {
        next[lead.id] = true;
      });
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLeadIds({});
  }, []);

  const toggleLeadExpanded = useCallback((leadId: string) => {
    setExpandedLeadIds((prev) => ({
      ...prev,
      [leadId]: !prev[leadId],
    }));
  }, []);

  const openLeadDetail = useCallback((lead: Contact) => {
    setDetailDrawerLeadId(lead.id);
  }, []);

  const closeLeadDetail = useCallback(() => {
    setDetailDrawerLeadId(null);
  }, []);

  const importPreview = useMemo(() => {
    if (!pendingImport) return null;
    const baseContacts = importMode === "append" ? state.contacts : [];
    const parsed = parseRowsToContacts(pendingImport.rows, baseContacts, pendingImport.fileName, pendingImport.sheetName);
    const importedOnly = parsed.contacts.filter((lead) => lead.imported_file_name === pendingImport.fileName || lead.sourceFile === pendingImport.fileName);
    const report: ImportReport = {
      ...parsed.report,
      imported: importedOnly.length,
      channelCounts: importedOnly.reduce(
        (acc, lead) => {
          acc[getRecommendedChannel(lead)] += 1;
          return acc;
        },
        createChannelCounts(),
      ),
      nichesDetected: Array.from(new Set(importedOnly.map((lead) => resolveLeadNiche(lead)))),
    };
    return { ...parsed, importedOnly, report };
  }, [importMode, pendingImport, state.contacts]);

  const patchLead = useCallback((id: string, patch: Partial<Contact>, options: { markDirty?: boolean } = {}) => {
    const now = new Date().toISOString();
    const nextPatch = {
      ...patch,
      fecha_ultima_actualizacion: now,
    };
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              ...nextPatch,
              estado: (patch.status ?? patch.estado ?? lead.status) as ContactStatus,
            }
          : lead,
      ),
    }));
    if (options.markDirty !== false) {
      setDirtyLeadPatches((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] ?? {}),
          ...nextPatch,
        },
      }));
    }
  }, []);

  const saveLeadPatchToSheets = useCallback(
    async (
      lead: Contact,
      patch: Partial<Contact>,
      options: { incrementContactCount?: boolean; confirmAdvancedState?: boolean } = {},
    ) => {
      if (!lead.row_number && !lead.importedRow) {
        throw new Error("Este prospecto no tiene fila de Google Sheets asociada.");
      }

      setSheetsSync((prev) => ({ ...prev, isSaving: true, error: undefined }));
      const response = await fetch("/api/sheets/update-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          row_number: lead.row_number || lead.importedRow,
          lead_id: lead.id,
          tab: lead.sheet_tab || "Prospectos",
          updates: patch,
          incrementContactCount: Boolean(options.incrementContactCount),
          confirmAdvancedState: Boolean(options.confirmAdvancedState),
        }),
      });
      const payload = await response.json();

      if (response.status === 409 && payload.requiresConfirmation) {
        const confirmed = window.confirm("Este prospecto ya tiene un estado avanzado en Sheets. Confirmas actualizarlo?");
        if (!confirmed) throw new Error("Actualizacion cancelada para proteger el estado avanzado.");
        return saveLeadPatchToSheets(lead, patch, { ...options, confirmAdvancedState: true });
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "No pude guardar en Google Sheets.");
      }

      const now = new Date().toISOString();
      setDirtyLeadPatches((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });
      setSheetsSync((prev) => ({
        ...prev,
        connected: true,
        isSaving: false,
        lastSaveAt: now,
        mode: "google_sheets",
      }));
      return payload;
    },
    [],
  );

  const saveProposalToSheets = useCallback(async (lead: Contact) => {
    const demo = getLeadDemo(lead);
    const response = await fetch("/api/sheets/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: lead.id,
        row_number: lead.row_number || lead.importedRow,
        nombre_negocio: getLeadBusinessName(lead),
        nicho: resolveLeadNiche(lead),
        oferta: getLeadOffer(lead),
        ticket_rd: getLeadTicket(lead),
        demo_url: demo.url,
        canal_envio: getRecommendedChannel(lead),
        estado_propuesta: lead.status === "proposal_sent" || lead.status === "propuesta_enviada" ? "enviada" : lead.status,
        monto_estimado_rd: String(lead.monto_estimado ?? ""),
        link_propuesta: lead.propuesta_link,
        notas_propuesta: lead.conversation_summary || lead.notas || lead.notes,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "No pude guardar la propuesta en Sheets.");
    }
    return payload;
  }, []);

  const saveDirtyChangesToSheets = useCallback(async () => {
    const entries = Object.entries(dirtyLeadPatches);
    if (entries.length === 0) {
      setToast({ message: "No hay cambios locales pendientes para guardar.", type: "info" });
      return;
    }

    setSheetsSync((prev) => ({ ...prev, isSaving: true, error: undefined }));
    try {
      for (const [leadId, patch] of entries) {
        const lead = contacts.find((item) => item.id === leadId);
        if (!lead) continue;
        await saveLeadPatchToSheets(lead, patch);
      }
      setToast({ message: `${entries.length} cambio(s) guardado(s) en Google Sheets.`, type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error guardando cambios en Sheets.";
      setSheetsSync((prev) => ({ ...prev, isSaving: false, error: message, mode: "local_fallback" }));
      setToast({ message, type: "error" });
    }
  }, [contacts, dirtyLeadPatches, saveLeadPatchToSheets]);

  const saveLeadToSheets = useCallback(
    async (lead: Contact, explicitPatch?: Partial<Contact>) => {
      const channel = (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel;
      const patch: Partial<Contact> = explicitPatch ?? dirtyLeadPatches[lead.id] ?? {
        status: lead.status,
        estado: lead.status,
        proximo_paso: lead.proximo_paso || lead.nextStep || "",
        nextStep: lead.nextStep || lead.proximo_paso || "",
        ultimo_canal_usado: channel,
        last_channel: channel,
        propuesta_link: lead.propuesta_link || "",
        material_link: lead.material_link || "",
        monto_estimado: lead.monto_estimado || "",
        fecha_propuesta: lead.fecha_propuesta || "",
        decision_status: lead.decision_status || "",
      };

      try {
        await saveLeadPatchToSheets(lead, patch);
        setToast({ message: `${getLeadBusinessName(lead)}: Guardado en Sheets.`, type: "success" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "No pude guardar en Sheets.";
        setSheetsSync((prev) => ({ ...prev, isSaving: false, error: message, mode: "local_fallback" }));
        setToast({ message: `${getLeadBusinessName(lead)}: Pendiente de guardar en Sheets. ${message}`, type: "error" });
      }
    },
    [dirtyLeadPatches, saveLeadPatchToSheets],
  );

  const updateLeadStatus = useCallback(
    async (lead: Contact, status: ContactStatus, channel?: RecommendedChannel) => {
      const now = new Date().toISOString();
      const currentCount = Number(lead.cantidad_contactos ?? lead.sentCount ?? 0);
      const currentAttempts = Number(lead.attempt_count ?? lead.cantidad_contactos ?? lead.sentCount ?? 0) || 0;
      const isContact = status === "contacted";
      const countsAsAttempt = OUTBOUND_ATTEMPT_STATUSES.has(status) && lead.status !== status;
      const countsAsContactCount = countsAsAttempt || isContact;
      const isProposalStatus = PROPOSAL_STATUSES.has(status);
      const defaultFollowupDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10);
      const nextStep =
        status === "replied" || status === "respondio"
          ? "Calificar interes y proponer llamada corta"
          : status === "interested"
            ? "Agendar llamada de diagnostico"
            : status === "follow_up"
              ? "Dar seguimiento con observacion concreta"
              : status === "sin_accion_por_ahora"
                ? "Sin accion por ahora; conservar sin contactar."
              : status === "call" || status === "appointment"
                ? "Preparar guion breve y oferta recomendada"
                : status === "proposal_sent" || status === "propuesta_enviada"
                  ? "Seguimiento de propuesta"
                  : lead.proximo_paso || lead.nextStep;

      const patch: Partial<Contact> = {
        status,
        estado: status,
        proximo_paso: nextStep,
        nextStep,
        ultimo_canal_usado: channel ?? lead.ultimo_canal_usado ?? getRecommendedChannel(lead),
        last_channel: channel ?? lead.last_channel ?? lead.ultimo_canal_usado ?? getRecommendedChannel(lead),
        cantidad_contactos: countsAsContactCount ? currentCount + 1 : currentCount,
        sentCount: countsAsContactCount ? currentCount + 1 : currentCount,
        attempt_count: countsAsAttempt ? currentAttempts + 1 : currentAttempts,
        fecha_contacto: isContact ? now.slice(0, 10) : lead.fecha_contacto,
        lastContactDate: isContact ? now.slice(0, 10) : lead.lastContactDate,
        last_interaction_date: status === "sin_accion_por_ahora" ? lead.last_interaction_date : now,
        fecha_propuesta:
          status === "proposal_sent" || status === "propuesta_enviada"
            ? lead.fecha_propuesta || now.slice(0, 10)
            : lead.fecha_propuesta,
        decision_status: isProposalStatus ? status : lead.decision_status,
        followup_due_date:
          status === "follow_up" || status === "proposal_sent" || status === "propuesta_enviada"
            ? lead.followup_due_date || lead.fecha_seguimiento || defaultFollowupDate
            : lead.followup_due_date,
        fecha_seguimiento:
          status === "follow_up" || status === "proposal_sent" || status === "propuesta_enviada"
            ? lead.fecha_seguimiento || lead.followup_due_date || defaultFollowupDate
            : lead.fecha_seguimiento,
        conversation_summary: lead.conversation_summary || lead.notas || lead.notes,
      };

      patchLead(lead.id, patch);
      setToast({ message: `${getLeadBusinessName(lead)}: ${statusLabel(status)}. Guardando en Sheets...`, type: "info" });

      try {
        await saveLeadPatchToSheets(lead, patch, { incrementContactCount: countsAsContactCount });
        if (isProposalStatus) await saveProposalToSheets({ ...lead, ...patch } as Contact);
        setToast({ message: `${getLeadBusinessName(lead)}: ${statusLabel(status)}. Guardado en Sheets.`, type: "success" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Cambio local guardado; fallo Google Sheets.";
        setSheetsSync((prev) => ({ ...prev, isSaving: false, error: message, mode: "local_fallback" }));
        setToast({ message: `${getLeadBusinessName(lead)}: ${statusLabel(status)}. Pendiente de guardar en Sheets. ${message}`, type: "error" });
      }
    },
    [patchLead, saveLeadPatchToSheets, saveProposalToSheets],
  );

  const assignLeadChannel = useCallback(
    (lead: Contact, channel: RecommendedChannel) => {
      patchLead(lead.id, { ultimo_canal_usado: channel, last_channel: channel });
      setToast({ message: `${getLeadBusinessName(lead)}: canal ${CHANNEL_LABELS[channel]} asignado. Pendiente de guardar en Sheets.`, type: "info" });
    },
    [patchLead],
  );

  const createBatchFromSelection = useCallback(() => {
    if (selectedLeads.length === 0) {
      setToast({ message: "Selecciona al menos un prospecto para crear lote.", type: "error" });
      return;
    }
    const now = new Date().toISOString();
    const dateLabel = new Date().toLocaleDateString();
    const mainNiche = resolveLeadNiche(selectedLeads[0]);
    const batchName = `Lote seleccionado - ${getNicheDefinition(mainNiche).shortLabel} - ${dateLabel}`;
    const selectedIds = new Set(selectedLeads.map((lead) => lead.id));
    const activeBatchLeadIds = selectedLeads.map((lead) => lead.id);

    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((lead) =>
        selectedIds.has(lead.id)
          ? {
              ...lead,
              active_batch_name: batchName,
              active_batch_created_at: now,
              active_batch_order: activeBatchLeadIds.indexOf(lead.id) + 1,
            }
          : lead,
      ),
      workspace: {
        ...(prev.workspace ?? {
          activeLeadCount: prev.contacts.length,
          activeNiches: Array.from(new Set(prev.contacts.map((item) => resolveLeadNiche(item)))),
        }),
        activeBatchName: batchName,
        activeBatchCreatedAt: now,
        activeBatchSourceFile: "Seleccion manual",
        activeBatchMainNiche: mainNiche,
        activeBatchLeadIds,
      },
    }));
    setToast({ message: `${selectedLeads.length} prospectos seleccionados quedaron en Lote de Hoy.`, type: "success" });
    setActiveView("today");
  }, [selectedLeads]);

  const updateSelectedStatus = useCallback(
    async (status: ContactStatus) => {
      if (selectedLeads.length === 0) {
        setToast({ message: "Selecciona prospectos antes de cambiar estado.", type: "error" });
        return;
      }
      for (const lead of selectedLeads) {
        await updateLeadStatus(lead, status, (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel);
      }
    },
    [selectedLeads, updateLeadStatus],
  );

  const assignSelectedChannel = useCallback(
    (channel: RecommendedChannel) => {
      if (selectedLeads.length === 0) {
        setToast({ message: "Selecciona prospectos antes de asignar canal.", type: "error" });
        return;
      }
      selectedLeads.forEach((lead) => {
        patchLead(lead.id, { ultimo_canal_usado: channel, last_channel: channel });
      });
      setToast({ message: `${selectedLeads.length} prospectos asignados a ${CHANNEL_LABELS[channel]}. Pendiente de guardar en Sheets.`, type: "info" });
    },
    [patchLead, selectedLeads],
  );

  const saveSelectedLeadsToSheets = useCallback(async () => {
    if (selectedLeads.length === 0) {
      setToast({ message: "Selecciona prospectos antes de guardar.", type: "error" });
      return;
    }
    for (const lead of selectedLeads) {
      await saveLeadToSheets(lead);
    }
  }, [saveLeadToSheets, selectedLeads]);

  const saveLeadNotes = useCallback(
    async (lead: Contact, notes: string) => {
      const patch = { notes, notas: notes };
      patchLead(lead.id, patch);
      try {
        await saveLeadPatchToSheets(lead, patch);
        setToast({ message: "Nota agregada en Google Sheets.", type: "success" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nota local guardada; fallo Google Sheets.";
        setSheetsSync((prev) => ({ ...prev, isSaving: false, error: message, mode: "local_fallback" }));
        setToast({ message, type: "error" });
      }
    },
    [patchLead, saveLeadPatchToSheets],
  );

  const copyText = useCallback((text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setToast({ message: `${label} copiado.`, type: "success" }))
      .catch(() => setToast({ message: "No pude copiar al portapapeles.", type: "error" }));
  }, []);

  const openWhatsAppManual = useCallback(
    (lead: Contact) => {
      const message = getChannelMessage(lead, "whatsapp");
      const isMobileTarget =
        typeof navigator !== "undefined" &&
        (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768);
      const link = generateWhatsAppLink(getLeadWhatsAppNumber(lead), message, !isMobileTarget);
      if (!link) {
        setToast({ message: "Este prospecto no tiene WhatsApp valido.", type: "error" });
        return;
      }

      window.open(link, "_blank", "noopener,noreferrer");
      patchLead(lead.id, { ultimo_canal_usado: "whatsapp", last_channel: "whatsapp" }, { markDirty: false });
      setToast({ message: `${isMobileTarget ? "WhatsApp mobile" : "WhatsApp Web"} abierto. Envio manual solamente.`, type: "info" });
    },
    [patchLead],
  );

  const openInstagramManual = useCallback(
    (lead: Contact) => {
      const link = generateInstagramLink(lead.instagram);
      if (!link) {
        setToast({ message: "Este prospecto no tiene Instagram visible.", type: "error" });
        return;
      }

      window.open(link, "_blank", "noopener,noreferrer");
      patchLead(lead.id, { ultimo_canal_usado: "instagram", last_channel: "instagram" }, { markDirty: false });
      setToast({ message: "Instagram abierto. Copia el mensaje y contacta manualmente.", type: "info" });
    },
    [patchLead],
  );

  const openEmailManual = useCallback(
    (lead: Contact) => {
      const emailAddress = lead.correo || lead.email || "";
      if (!hasValue(emailAddress)) {
        setToast({ message: "Este prospecto no tiene email visible.", type: "error" });
        return;
      }
      const subject = encodeURIComponent(getEmailSubject(lead));
      const body = encodeURIComponent(getChannelMessage(lead, "email"));
      window.open(`mailto:${emailAddress}?subject=${subject}&body=${body}`, "_self");
      patchLead(lead.id, { ultimo_canal_usado: "email", last_channel: "email" }, { markDirty: false });
      setToast({ message: "Email manual abierto. Revisa y envia desde tu cliente de correo.", type: "info" });
    },
    [patchLead],
  );

  const openPhoneManual = useCallback(
    (lead: Contact) => {
      const phone = getLeadPhoneNumber(lead);
      if (!phone) {
        setToast({ message: "Este prospecto no tiene telefono visible.", type: "error" });
        return;
      }

      window.open(`tel:${phone}`, "_self");
      patchLead(lead.id, { ultimo_canal_usado: "llamada", last_channel: "llamada" }, { markDirty: false });
      setToast({ message: "Telefono abierto para llamada manual.", type: "info" });
    },
    [patchLead],
  );

  const openWebManual = useCallback(
    (lead: Contact) => {
      const link = normalizeExternalUrl(lead.web || lead.audit_domain);
      if (!link) {
        setToast({ message: "Este prospecto no tiene web visible.", type: "error" });
        return;
      }

      window.open(link, "_blank", "noopener,noreferrer");
      patchLead(lead.id, { ultimo_canal_usado: "web", last_channel: "web" }, { markDirty: false });
      setToast({ message: "Web abierta para revision manual.", type: "info" });
    },
    [patchLead],
  );

  const copyContactData = useCallback(
    (lead: Contact) => {
      const lines = [
        `Negocio: ${getLeadBusinessName(lead)}`,
        `Persona: ${getLeadPersonName(lead)}`,
        `Nicho: ${getNicheDefinition(resolveLeadNiche(lead)).shortLabel}`,
        `WhatsApp: ${visibleValue(getLeadWhatsAppNumber(lead))}`,
        `Telefono: ${visibleValue(getLeadPhoneNumber(lead))}`,
        `Instagram: ${visibleValue(lead.instagram)}`,
        `Email: ${visibleValue(lead.correo || lead.email)}`,
        `LinkedIn: ${visibleValue(lead.linkedin)}`,
        `Facebook: ${visibleValue(lead.facebook)}`,
        `Web: ${visibleValue(lead.web)}`,
        `reporte_luma: ${visibleValue(lead.reporte_luma)}`,
        `audit_domain: ${visibleValue(lead.audit_domain)}`,
        `ciudad_zona: ${visibleValue(lead.ciudad_zona || lead.city)}`,
        `fuente_dato: ${visibleValue(lead.fuente_dato)}`,
        `fuente_auditoria: ${visibleValue(lead.fuente_auditoria)}`,
      ];
      copyText(lines.join("\n"), "Datos del contacto");
    },
    [copyText],
  );

  const saveProposalLink = useCallback(
    (lead: Contact, field: "propuesta_link" | "material_link", label: string) => {
      const currentValue = String(lead[field] ?? "");
      const value = window.prompt(`Guardar ${label}`, currentValue);
      if (value === null) return;
      patchLead(lead.id, { [field]: value.trim() } as Partial<Contact>);
      setToast({ message: `${label} guardado. Pendiente de guardar en Sheets.`, type: "info" });
    },
    [patchLead],
  );

  const openProposalPreparation = useCallback((lead: Contact) => {
    setProposalDraftLeadId(lead.id);
    setProposalDraftLink(String(lead.propuesta_link ?? ""));
    setProposalDraftNote(String(lead.conversation_summary || lead.notas || lead.notes || ""));
  }, []);

  const closeProposalPreparation = useCallback(() => {
    setProposalDraftLeadId(null);
    setProposalDraftLink("");
    setProposalDraftNote("");
  }, []);

  const saveProposalPreparation = useCallback(
    async (lead: Contact) => {
      const demo = getLeadDemo(lead);
      const today = new Date().toISOString().slice(0, 10);
      const patch: Partial<Contact> = {
        propuesta_link: proposalDraftLink.trim(),
        material_link: lead.material_link || demo.url,
        monto_estimado: lead.monto_estimado || getLeadTicket(lead),
        fecha_propuesta: lead.fecha_propuesta || today,
        decision_status: lead.decision_status || (PROPOSAL_STATUSES.has(lead.status) ? lead.status : "preparada"),
        conversation_summary: proposalDraftNote.trim(),
        notas: proposalDraftNote.trim(),
        notes: proposalDraftNote.trim(),
      };

      patchLead(lead.id, patch);
      try {
        await saveLeadPatchToSheets(lead, patch);
        if (PROPOSAL_STATUSES.has(lead.status)) {
          await saveProposalToSheets({ ...lead, ...patch } as Contact);
        }
        setToast({ message: `${getLeadBusinessName(lead)}: propuesta preparada y guardada en Sheets.`, type: "success" });
        closeProposalPreparation();
      } catch (error) {
        const message = error instanceof Error ? error.message : "No pude guardar la propuesta en Sheets.";
        setSheetsSync((prev) => ({ ...prev, isSaving: false, error: message, mode: "local_fallback" }));
        setToast({ message: `${getLeadBusinessName(lead)}: propuesta pendiente de guardar en Sheets. ${message}`, type: "error" });
      }
    },
    [closeProposalPreparation, patchLead, proposalDraftLink, proposalDraftNote, saveLeadPatchToSheets, saveProposalToSheets],
  );

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setToast({ message: `Preparando preview de ${file.name}...`, type: "info" });

    try {
      const upload = await readUpload(file);
      setPendingImport({ ...upload, fileName: file.name });
      setToast({ message: "Preview listo. Confirma antes de guardar en la consola local.", type: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No pude leer ese archivo.", type: "error" });
    }
  }, []);

  const confirmImport = useCallback(() => {
    if (!pendingImport || !importPreview) return;

    const now = new Date().toISOString();
    const nextContacts = importPreview.contacts.map((lead) => {
      const normalized = normalizeLoadedContact(lead);
      const belongsToCurrentFile =
        importMode === "replace" ||
        normalized.imported_file_name === pendingImport.fileName ||
        normalized.sourceFile === pendingImport.fileName;
      return belongsToCurrentFile ? { ...normalized, imported_at: normalized.imported_at || now, source_origin: "csv" as const } : normalized;
    });
    const activeNiches = Array.from(new Set(nextContacts.map((lead) => resolveLeadNiche(lead))));
    const detectedNiches = importPreview.report.nichesDetected.length ? importPreview.report.nichesDetected : activeNiches;
    const batchName = inferCampaignName(pendingImport.fileName, pendingImport.rows);
    const datasetStatus = nextContacts.some((lead) => lead.status === "conflicto_contacto")
      ? "con_conflictos"
      : nextContacts.some(isReviewLead)
        ? "requiere_revision"
        : "limpio";
    const historyItem: ImportHistoryItem = {
      file_name: pendingImport.fileName,
      imported_at: now,
      mode: importMode,
      rows_read: importPreview.report.rowsRead,
      valid_rows: importPreview.report.imported,
      ignored_rows: importPreview.report.ignoredRows,
      resulting_total: nextContacts.length,
      detected_niches: detectedNiches,
      batch_name: batchName,
    };

    setState((prev) => ({
      ...prev,
      contacts: nextContacts,
      sourceFileName: pendingImport.fileName,
      campaignName: batchName,
      importReport: importPreview.report,
      importHistory: [historyItem, ...(prev.importHistory ?? [])].slice(0, 20),
      workspace: {
        activeLeadCount: nextContacts.length,
        lastImportedFileName: pendingImport.fileName,
        lastImportDate: now,
        lastImportMode: importMode,
        activeNiches,
        batchName,
        lastRowsRead: importPreview.report.rowsRead,
        lastValidRows: importPreview.report.imported,
        lastIgnoredRows: importPreview.report.ignoredRows,
        lastDetectedNiches: detectedNiches,
        datasetStatus,
      },
      isSending: false,
      isPaused: false,
      currentIndex: 0,
      sessionSentCount: 0,
    }));
    setPendingImport(null);
    setToast({
      message:
        importMode === "replace"
          ? `${importPreview.report.imported} leads importados en workspace limpio.`
          : `${importPreview.report.imported} leads agregados/actualizados en el workspace.`,
      type: "success",
    });
    setActiveView("command");
  }, [importMode, importPreview, pendingImport]);

  const cancelImport = useCallback(() => {
    setPendingImport(null);
    setToast({ message: "Importacion cancelada. No se guardo nada.", type: "info" });
  }, []);

  const exportUpdatedState = useCallback(() => {
    const rows = contacts.map((lead) => {
      const row: Record<string, unknown> = {};
      UNIFIED_LEAD_FIELDS.forEach((field) => {
        const value = lead[field as keyof Contact];
        if (field === "nombre_negocio") row[field] = lead.nombre_negocio || lead.businessName || getLeadBusinessName(lead);
        else if (field === "nombre_persona") row[field] = lead.nombre_persona || lead.name || getLeadPersonName(lead);
        else if (field === "whatsapp") row[field] = getLeadWhatsAppNumber(lead);
        else if (field === "telefono") row[field] = getLeadPhoneNumber(lead);
        else if (field === "correo") row[field] = lead.correo || lead.email;
        else if (field === "ciudad_zona") row[field] = lead.ciudad_zona || lead.city;
        else if (field === "estado") row[field] = lead.status;
        else if (field === "notas") row[field] = lead.notas || lead.notes;
        else if (field === "proximo_paso") row[field] = lead.proximo_paso || lead.nextStep;
        else if (field === "cantidad_contactos") row[field] = lead.cantidad_contactos ?? lead.sentCount ?? 0;
        else row[field] = value ?? "";
      });
      return row;
    });

    const exportColumns = [
      ...UNIFIED_LEAD_FIELDS,
      "estado_visual",
      "batch_name",
      "imported_file_name",
    ];
    const enrichedRows = rows.map((row, index) => ({
      ...row,
      estado_visual: statusLabel(contacts[index].status),
      batch_name: contacts[index].batch_name || state.workspace?.batchName || state.campaignName || "",
      imported_file_name: contacts[index].imported_file_name || contacts[index].sourceFile || state.workspace?.lastImportedFileName || "",
    }));
    const csv = Papa.unparse(enrichedRows, { columns: exportColumns });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `luma_outreach_estado_actualizado_${date}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast({ message: "CSV de seguimiento exportado.", type: "success" });
  }, [contacts, state.campaignName, state.workspace]);

  const resetLocalState = useCallback(() => {
    if (!window.confirm("Esto no borra tus archivos originales. Solo limpia la consola local.")) return;
    localStorage.removeItem(workspaceStorageKey);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setState(createEmptyState(workspaceConfig));
    setPendingImport(null);
    setToast({ message: "Estado local reiniciado.", type: "info" });
  }, [workspaceConfig, workspaceStorageKey]);

  const createTodayBatchFromFilters = useCallback(() => {
    const candidates = (filteredLeads.length ? filteredLeads : contacts)
      .filter(isReadyLead)
      .sort((a, b) => priorityRank(a.prioridad || a.priority) - priorityRank(b.prioridad || b.priority))
      .slice(0, 100);

    if (candidates.length === 0) {
      setToast({ message: "No hay prospectos contactables en los filtros actuales.", type: "error" });
      return;
    }

    const now = new Date().toISOString();
    const dateLabel = new Date().toLocaleDateString();
    const mainNiche = resolveLeadNiche(candidates[0]);
    const batchName = `Lote de hoy - ${getNicheDefinition(mainNiche).shortLabel} - ${dateLabel}`;
    const candidateIds = new Set(candidates.map((lead) => lead.id));
    const activeBatchLeadIds = candidates.map((lead) => lead.id);
    const sourceFile = candidates[0].imported_file_name || candidates[0].sourceFile || state.workspace?.lastImportedFileName;

    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((lead) =>
        candidateIds.has(lead.id)
          ? {
              ...lead,
              active_batch_name: batchName,
              active_batch_created_at: now,
              active_batch_order: activeBatchLeadIds.indexOf(lead.id) + 1,
            }
          : lead,
      ),
      workspace: {
        ...(prev.workspace ?? {
          activeLeadCount: prev.contacts.length,
          activeNiches: Array.from(new Set(prev.contacts.map((item) => resolveLeadNiche(item)))),
        }),
        activeBatchName: batchName,
        activeBatchCreatedAt: now,
        activeBatchSourceFile: sourceFile,
        activeBatchMainNiche: mainNiche,
        activeBatchLeadIds,
      },
    }));
    setToast({ message: `${candidates.length} prospectos quedaron como lote activo de hoy.`, type: "success" });
    setActiveView("today");
  }, [contacts, filteredLeads, state.workspace?.lastImportedFileName]);

  const createInstagramDmBatch = useCallback(() => {
    const excludedStatuses = new Set<ContactStatus>(["not_interested", "discarded", "closed"]);
    const candidates = (filteredLeads.length ? filteredLeads : contacts)
      .filter((lead) => hasValue(lead.instagram) && !excludedStatuses.has(lead.status))
      .sort((a, b) => priorityRank(a.prioridad || a.priority) - priorityRank(b.prioridad || b.priority))
      .slice(0, 50);

    if (candidates.length === 0) {
      setToast({ message: "No hay prospectos con Instagram visible para armar lote DM.", type: "error" });
      return;
    }

    const now = new Date().toISOString();
    const dateLabel = new Date().toLocaleDateString();
    const mainNiche = resolveLeadNiche(candidates[0]);
    const batchName = `Lote Instagram DM - ${getNicheDefinition(mainNiche).shortLabel} - ${dateLabel}`;
    const candidateIds = new Set(candidates.map((lead) => lead.id));
    const activeBatchLeadIds = candidates.map((lead) => lead.id);
    const sourceFile = candidates[0].imported_file_name || candidates[0].sourceFile || state.workspace?.lastImportedFileName;

    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((lead) =>
        candidateIds.has(lead.id)
          ? {
              ...lead,
              active_batch_name: batchName,
              active_batch_created_at: now,
              active_batch_order: activeBatchLeadIds.indexOf(lead.id) + 1,
            }
          : lead,
      ),
      workspace: {
        ...(prev.workspace ?? {
          activeLeadCount: prev.contacts.length,
          activeNiches: Array.from(new Set(prev.contacts.map((item) => resolveLeadNiche(item)))),
        }),
        activeBatchName: batchName,
        activeBatchCreatedAt: now,
        activeBatchSourceFile: sourceFile,
        activeBatchMainNiche: mainNiche,
        activeBatchLeadIds,
      },
    }));
    setToast({ message: `${candidates.length} prospectos quedaron en lote Instagram DM. No se envio nada automaticamente.`, type: "success" });
    setActiveView("today");
  }, [contacts, filteredLeads, state.workspace?.lastImportedFileName]);

  const createSheetBatch = useCallback(
    async (
      type: "today" | "whatsapp" | "instagram" | "email" | "niche" | "followup_overdue",
      options: { channel?: RecommendedChannel; niche?: NicheKey | "all" } = {},
    ) => {
      if (type === "niche" && (!options.niche || options.niche === "all")) {
        setToast({ message: "Elige un nicho antes de crear un lote por nicho.", type: "error" });
        return;
      }

      setSheetsSync((prev) => ({ ...prev, isSaving: true, error: undefined }));
      try {
        const response = await fetch("/api/sheets/create-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            channel: options.channel,
            niche: options.niche,
            limit: 50,
            operador: workspaceConfig.operatorName,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "No pude crear el lote desde Sheets.");
        }

        const summary = payload.summary as BatchCreationSummary | undefined;
        const now = new Date().toISOString();
        const batchLeads = ((payload.leads ?? []) as Contact[]).map((lead, index) =>
          normalizeLoadedContact({
            ...lead,
            active_batch_name: payload.batch_id,
            active_batch_created_at: now,
            active_batch_order: index + 1,
          } as Contact),
        );
        const activeBatchLeadIds = batchLeads.map((lead) => lead.id);
        const batchLeadById = new Map(batchLeads.map((lead) => [lead.id, lead]));

        setState((prev) => {
          const existingIds = new Set(prev.contacts.map((lead) => lead.id));
          const updatedExisting = prev.contacts.map((lead) =>
            batchLeadById.has(lead.id)
              ? {
                  ...lead,
                  active_batch_name: payload.batch_id,
                  active_batch_created_at: now,
                  active_batch_order: activeBatchLeadIds.indexOf(lead.id) + 1,
                }
              : lead,
          );
          const appended = batchLeads.filter((lead) => !existingIds.has(lead.id));
          const nextContacts = updatedExisting.length ? [...updatedExisting, ...appended] : batchLeads;
          return {
            ...prev,
            contacts: nextContacts,
            sourceFileName: "Google Sheets",
            workspace: {
              ...(prev.workspace ?? {
                activeLeadCount: nextContacts.length,
                activeNiches: Array.from(new Set(nextContacts.map((item) => resolveLeadNiche(item)))),
              }),
              activeLeadCount: nextContacts.length,
              activeBatchName: payload.batch_id,
              activeBatchCreatedAt: now,
              activeBatchSourceFile: "Google Sheets",
              activeBatchMainNiche: batchLeads[0] ? resolveLeadNiche(batchLeads[0]) : options.niche || "unknown",
              activeBatchLeadIds,
              lastImportedFileName: "Google Sheets",
              lastImportDate: now,
            },
          };
        });
        setLastBatchSummary(summary ?? null);
        setSheetsSync((prev) => ({
          ...prev,
          connected: true,
          isSaving: false,
          lastSaveAt: now,
          mode: "google_sheets",
        }));
        setToast({
          message: summary
            ? `Se crearon ${summary.incluidos_lote} leads porque cumplen canal visible, estado elegible y no contacto reciente. Guardado en Sheets.`
            : `${payload.total ?? batchLeads.length} prospectos agregados al lote ${payload.batch_id}. Guardado en Sheets.`,
          type: "success",
        });
        setActiveView("today");
      } catch (error) {
        const message = error instanceof Error ? error.message : "No pude crear el lote desde Sheets.";
        setSheetsSync((prev) => ({ ...prev, isSaving: false, error: message, mode: "local_fallback" }));
        setToast({ message, type: "error" });
      }
    },
    [workspaceConfig.operatorName],
  );

  const renderLeadSelectionControl = (lead: Contact) => (
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/65 transition hover:bg-white/[0.06]">
      <input
        type="checkbox"
        checked={Boolean(selectedLeadIds[lead.id])}
        onChange={() => toggleLeadSelection(lead.id)}
        className="h-4 w-4 accent-[#C7A45A]"
      />
      Seleccionar
    </label>
  );

  const renderContactStrip = (lead: Contact) => {
    const whatsappNumber = getLeadWhatsAppNumber(lead);
    const emailAddress = lead.correo || lead.email || "";
    return (
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <InfoBlock title="WhatsApp" value={visibleValue(whatsappNumber)} />
        <InfoBlock title="Instagram" value={visibleValue(lead.instagram)} />
        <InfoBlock title="Email" value={visibleValue(emailAddress)} />
        <InfoBlock title="Web" value={visibleValue(lead.web || lead.audit_domain)} />
      </div>
    );
  };

  const renderChannelControls = (lead: Contact) => {
    const activeChannel = (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel;
    const channels: RecommendedChannel[] = ["whatsapp", "instagram", "email", "llamada", "web", "manual"];
    return (
      <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/10 p-3">
        <p className="luma-kicker">Cambiar canal usado</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {channels.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => assignLeadChannel(lead, channel)}
              className={cn(
                "min-h-9 rounded-lg border px-3 text-xs font-semibold transition",
                activeChannel === channel
                  ? "border-[#C7A45A]/40 bg-[#C7A45A]/[0.14] text-[#F5D78C]"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.07]",
              )}
            >
              {CHANNEL_LABELS[channel]}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLeadOperationalActions = (lead: Contact, channel = getRecommendedChannel(lead)) => {
    const message = getChannelMessage(lead, channel);
    const whatsappNumber = getLeadWhatsAppNumber(lead);
    const emailAddress = lead.correo || lead.email || "";
    const webTarget = lead.web || lead.audit_domain || "";
    const reportUrl = getLeadReportUrl(lead);

    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={Copy} onClick={() => copyText(message, "Mensaje recomendado")}>
          Copiar mensaje
        </ActionButton>
        <ActionButton icon={MessageCircle} onClick={() => openWhatsAppManual(lead)} disabled={!hasValue(whatsappNumber)}>
          Abrir WhatsApp
        </ActionButton>
        <ActionButton icon={ExternalLink} onClick={() => openInstagramManual(lead)} disabled={!hasValue(lead.instagram)}>
          Abrir Instagram
        </ActionButton>
        <ActionButton icon={Mail} onClick={() => copyText(String(emailAddress), "Email")} disabled={!hasValue(emailAddress)}>
          Copiar email
        </ActionButton>
        <ActionButton icon={ExternalLink} onClick={() => openWebManual(lead)} disabled={!hasValue(webTarget)}>
          Abrir web
        </ActionButton>
        <ActionButton icon={Phone} onClick={() => updateLeadStatus(lead, "call", "llamada")}>
          Marcar llamada
        </ActionButton>
        <ActionButton icon={FileSpreadsheet} variant="gold" onClick={() => updateLeadStatus(lead, "proposal_sent", channel)}>
          Marcar propuesta enviada
        </ActionButton>
        <ActionButton icon={Clipboard} onClick={() => openProposalPreparation(lead)}>
          Preparar propuesta
        </ActionButton>
        <ActionButton icon={Save} variant="gold" onClick={() => saveLeadToSheets(lead)} disabled={sheetsSync.isSaving}>
          Guardar en Sheets
        </ActionButton>
        {hasValue(reportUrl) && (
          <ActionButton icon={ExternalLink} onClick={() => window.open(reportUrl, "_blank", "noopener,noreferrer")}>
            Ver Reporte Luma
          </ActionButton>
        )}
      </div>
    );
  };

  const renderStatusActions = (lead: Contact, channel = getRecommendedChannel(lead)) => (
    <div className="flex flex-wrap gap-2">
      {STATUS_ACTIONS.map((action) => (
        <ActionButton
          key={action.status}
          onClick={() => updateLeadStatus(lead, action.status, channel)}
          variant={action.status === "proposal_sent" ? "gold" : action.status === "not_interested" ? "danger" : "default"}
        >
          {action.label}
        </ActionButton>
      ))}
    </div>
  );

  const renderSelectionToolbar = (leads: Contact[], label: string) => (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="luma-kicker">Seleccion rapida</p>
          <p className="mt-2 text-sm text-[var(--luma-muted)]">
            {selectedLeadIdList.length} seleccionados. Vista actual: {label} ({leads.length} visibles).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={CheckCircle2} onClick={() => selectVisibleLeads(leads)} disabled={leads.length === 0}>
            Seleccionar visible
          </ActionButton>
          <ActionButton icon={XCircle} onClick={clearSelection} disabled={selectedLeadIdList.length === 0}>
            Limpiar seleccion
          </ActionButton>
          <ActionButton icon={Flame} variant="gold" onClick={createBatchFromSelection} disabled={selectedLeadIdList.length === 0}>
            Crear lote
          </ActionButton>
          <ActionButton onClick={() => updateSelectedStatus("contacted")} disabled={selectedLeadIdList.length === 0}>
            Estado contactado
          </ActionButton>
          <ActionButton onClick={() => updateSelectedStatus("follow_up")} disabled={selectedLeadIdList.length === 0}>
            Estado seguimiento
          </ActionButton>
          <ActionButton onClick={() => updateSelectedStatus("sin_accion_por_ahora")} disabled={selectedLeadIdList.length === 0}>
            Sin accion
          </ActionButton>
          <ActionButton onClick={() => assignSelectedChannel("whatsapp")} disabled={selectedLeadIdList.length === 0}>
            Canal WhatsApp
          </ActionButton>
          <ActionButton onClick={() => assignSelectedChannel("instagram")} disabled={selectedLeadIdList.length === 0}>
            Canal Instagram
          </ActionButton>
          <ActionButton onClick={() => assignSelectedChannel("email")} disabled={selectedLeadIdList.length === 0}>
            Canal Email
          </ActionButton>
          <ActionButton onClick={() => assignSelectedChannel("manual")} disabled={selectedLeadIdList.length === 0}>
            Canal manual
          </ActionButton>
          <ActionButton icon={Save} variant="gold" onClick={saveSelectedLeadsToSheets} disabled={selectedLeadIdList.length === 0 || sheetsSync.isSaving}>
            Guardar seleccion
          </ActionButton>
        </div>
      </div>
    </div>
  );

  const renderOperationalLeadCard = (lead: Contact, variant: "default" | "proposal" = "default") => {
    const channel = (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel;
    const message = getChannelMessage(lead, channel);
    const emailAddress = lead.correo || lead.email || "";
    const demo = getLeadDemo(lead);

    return (
      <LeadOperationalCard
        key={lead.id}
        lead={lead}
        selected={Boolean(selectedLeadIds[lead.id])}
        expanded={Boolean(expandedLeadIds[lead.id])}
        variant={variant}
        saving={sheetsSync.isSaving}
        onToggleSelection={() => toggleLeadSelection(lead.id)}
        onToggleMore={() => toggleLeadExpanded(lead.id)}
        onDetails={() => openLeadDetail(lead)}
        onCopyMessage={() => copyText(message, "Mensaje recomendado")}
        onCopyEmail={() => copyText(String(emailAddress), "Email")}
        onOpenWhatsApp={() => openWhatsAppManual(lead)}
        onOpenInstagram={() => openInstagramManual(lead)}
        onOpenWeb={() => openWebManual(lead)}
        onOpenDemo={() => window.open(demo.url, "_blank", "noopener,noreferrer")}
        onSave={() => saveLeadToSheets(lead)}
        onPrepareProposal={() => openProposalPreparation(lead)}
        onUpdateStatus={(status, nextChannel) => updateLeadStatus(lead, status, nextChannel ?? channel)}
        onAssignChannel={(nextChannel) => assignLeadChannel(lead, nextChannel)}
        onCopyContactData={() => copyContactData(lead)}
        onCopyProposalSummary={() => copyText(buildProposalSummary(lead), "Resumen de propuesta")}
        onSaveProposalLink={() => saveProposalLink(lead, "propuesta_link", "link de propuesta")}
        onSaveMaterialLink={() => saveProposalLink(lead, "material_link", "link de material o demo")}
        onNotesBlur={(value) => saveLeadNotes(lead, value)}
      />
    );
  };

  const renderBatchSummary = () => {
    if (!lastBatchSummary) return null;
    return (
      <div className="rounded-lg border border-[#C7A45A]/25 bg-[#C7A45A]/[0.07] p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="luma-kicker">Resumen del lote desde Sheets</p>
            <p className="mt-2 text-sm leading-relaxed text-[#F5D78C]">
              {lastBatchSummary.motivo_principal ||
                `Se crearon ${lastBatchSummary.incluidos_lote} leads porque solo esos cumplen canal visible, estado elegible y no contacto reciente.`}
            </p>
          </div>
          <Badge className="border-[#C7A45A]/30 bg-[#C7A45A]/10 text-[#F5D78C]">Guardado en Sheets</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          <MiniStat label="Total evaluados" value={lastBatchSummary.total_evaluados} />
          <MiniStat label="Incluidos" value={lastBatchSummary.incluidos_lote} />
          <MiniStat label="Con WhatsApp" value={lastBatchSummary.con_whatsapp} />
          <MiniStat label="Con Instagram" value={lastBatchSummary.con_instagram} />
          <MiniStat label="Estado bloqueante" value={lastBatchSummary.excluidos_estado_bloqueante} />
          <MiniStat label="Falta canal" value={lastBatchSummary.excluidos_falta_canal} />
          <MiniStat label="Contacto reciente" value={lastBatchSummary.excluidos_contacto_reciente} />
          <MiniStat label="Sin mensaje" value={lastBatchSummary.sin_mensaje ?? 0} />
        </div>
      </div>
    );
  };

  const renderLeadCard = (lead: Contact, compact = false) => {
    const channel = getRecommendedChannel(lead);
    const niche = getNicheDefinition(resolveLeadNiche(lead));
    const whatsappMessage = getSafeRecommendedMessage(lead);
    const originalWhatsAppMessage = lead.mensaje_whatsapp || lead.suggestedMessage || "";
    const instagramMessage = getChannelMessage(lead, "instagram");
    const emailSubject = getEmailSubject(lead);
    const emailMessage = getChannelMessage(lead, "email");
    const notes = lead.notas || lead.notes || "";
    const demo = getLeadDemo(lead);
    const whatsappNumber = getLeadWhatsAppNumber(lead);
    const phoneNumber = getLeadPhoneNumber(lead);
    const emailAddress = lead.correo || lead.email || "";
    const webTarget = lead.web || lead.audit_domain || "";
    const reviewDomain = needsDomainReview(lead);
    const originalMessageSafeToShow = hasValue(originalWhatsAppMessage) && !hasUnsafeOutreachLanguage(originalWhatsAppMessage);
    const reportUrl = getLeadReportUrl(lead);
    const sourceLabel = getLeadSourceLabel(lead);

    return (
      <article key={lead.id} className="luma-lead-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {renderLeadSelectionControl(lead)}
              <LeadChannelBadge channel={channel} />
              <LeadStatusBadge status={lead.status} />
              <Badge className="border-white/10 bg-white/[0.04] text-white/60">Origen: {sourceLabel}</Badge>
              {!hasValue(lead.reporte_luma) && <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">Reporte pendiente</Badge>}
              {hasValue(lead.prioridad || lead.priority) && (
                <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">
                  Prioridad {lead.prioridad || lead.priority}
                </Badge>
              )}
              {reviewDomain && <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">Revisar dominio</Badge>}
              {isInstagramOnlyLead(lead) && (
                <Badge className="border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100">Instagram-only</Badge>
              )}
              {isBrokerAgentWithoutWeb(lead) && (
                <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">Broker sin web</Badge>
              )}
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--luma-ivory)]">{getLeadBusinessName(lead)}</h3>
            <p className="mt-1 text-sm text-[var(--luma-muted)]">
              {getLeadPersonName(lead)} {lead.cargo_rol ? `- ${lead.cargo_rol}` : ""} - {niche.shortLabel}
              {getLeadCity(lead) ? ` - ${getLeadCity(lead)}` : ""}
            </p>
            {isInstagramOnlyLead(lead) && (
              <p className="mt-3 rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-2 text-sm text-fuchsia-100">
                Contacto disponible por Instagram. Requiere enfoque DM.
              </p>
            )}
          </div>

          {renderLeadOperationalActions(lead, channel)}
        </div>

        {renderContactStrip(lead)}
        {renderChannelControls(lead)}

        {!compact && (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoBlock title="WhatsApp" value={visibleValue(whatsappNumber)} />
            <InfoBlock title="Telefono" value={visibleValue(phoneNumber)} />
            <InfoBlock title="Instagram" value={visibleValue(lead.instagram)} />
            <InfoBlock title="Email" value={visibleValue(emailAddress)} />
            <InfoBlock title="LinkedIn" value={visibleValue(lead.linkedin)} />
            <InfoBlock title="Facebook" value={visibleValue(lead.facebook)} />
            <InfoBlock title="Web" value={visibleValue(lead.web)} />
            <InfoBlock title="audit_domain" value={visibleValue(lead.audit_domain)} />
            <InfoBlock title="_reporte_luma" value={hasValue(lead.reporte_luma) ? String(lead.reporte_luma) : "Reporte pendiente"} />
            <InfoBlock title="ciudad_zona" value={visibleValue(lead.ciudad_zona || lead.city)} />
            <InfoBlock title="fuente_dato" value={visibleValue(lead.fuente_dato)} />
            <InfoBlock title="fuente_auditoria" value={visibleValue(lead.fuente_auditoria)} />
          </div>
        )}

        {!compact && (
          <div className="mt-5 grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <InfoBlock title="Senal comercial" value={getLeadSignal(lead)} />
            <InfoBlock title="Dolor probable" value={getLeadPain(lead)} />
            <InfoBlock title="Oportunidad visible" value={getLeadOpportunity(lead)} />
            <InfoBlock title="Oferta / angulo" value={`${getLeadOffer(lead)}\n${lead.angulo_contacto || lead.contactAngle || "Angulo pendiente."}`} />
            <InfoBlock title="Demo asociada" value={`${demo.label}\n${demo.url}`} />
            <InfoBlock title="Reporte Luma" value={getReportDisplay(lead)} />
          </div>
        )}

        {!compact && (
          <div className="mt-5 grid gap-3 xl:grid-cols-3">
            <MessagePreview title="WhatsApp" value={whatsappMessage} onCopy={() => copyText(whatsappMessage, "Mensaje WhatsApp")} />
            {originalMessageSafeToShow && originalWhatsAppMessage !== whatsappMessage && (
              <MessagePreview title="Original importado" value={originalWhatsAppMessage} onCopy={() => copyText(originalWhatsAppMessage, "Mensaje original")} />
            )}
            {hasValue(originalWhatsAppMessage) && !originalMessageSafeToShow && (
              <InfoBlock title="Mensaje original" value="Reemplazado por fallback consultivo premium. Evita iniciar con score, afirmar perdidas o sonar agresivo." />
            )}
            <MessagePreview title="Instagram" value={instagramMessage} onCopy={() => copyText(instagramMessage, "Mensaje Instagram")} />
            <MessagePreview
              title="Email"
              value={`Asunto: ${emailSubject}\n${emailMessage}`}
              onCopy={() => copyText(emailSubject, "Asunto email")}
              secondaryAction={() => copyText(`Asunto: ${emailSubject}\n\n${emailMessage}`, "Email completo")}
            />
          </div>
        )}

        <div className="mt-5">
          <p className="luma-kicker mb-3">Cambiar estado</p>
          {renderStatusActions(lead, channel)}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_280px]">
          <textarea
            defaultValue={notes}
            onBlur={(event) => saveLeadNotes(lead, event.target.value)}
            placeholder="Nota local: respuesta, objecion, fecha prometida, siguiente accion..."
            className="luma-input min-h-24 resize-y text-sm"
          />
          <div className="rounded-lg border border-white/[0.08] bg-black/10 p-4 text-sm text-[var(--luma-muted)]">
            <p className="luma-kicker">Proximo paso</p>
            <p className="mt-2 text-[var(--luma-ivory)]">{lead.proximo_paso || lead.nextStep || "Definir despues del contacto."}</p>
            <p className="mt-3 text-xs">Contactos: {lead.cantidad_contactos ?? lead.sentCount ?? 0}</p>
            <p className="mt-1 text-xs">Ultimo canal: {lead.ultimo_canal_usado || "No registrado"}</p>
          </div>
        </div>
      </article>
    );
  };

  const renderCompactLead = (lead: Contact) => {
    const channel = getRecommendedChannel(lead);
    const message = getChannelMessage(lead, channel);
    const whatsappNumber = getLeadWhatsAppNumber(lead);
    const emailAddress = lead.correo || lead.email || "";
    const reportUrl = getLeadReportUrl(lead);
    return (
      <article key={lead.id} className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
        <div className="grid gap-3 xl:grid-cols-[1.25fr_0.9fr_0.85fr_1.35fr_auto] xl:items-center">
          <div className="min-w-0">
            <div className="mb-2">{renderLeadSelectionControl(lead)}</div>
            <p className="truncate text-sm font-semibold text-[var(--luma-ivory)]">{getLeadBusinessName(lead)}</p>
            <p className="mt-1 truncate text-xs text-[var(--luma-muted)]">{getLeadPersonName(lead)}</p>
            <p className="mt-1 truncate text-xs text-white/45">WA {visibleValue(whatsappNumber)} · {visibleValue(emailAddress)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-white/10 bg-white/[0.04] text-white/60">
              {getNicheDefinition(resolveLeadNiche(lead)).shortLabel}
            </Badge>
            {hasValue(lead.prioridad || lead.priority) && (
              <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">{lead.prioridad || lead.priority}</Badge>
            )}
            {isInstagramOnlyLead(lead) && (
              <Badge className="border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100">Instagram-only</Badge>
            )}
            <Badge className="border-white/10 bg-white/[0.04] text-white/60">{getLeadSourceLabel(lead)}</Badge>
            {!hasValue(lead.reporte_luma) && <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">Reporte pendiente</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            <LeadChannelBadge channel={channel} />
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-[var(--luma-muted)]">{message}</p>
          <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
            <ActionButton icon={Copy} onClick={() => copyText(message, "Mensaje safe")}>Copiar</ActionButton>
            <ActionButton icon={MessageCircle} onClick={() => openWhatsAppManual(lead)} disabled={!hasValue(whatsappNumber)}>WhatsApp</ActionButton>
            <ActionButton icon={ExternalLink} onClick={() => openInstagramManual(lead)} disabled={!hasValue(lead.instagram)}>Instagram</ActionButton>
            <ActionButton icon={Mail} onClick={() => copyText(emailAddress, "Email")} disabled={!hasValue(emailAddress)}>Email</ActionButton>
            <ActionButton icon={ExternalLink} onClick={() => window.open(reportUrl, "_blank", "noopener,noreferrer")} disabled={!hasValue(reportUrl)}>Reporte</ActionButton>
            <ActionButton onClick={() => updateLeadStatus(lead, "contacted", channel)}>Contactado</ActionButton>
            <ActionButton onClick={() => updateLeadStatus(lead, "replied", channel)}>Respondio</ActionButton>
            <ActionButton onClick={() => updateLeadStatus(lead, "follow_up", channel)}>Seguimiento</ActionButton>
            <ActionButton onClick={() => updateLeadStatus(lead, "sin_accion_por_ahora", channel)}>Sin accion</ActionButton>
            <ActionButton icon={Save} variant="gold" onClick={() => saveLeadToSheets(lead)}>Sheets</ActionButton>
          </div>
        </div>
      </article>
    );
  };

  const renderProspectOperationalRow = (lead: Contact) => {
    const channel = getRecommendedChannel(lead);
    const expanded = Boolean(expandedLeadIds[lead.id]);
    const nextStep = lead.proximo_paso || lead.nextStep || "Sin proximo paso.";
    return (
      <article key={lead.id} className="border-b border-white/[0.06] p-4 last:border-b-0">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.9fr_1.4fr] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {renderLeadSelectionControl(lead)}
              <LeadChannelBadge channel={channel} />
              <LeadStatusBadge status={lead.status} />
              <Badge className="border-white/10 bg-white/[0.04] text-white/60">{getNicheDefinition(resolveLeadNiche(lead)).shortLabel}</Badge>
            </div>
            <p className="mt-3 truncate text-base font-semibold text-[var(--luma-ivory)]">{getLeadBusinessName(lead)}</p>
            <p className="mt-1 truncate text-sm text-[var(--luma-muted)]">{getLeadPersonName(lead)}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">{nextStep}</p>
          </div>

          <div className="grid gap-2 text-xs text-[var(--luma-muted)] sm:grid-cols-2 xl:grid-cols-1">
            <span>WhatsApp: {visibleValue(getLeadWhatsAppNumber(lead))}</span>
            <span>Instagram: {visibleValue(lead.instagram)}</span>
            <span>Email: {visibleValue(lead.correo || lead.email)}</span>
            <span>Web: {visibleValue(lead.web || lead.audit_domain)}</span>
          </div>

          <div className="space-y-3">
            {renderLeadOperationalActions(lead, channel)}
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => toggleLeadExpanded(lead.id)}>
                {expanded ? "Ocultar datos" : "Ver mas"}
              </ActionButton>
              <ActionButton icon={Clipboard} onClick={() => copyContactData(lead)}>
                Copiar todos los datos
              </ActionButton>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 rounded-lg border border-white/[0.08] bg-black/10 p-4">
            {renderChannelControls(lead)}
            <div>
              <p className="luma-kicker mb-3">Cambiar estado</p>
              {renderStatusActions(lead, channel)}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoBlock title="Telefono" value={visibleValue(getLeadPhoneNumber(lead))} />
              <InfoBlock title="LinkedIn" value={visibleValue(lead.linkedin)} />
              <InfoBlock title="Oferta recomendada" value={getLeadOffer(lead)} />
              <InfoBlock title="Demo asociada" value={`${getLeadDemo(lead).label}\n${getLeadDemo(lead).url}`} />
              <InfoBlock title="Senal comercial" value={getLeadSignal(lead)} />
              <InfoBlock title="Oportunidad visible" value={getLeadOpportunity(lead)} />
              <InfoBlock title="Notas" value={lead.conversation_summary || lead.notas || lead.notes || "Sin notas."} />
              <InfoBlock title="Origen" value={getLeadSourceLabel(lead)} />
            </div>
          </div>
        )}
      </article>
    );
  };

  const renderCommandCenter = () => (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Total leads cargados" value={metrics.total} detail={state.sourceFileName || "Importa el primer lote para activar la operacion."} />
        <MetricCard icon={Target} label="Listos para contacto" value={metrics.ready} detail="Con canal visible y sin bloqueo de revision." tone="gold" />
        <MetricCard icon={Flame} label="Contactados hoy" value={metrics.contactedToday} detail={`Meta diaria operativa: ${workspaceConfig.defaultDailyContactGoal} contactos manuales.`} tone="success" />
        <MetricCard icon={Gem} label="Meta mensual minima" value={workspaceConfig.defaultGoal} detail={`Estimado conservador: RD$${metrics.estimatedRevenue.toLocaleString("en-US")} (${metrics.goalProgress}%).`} tone="gold" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={MessagesSquare} label="Respuestas" value={metrics.responses} />
        <MetricCard icon={UserCheck} label="Interesados" value={metrics.interested} />
        <MetricCard icon={CalendarClock} label="Llamadas / citas" value={metrics.calls} />
        <MetricCard icon={CheckCircle2} label="Propuestas / cierres" value={`${metrics.proposals} / ${metrics.closed}`} />
      </div>

      <DatasetActivePanel contacts={contacts} workspace={state.workspace} importReport={state.importReport} />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="luma-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="luma-kicker">KPIs por canal</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">Capacidad de contacto visible</h2>
            </div>
            <ShieldCheck className="text-[var(--luma-gold)]" size={22} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="WhatsApp-ready" value={metrics.channels.whatsapp} />
            <MiniStat label="Instagram-ready" value={metrics.channels.instagram} />
            <MiniStat label="Email-ready" value={metrics.channels.email} />
            <MiniStat label="LinkedIn-ready" value={metrics.channels.linkedin} />
            <MiniStat label="Llamada-ready" value={metrics.channels.llamada} />
            <MiniStat label="Web/manual" value={metrics.channels.web + metrics.channels.manual} />
            <MiniStat label="Sin canal visible" value={metrics.channels.sin_canal} />
            <MiniStat label="Necesitan revision" value={metrics.review} />
          </div>
        </div>

        <div className="luma-panel p-5">
          <p className="luma-kicker">Runway comercial</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">Progreso hacia {workspaceConfig.defaultGoal}</h2>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-[var(--luma-gold)]" style={{ width: `${metrics.goalProgress}%` }} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--luma-muted)]">
            La consola prioriza vender primero: contactar, responder, agendar, proponer y cerrar. El estimado usa RD$25,000 por cierre si no hay monto registrado.
          </p>
        </div>
      </div>

      <div className="luma-panel p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="luma-kicker">KPIs por nicho</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">Donde responde el mercado</h2>
          </div>
          <ActionButton icon={ArrowDownUp} onClick={() => setActiveView("nichos")}>
            Ver nichos
          </ActionButton>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {nicheMetrics.map((niche) => (
            <div key={niche.key} className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="text-sm font-semibold text-[var(--luma-ivory)]">{niche.shortLabel}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <MiniStat label="Total" value={niche.total} />
                <MiniStat label="Listos" value={niche.ready} />
                <MiniStat label="Contactados" value={niche.contacted} />
                <MiniStat label="Conversion" value={`${niche.conversion}%`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderNichos = () => (
    <section className="space-y-5">
      <SectionHeader
        kicker="Modelo multinicho"
        title={`${commercialFrontCount} frentes comerciales, una consola local`}
        body="Cada nicho tiene oferta, ticket y pipeline propio. Si aun no tiene leads, queda listo para importar su CSV normalizado."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {nicheMetrics.map((niche) => (
          <article key={niche.key} className="luma-panel p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="luma-kicker">{niche.label}</p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">{niche.shortLabel}</h3>
                <p className="mt-2 text-sm text-[var(--luma-muted)]">{niche.offer}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">{niche.ticket}</Badge>
                  <Badge className="border-white/10 bg-white/[0.04] text-white/60">Demo: {niche.demoLabel}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <ActionButton icon={Flame} onClick={() => { setNicheFilter(niche.key); setActiveView("today"); }}>
                  Ver lote
                </ActionButton>
                <ActionButton icon={FileUp} onClick={() => { setActiveView("import"); importInputRef.current?.click(); }}>
                  Importar leads
                </ActionButton>
              </div>
            </div>

            {niche.key === "real_estate" && (
              <div className="mt-5 rounded-lg border border-[#C7A45A]/20 bg-[#C7A45A]/[0.06] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="luma-kicker">Subsegmento comercial</p>
                    <h4 className="mt-2 text-lg font-semibold text-[var(--luma-ivory)]">Brokers / agentes sin web</h4>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--luma-muted)]">
                      Prospectos para vender infraestructura digital propia, no propiedades.
                    </p>
                  </div>
                  <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">
                    {niche.brokersWithoutWeb} detectados
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoBlock title="Oferta recomendada" value="Luma Estate OS Starter" />
                  <InfoBlock title="Ticket sugerido" value="RD$45,000 - RD$75,000" />
                  <InfoBlock
                    title="Incluye"
                    value={[
                      "landing personal o landing de autoridad",
                      "formulario/filtro de interesados",
                      "WhatsApp organizado",
                      "base de prospectos",
                      "seguimiento simple",
                      "presentacion profesional",
                      "posibilidad de escalar a CRM/dashboard",
                    ].join("\n")}
                  />
                  <InfoBlock
                    title="Oportunidad visible"
                    value="Construir una presencia propia de autoridad, captacion y seguimiento para no depender unicamente de Instagram o WhatsApp."
                  />
                  <InfoBlock
                    title="Dolor probable"
                    value="Dependencia de redes sociales y conversaciones dispersas sin una ruta clara de captacion y seguimiento."
                  />
                  <div className="flex items-end">
                    <ActionButton
                      icon={Filter}
                      variant="gold"
                      onClick={() => {
                        setNicheFilter("real_estate");
                        setQuickFilter("brokers_sin_web");
                        setActiveView("prospects");
                      }}
                    >
                      Ver brokers sin web
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}

            {niche.total === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-white/10 p-5 text-sm text-[var(--luma-muted)]">
                Sin leads cargados todavia. Importa un CSV normalizado para activar este nicho.
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label="Total leads" value={niche.total} />
                <MiniStat label="Listos" value={niche.ready} />
                <MiniStat label="Contactados" value={niche.contacted} />
                <MiniStat label="Respuestas" value={niche.responded} />
                <MiniStat label="Llamadas" value={niche.calls} />
                <MiniStat label="Propuestas" value={niche.proposals} />
                <MiniStat label="Cierres" value={niche.closed} />
                <MiniStat label="Conversion" value={`${niche.conversion}%`} />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );

  const renderToday = () => (
    <section className="space-y-5">
      <SectionHeader
        kicker="Operacion diaria"
        title="Lote de Hoy"
        body={`Trabaja ${workspaceConfig.defaultDailyContactGoal} contactos manuales. Copia, abre canal, conversa, marca estado y deja nota. La consola no envia por ti.`}
      />
      <div className="luma-panel p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Nombre del batch" value={state.workspace?.activeBatchName || state.workspace?.batchName || state.campaignName || "Sin batch activo"} />
          <MiniStat label="Archivo origen" value={state.workspace?.activeBatchSourceFile || state.workspace?.lastImportedFileName || state.sourceFileName || "Sin archivo"} />
          <MiniStat
            label="Nicho principal"
            value={getNicheDefinition(state.workspace?.activeBatchMainNiche || (todayBatch[0] ? resolveLeadNiche(todayBatch[0]) : "unknown")).shortLabel}
          />
          <MiniStat label="Total del lote" value={todayBatch.length} />
          <MiniStat label="Contactados" value={todayStats.contacted} />
          <MiniStat label="Pendientes" value={todayStats.pending} />
          <MiniStat label="Respondieron" value={todayStats.responded} />
          <MiniStat label="Interesados" value={todayStats.interested} />
          <MiniStat label="Seguimientos" value={todayStats.followups} />
          <MiniStat
            label="Proximo contacto"
            value={todayStats.nextLead ? `${getLeadBusinessName(todayStats.nextLead)} (${CHANNEL_LABELS[getRecommendedChannel(todayStats.nextLead)]})` : "Sin pendiente"}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton icon={Flame} variant="gold" onClick={() => createSheetBatch("today")}>
            Crear lote de hoy desde Sheets
          </ActionButton>
          <ActionButton icon={MessageCircle} variant="gold" onClick={() => createSheetBatch("whatsapp", { channel: "whatsapp" })}>
            Crear lote WhatsApp
          </ActionButton>
          <ActionButton icon={MessagesSquare} variant="gold" onClick={() => createSheetBatch("instagram", { channel: "instagram" })}>
            Crear lote Instagram DM
          </ActionButton>
          <ActionButton icon={Mail} variant="gold" onClick={() => createSheetBatch("email", { channel: "email" })}>
            Crear lote Email
          </ActionButton>
          <ActionButton icon={BriefcaseBusiness} onClick={() => createSheetBatch("niche", { niche: nicheFilter })}>
            Crear lote por nicho
          </ActionButton>
          <ActionButton icon={CalendarClock} onClick={() => createSheetBatch("followup_overdue")}>
            Crear lote seguimiento vencido
          </ActionButton>
          <SegmentButton active={todayFilter === "pending"} onClick={() => setTodayFilter(todayFilter === "pending" ? "all" : "pending")} icon={Filter}>
            Ver solo pendientes
          </SegmentButton>
          <SegmentButton active={todayFilter === "contacted"} onClick={() => setTodayFilter(todayFilter === "contacted" ? "all" : "contacted")} icon={CheckCircle2}>
            Ver contactados
          </SegmentButton>
          <SegmentButton active={todayFilter === "interested"} onClick={() => setTodayFilter(todayFilter === "interested" ? "all" : "interested")} icon={UserCheck}>
            Ver interesados
          </SegmentButton>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/[0.35]" size={16} />
          <input
            value={todaySearch}
            onChange={(event) => setTodaySearch(event.target.value)}
            placeholder="Buscar en Lote de Hoy: Eddy Veras, negocio, persona, telefono, WhatsApp, Instagram, email, nicho o estado..."
            className="luma-input pl-10"
          />
        </div>
      </div>
      {renderBatchSummary()}
      {renderSelectionToolbar(visibleTodayBatch, "Lote de Hoy")}
      {todayBatch.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No hay lote cargado."
          body="Importa un lote CSV/XLSX desde tu equipo para comenzar."
        />
      ) : (
        <div className="space-y-3">
          {visibleTodayBatch.length === 0 ? (
            <EmptyState icon={Search} title="No hay resultados en este lote." body="Cambia la busqueda local o limpia filtros para continuar." />
          ) : (
            visibleTodayBatch.map((lead) => renderOperationalLeadCard(lead))
          )}
        </div>
      )}
    </section>
  );

  const renderProspects = () => (
    <section className="space-y-5">
      <SectionHeader
        kicker="Base completa"
        title="Prospectos"
        body="Base operativa para buscar, contactar, cambiar estado, preparar propuesta y guardar sin salir de Prospectos."
      />

      <div className="luma-panel p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/[0.35]" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, negocio, persona, telefono, WhatsApp, Instagram, email, nicho, estado, oferta o notas..."
              className="luma-input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <SegmentButton active={reviewOnly} onClick={() => setReviewOnly((value) => !value)} icon={AlertTriangle}>
              Revision
            </SegmentButton>
            {(["priority", "status", "date"] as const).map((mode) => (
              <SegmentButton key={mode} active={sortMode === mode} onClick={() => setSortMode(mode)} icon={ArrowDownUp}>
                {mode === "priority" ? "Prioridad" : mode === "status" ? "Estado" : "Fecha"}
              </SegmentButton>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip active={nicheFilter === "all"} onClick={() => setNicheFilter("all")}>Todos los nichos</FilterChip>
          {NICHES.map((niche) => (
            <FilterChip key={niche.key} active={nicheFilter === niche.key} onClick={() => setNicheFilter(niche.key)}>
              {niche.shortLabel}
            </FilterChip>
          ))}
          <FilterChip active={nicheFilter === "unknown"} onClick={() => setNicheFilter("unknown")}>
            {UNKNOWN_NICHE.shortLabel}
          </FilterChip>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip active={priorityFilter === "all"} onClick={() => setPriorityFilter("all")}>Toda prioridad</FilterChip>
          {uniquePriorities.map((priority) => (
            <FilterChip key={priority} active={priorityFilter === priority} onClick={() => setPriorityFilter(priority)}>
              {priority}
            </FilterChip>
          ))}
          {(["all", "whatsapp", "instagram", "email", "linkedin", "llamada", "web", "manual", "sin_canal"] as Array<RecommendedChannel | "all">).map((channel) => (
            <FilterChip key={channel} active={channelFilter === channel} onClick={() => setChannelFilter(channel)}>
              {channel === "all" ? "Todo canal" : CHANNEL_LABELS[channel]}
            </FilterChip>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.entries(DATE_FILTER_LABELS) as Array<[DateFilter, string]>).map(([key, label]) => (
            <FilterChip key={key} active={dateFilter === key} onClick={() => setDateFilter(key)}>
              {label}
            </FilterChip>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/10 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="luma-kicker">Filtros rapidos de lote</p>
              <p className="mt-2 text-sm text-[var(--luma-muted)]">
                Segmenta canales manuales y arma lotes sin enviar mensajes automaticamente.
              </p>
            </div>
            <ActionButton icon={MessagesSquare} variant="gold" onClick={() => createSheetBatch("instagram", { channel: "instagram" })}>
              Crear lote Instagram DM
            </ActionButton>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip active={quickFilter === "all"} onClick={() => setQuickFilter("all")}>Todos</FilterChip>
            {QUICK_FILTERS.map((filter) => (
              <FilterChip key={filter.key} active={quickFilter === filter.key} onClick={() => setQuickFilter(filter.key)}>
                {filter.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Todo estado</FilterChip>
          {uniqueStatuses.map((status) => (
            <FilterChip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {statusLabel(status)}
            </FilterChip>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-white/[0.08] bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/[0.35]">Filtros activos</span>
            {activeFilterLabels.length === 0 ? (
              <Badge className="border-white/10 bg-white/[0.04] text-white/50">Ninguno</Badge>
            ) : (
              activeFilterLabels.map((label) => (
                <Badge key={label} className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">
                  {label}
                </Badge>
              ))
            )}
          </div>
          <ActionButton icon={XCircle} onClick={clearFilters} disabled={activeFilterLabels.length === 0}>
            Limpiar filtros
          </ActionButton>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--luma-muted)]">
          Mostrando {visibleProspectRows.length} de {filteredLeads.length} prospectos filtrados. Pagina {Math.min(prospectsPage, totalProspectPages)} de {totalProspectPages}.
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => setProspectsPage((page) => Math.max(1, page - 1))} disabled={prospectsPage <= 1}>
            Anterior
          </ActionButton>
          <ActionButton onClick={() => setProspectsPage((page) => Math.min(totalProspectPages, page + 1))} disabled={prospectsPage >= totalProspectPages}>
            Siguiente
          </ActionButton>
        </div>
      </div>
      {renderSelectionToolbar(visibleProspectRows, "Prospectos")}

      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <EmptyState title="No hay resultados con estos filtros." body="Limpia filtros o cambia busqueda." />
        ) : (
          visibleProspectRows.map((lead) => renderOperationalLeadCard(lead))
        )}
      </div>
    </section>
  );

  const renderFollowup = () => {
    const leads = contacts
      .filter((lead) => FOLLOW_UP_STATUSES.has(lead.status))
      .filter((lead) => leadMatchesQuery(lead, followupSearch))
      .sort((a, b) => String(a.followup_due_date || a.fecha_seguimiento || "9999").localeCompare(String(b.followup_due_date || b.fecha_seguimiento || "9999")));
    return (
      <section className="space-y-5">
        <SectionHeader
          kicker="Pipeline activo"
          title="Seguimiento"
          body="Donde no se pierden conversaciones: proximo paso, fecha, canal, intentos y notas."
        />
        <div className="luma-panel p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/[0.35]" size={16} />
            <input
              value={followupSearch}
              onChange={(event) => setFollowupSearch(event.target.value)}
              placeholder="Buscar seguimiento por nombre, negocio, estado, proximo paso, canal, fecha, propuesta o notas..."
              className="luma-input pl-10"
            />
          </div>
        </div>
        {renderSelectionToolbar(leads, "Seguimiento")}
        {leads.length === 0 ? (
          <EmptyState icon={RefreshCw} title="Aun no hay leads en seguimiento." body="Marca contactados, respuestas o interesados desde el lote de hoy." />
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => renderOperationalLeadCard(lead))}
          </div>
        )}
      </section>
    );
  };

  const renderCalls = () => {
    const leads = contacts.filter((lead) => CALL_STATUSES.has(lead.status));
    return (
      <section className="space-y-5">
        <SectionHeader
          kicker="Conversion consultiva"
          title="Llamadas"
          body="Usa el guion base para pasar de observacion publica a diagnostico comercial sin sonar agresivo."
        />
        <div className="luma-panel p-5">
          <p className="luma-kicker">Guion base</p>
          <p className="mt-3 text-lg leading-relaxed text-[var(--luma-ivory)]">{CALL_SCRIPT}</p>
          <div className="mt-4">
            <ActionButton icon={Copy} onClick={() => copyText(CALL_SCRIPT, "Guion de llamada")}>Copiar guion breve</ActionButton>
          </div>
        </div>
        {leads.length === 0 ? (
          <EmptyState icon={Phone} title="No hay llamadas activas." body="Cuando un lead pida hablar, marcalo como llamada o cita." />
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <article key={lead.id} className="luma-lead-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <LeadStatusBadge status={lead.status} />
                    <h3 className="mt-4 text-xl font-semibold text-[var(--luma-ivory)]">{getLeadBusinessName(lead)}</h3>
                    <p className="mt-1 text-sm text-[var(--luma-muted)]">{getLeadPersonName(lead)} - {getNicheDefinition(resolveLeadNiche(lead)).shortLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton icon={Copy} onClick={() => copyText(CALL_SCRIPT, "Guion de llamada")}>Copiar guion breve</ActionButton>
                    <ActionButton icon={FileSpreadsheet} variant="gold" onClick={() => updateLeadStatus(lead, "proposal_sent", getRecommendedChannel(lead))}>
                      Marcar propuesta enviada
                    </ActionButton>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <InfoBlock title="Dolor probable" value={getLeadPain(lead)} />
                  <InfoBlock title="Oferta recomendada" value={getLeadOffer(lead)} />
                  <InfoBlock title="Angulo de conversacion" value={lead.angulo_contacto || lead.contactAngle || "Conectar senal publica con impacto comercial."} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderProposals = () => {
    const leads = contacts.filter((lead) => PROPOSAL_STATUSES.has(lead.status)).filter((lead) => leadMatchesQuery(lead, proposalSearch));
    return (
      <section className="space-y-5">
        <SectionHeader
          kicker="High-ticket"
          title="Propuestas"
          body="Propuestas de implementacion Luma Premium: oferta, ticket, siguiente paso y material comercial. No es una seccion para presentar propiedades."
        />
        <div className="luma-panel p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/[0.35]" size={16} />
            <input
              value={proposalSearch}
              onChange={(event) => setProposalSearch(event.target.value)}
              placeholder="Buscar propuestas por nombre, negocio, oferta, ticket, estado, canal, fecha, link o notas..."
              className="luma-input pl-10"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {PRODUCT_CATALOG.map((product) => (
            <div key={product.key} className="luma-panel p-4">
              <p className="text-sm font-semibold text-[var(--luma-ivory)]">{product.name}</p>
              <p className="mt-2 text-sm text-[var(--luma-muted)]">{product.nicheLabel}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">{product.ticket}</Badge>
                <Badge className="border-white/10 bg-white/[0.04] text-white/60">{product.demo.label}</Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-dashed border-[#C7A45A]/25 bg-[#C7A45A]/[0.06] p-4 text-sm text-[#F5D78C]">
          Links de propuesta, material comercial o demo se guardan por prospecto en localStorage.
        </div>
        {renderSelectionToolbar(leads, "Propuestas")}
        {leads.length === 0 ? (
          <EmptyState icon={FileSpreadsheet} title="No hay propuestas activas." body="Cuando una llamada avance, marca propuesta enviada y deja el proximo paso." />
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => renderOperationalLeadCard(lead, "proposal"))}
          </div>
        )}
      </section>
    );
  };

  const renderReview = () => {
    const leads = contacts.filter(isReviewLead);
    const grouped = [
      { key: "solo_instagram", title: "Solo Instagram" },
      { key: "sin_web", title: "Sin web" },
      { key: "sin_canal", title: "Sin canal visible" },
      { key: "dominio_no_validado", title: "Dominio no validado" },
      { key: "nicho_pendiente", title: "Nicho pendiente" },
      { key: "mensaje_faltante", title: "Mensaje faltante" },
      { key: "conflicto_datos", title: "Conflicto de datos" },
      { key: "datos_incompletos", title: "Datos incompletos" },
    ].map((group) => ({
      ...group,
      leads: leads.filter((lead) => getReviewReasons(lead).some((reason) => reason.key === group.key)),
    })).filter((group) => group.leads.length > 0);

    return (
      <section className="space-y-5">
        <SectionHeader
          kicker="Higiene comercial"
          title="Revision"
          body="Separa motivos de revision sin castigar leads trabajables. Solo Instagram no es malo: requiere enfoque DM."
        />
        {leads.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No hay conflictos visibles." body="Los leads cargados tienen suficiente informacion para trabajar." />
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.key} className="luma-panel p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="luma-kicker">Motivo de revision</p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">{group.title}</h3>
                  </div>
                  <Badge className="border-white/10 bg-white/[0.04] text-white/60">{group.leads.length} leads</Badge>
                </div>
                <div className="mt-4 space-y-4">
                  {group.leads.map((lead) => {
                    const reasons = getReviewReasons(lead);
                    const mainReason = reasons.find((reason) => reason.key === group.key) ?? reasons[0];
                    return (
                      <article key={`${group.key}-${lead.id}`} className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <LeadStatusBadge status={lead.status} />
                              <LeadChannelBadge channel={getRecommendedChannel(lead)} />
                              {isInstagramOnlyLead(lead) && (
                                <Badge className="border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100">Instagram-only</Badge>
                              )}
                              {isBrokerAgentWithoutWeb(lead) && (
                                <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">Broker sin web</Badge>
                              )}
                              {needsDomainReview(lead) && <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">Revisar dominio</Badge>}
                            </div>
                            <h4 className="mt-4 text-lg font-semibold text-[var(--luma-ivory)]">{getLeadBusinessName(lead)}</h4>
                            <p className="mt-1 text-sm text-[var(--luma-muted)]">
                              {mainReason?.detail || "Requiere revision manual."}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {reasons.map((reason) => (
                                <Badge
                                  key={reason.key}
                                  className={cn(
                                    reason.tone === "success" && "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
                                    reason.tone === "warning" && "border-amber-300/20 bg-amber-300/10 text-amber-100",
                                    reason.tone === "danger" && "border-red-300/20 bg-red-300/10 text-red-100",
                                    (!reason.tone || reason.tone === "neutral") && "border-white/10 bg-white/[0.04] text-white/60",
                                  )}
                                >
                                  {reason.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <ActionButton onClick={() => updateLeadStatus(lead, "follow_up", getRecommendedChannel(lead))}>Contactar luego</ActionButton>
                            <ActionButton onClick={() => updateLeadStatus(lead, "sin_accion_por_ahora", getRecommendedChannel(lead))}>Sin accion por ahora</ActionButton>
                            <ActionButton onClick={() => updateLeadStatus(lead, "buscar_canal", "manual")}>Buscar canal manualmente</ActionButton>
                            <ActionButton onClick={() => updateLeadStatus(lead, "needs_review", "manual")}>Mantener en revision</ActionButton>
                            <ActionButton variant="danger" onClick={() => updateLeadStatus(lead, "discarded", "manual")}>Descartar</ActionButton>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                          <InfoBlock title="WhatsApp" value={visibleValue(getLeadWhatsAppNumber(lead))} />
                          <InfoBlock title="Telefono" value={visibleValue(getLeadPhoneNumber(lead))} />
                          <InfoBlock title="Instagram" value={visibleValue(lead.instagram)} />
                          <InfoBlock title="Email" value={visibleValue(lead.correo || lead.email)} />
                          <InfoBlock title="LinkedIn" value={visibleValue(lead.linkedin)} />
                          <InfoBlock title="Web" value={visibleValue(lead.web)} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderImport = () => (
    <section className="space-y-5">
      <SectionHeader
        kicker="Entrada local"
        title="Importar lote normalizado"
        body="Importa CSV, XLSX o XLS. Primero revisa el preview; nada se guarda hasta confirmar."
      />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="luma-panel p-6">
            <p className="luma-kicker">Modo de importacion</p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => setImportMode("replace")}
                className={cn("luma-choice", importMode === "replace" && "luma-choice-active")}
              >
                <span className="font-semibold">Reemplazar workspace actual</span>
                <span className="text-xs text-[var(--luma-muted)]">Default para pruebas limpias: el total final debe coincidir con el archivo importado.</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode("append")}
                className={cn("luma-choice", importMode === "append" && "luma-choice-active")}
              >
                <span className="font-semibold">Agregar al workspace actual</span>
                <span className="text-xs text-[var(--luma-muted)]">Usar solo cuando quieras sumar nichos o lotes al workspace existente.</span>
              </button>
            </div>
          </div>

          <div className="luma-panel p-6">
            <input ref={importInputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleImport} />
            <button type="button" onClick={() => importInputRef.current?.click()} className="luma-upload">
              <FileUp size={34} />
              <span className="text-lg font-semibold text-[var(--luma-ivory)]">Seleccionar CSV / XLSX / XLS</span>
              <span className="max-w-md text-sm text-[var(--luma-muted)]">
                La consola mostrara una previsualizacion antes de tocar localStorage.
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <WorkspaceSummary
            contacts={contacts}
            workspace={state.workspace}
            onExport={exportUpdatedState}
            onClear={resetLocalState}
          />
          <ImportHistoryPanel history={state.importHistory ?? []} />

          <div className="luma-panel p-6">
            <p className="luma-kicker">Inicio seguro</p>
            <p className="mt-3 rounded-lg border border-[#C7A45A]/20 bg-[#C7A45A]/[0.08] p-4 text-sm text-[#F5D78C]">
              Importa un lote CSV/XLSX desde tu equipo para comenzar.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--luma-muted)]">
              Para una prueba limpia, primero limpia el workspace local y luego importa un archivo normalizado en modo Reemplazar.
            </p>
          </div>
        </div>
      </div>

      {pendingImport && importPreview && (
        <div className="luma-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="luma-kicker">Preview antes de importar</p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--luma-ivory)]">{pendingImport.fileName}</h3>
              <p className="mt-2 text-sm text-[var(--luma-muted)]">
                Modo: {importMode === "replace" ? "Reemplazar workspace actual" : "Agregar al workspace actual"} - Batch: {inferCampaignName(pendingImport.fileName, pendingImport.rows)}
              </p>
              <p className="mt-1 text-sm text-[var(--luma-muted)]">
                Total resultante estimado: {importPreview.contacts.length} leads en consola local.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton icon={CheckCircle2} variant="gold" onClick={confirmImport}>
                Confirmar importacion
              </ActionButton>
              <ActionButton icon={XCircle} variant="danger" onClick={cancelImport}>
                Cancelar
              </ActionButton>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MiniStat label="Filas leidas" value={importPreview.report.rowsRead} />
            <MiniStat label="Filas validas" value={importPreview.report.imported} />
            <MiniStat label="Filas ignoradas" value={importPreview.report.ignoredRows} />
            <MiniStat label="WhatsApp" value={importPreview.report.channelCounts.whatsapp} />
            <MiniStat label="Instagram" value={importPreview.report.channelCounts.instagram} />
            <MiniStat label="Email" value={importPreview.report.channelCounts.email} />
            <MiniStat label="LinkedIn" value={importPreview.report.channelCounts.linkedin} />
            <MiniStat label="Llamada" value={importPreview.report.channelCounts.llamada} />
            <MiniStat label="Web" value={importPreview.report.channelCounts.web} />
            <MiniStat label="Manual" value={importPreview.report.channelCounts.manual} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InfoBlock title="Sin canal" value={String(importPreview.report.channelCounts.sin_canal)} />
            <InfoBlock title="Nichos detectados" value={importPreview.report.nichesDetected.map((niche) => getNicheDefinition(niche).shortLabel).join(", ") || "Nicho pendiente"} />
            <InfoBlock title="Header detectado" value={`Fila ${importPreview.report.headerRow}\n${importPreview.report.detectedColumns.join("\n") || "Sin columnas detectadas"}`} />
          </div>
          {importPreview.report.possibleTrashRows.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="luma-kicker">Posibles filas basura ignoradas</p>
              <div className="mt-3 space-y-1 text-sm text-amber-100/80">
                {importPreview.report.possibleTrashRows.map((row) => (
                  <p key={row}>{row}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );

  const renderSettings = () => (
    <section className="space-y-5">
      <SectionHeader
        kicker="Control Sheets"
        title="Configuracion"
        body="Google Sheets es fuente de verdad. CSV y localStorage quedan como respaldo operativo."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceSummary
          contacts={contacts}
          workspace={state.workspace}
          onExport={exportUpdatedState}
          onClear={resetLocalState}
        />
        <ImportHistoryPanel history={state.importHistory ?? []} />

        <div className="luma-panel p-6">
          <p className="luma-kicker">Plantilla fallback</p>
          <textarea
            value={state.template}
            onChange={(event) => setState((prev) => ({ ...prev, template: event.target.value }))}
            className="luma-input mt-3 min-h-36 resize-y text-sm"
          />
          <p className="mt-3 text-xs text-[var(--luma-muted)]">
            Se usa solo si el lote no trae mensaje por canal. Lenguaje consultivo, permiso antes de observacion y cero ataque.
          </p>
        </div>
      </div>

      <div className="luma-panel p-6">
        <p className="luma-kicker">Columnas operativas Sheets</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {GOOGLE_SHEETS_COLUMNS.map((column) => (
            <Badge key={column} className="border-white/10 bg-white/[0.04] text-white/60">{column}</Badge>
          ))}
        </div>
      </div>
    </section>
  );

  const renderProposalPreparationModal = () => {
    const lead = contacts.find((item) => item.id === proposalDraftLeadId);
    if (!lead) return null;
    const channel = (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel;
    const demo = getLeadDemo(lead);
    const message = getChannelMessage(lead, channel);

    return (
      <div className="fixed inset-0 z-[70] flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
        <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/[0.1] bg-[var(--luma-surface)] p-5 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="luma-kicker">Preparar propuesta</p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--luma-ivory)]">{getLeadBusinessName(lead)}</h3>
              <p className="mt-1 text-sm text-[var(--luma-muted)]">
                No se envia automaticamente. Marcos copia, abre el canal y decide manualmente.
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar preparar propuesta"
              onClick={closeProposalPreparation}
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoBlock title="Oferta" value={getLeadOffer(lead)} />
            <InfoBlock title="Ticket" value={getLeadTicket(lead)} />
            <InfoBlock title="Demo" value={`${demo.label}\n${demo.url}`} />
            <InfoBlock title="Canal recomendado" value={CHANNEL_LABELS[channel] || String(channel)} />
            <InfoBlock title="Mensaje sugerido" value={message} />
            <InfoBlock title="Proximo paso" value={lead.proximo_paso || lead.nextStep || "Definir seguimiento comercial."} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="luma-kicker">Link de propuesta</span>
              <input
                value={proposalDraftLink}
                onChange={(event) => setProposalDraftLink(event.target.value)}
                placeholder="Pega aqui el link de propuesta cuando exista"
                className="luma-input mt-2"
              />
            </label>
            <ActionButton icon={Save} variant="gold" onClick={() => saveProposalPreparation(lead)} disabled={sheetsSync.isSaving}>
              Guardar en Sheets
            </ActionButton>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ActionButton icon={Copy} onClick={() => copyText(message, "Mensaje de propuesta")}>Copiar mensaje</ActionButton>
            <ActionButton icon={MessageCircle} onClick={() => openWhatsAppManual(lead)} disabled={!hasValue(getLeadWhatsAppNumber(lead))}>Abrir WhatsApp</ActionButton>
            <ActionButton icon={ExternalLink} onClick={() => openInstagramManual(lead)} disabled={!hasValue(lead.instagram)}>Abrir Instagram</ActionButton>
            <ActionButton icon={Mail} onClick={() => openEmailManual(lead)} disabled={!hasValue(lead.correo || lead.email)}>Email manual</ActionButton>
            <ActionButton icon={ExternalLink} onClick={() => window.open(demo.url, "_blank", "noopener,noreferrer")}>Abrir demo</ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "command":
        return renderCommandCenter();
      case "nichos":
        return renderNichos();
      case "today":
        return renderToday();
      case "prospects":
        return renderProspects();
      case "followup":
        return renderFollowup();
      case "calls":
        return renderCalls();
      case "proposals":
        return renderProposals();
      case "review":
        return renderReview();
      case "import":
        return renderImport();
      case "settings":
        return renderSettings();
      default:
        return renderCommandCenter();
    }
  };

  return (
    <main className="min-h-screen bg-[var(--luma-void)] text-[var(--luma-ivory)]">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[var(--luma-void)]/95 px-4 py-3 backdrop-blur-xl xl:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]"
          >
            <Menu size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--luma-ivory)]">{workspaceConfig.brandName}</p>
            <p className="truncate text-xs text-[var(--luma-muted)]">{NAV_ITEMS.find((item) => item.key === activeView)?.label || "Command Center"}</p>
          </div>
          <Badge className="shrink-0 border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">{metrics.ready} listos</Badge>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menu"
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navegacion movil"
              className="fixed left-0 top-0 z-[60] flex h-dvh w-[min(22rem,calc(100vw-2rem))] flex-col border-r border-white/[0.08] bg-[var(--luma-surface)] p-4 shadow-2xl xl:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="rounded-lg border border-[#C7A45A]/[0.18] bg-[#C7A45A]/[0.08] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#C7A45A]/30 bg-black/20 text-[#F5D78C]">
                      <Sparkles size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--luma-ivory)]">{workspaceConfig.brandName}</p>
                      <p className="truncate text-xs text-[var(--luma-muted)]">by {workspaceConfig.companyName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Cerrar menu"
                    onClick={() => setMobileMenuOpen(false)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              <nav className="mt-5 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleMobileNavSelect(item.key)}
                    className={cn("luma-nav-item", activeView === item.key && "luma-nav-item-active")}
                  >
                    <item.icon size={17} />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/[0.14] p-4">
                <p className="luma-kicker">Daily target</p>
                <p className="mt-2 text-2xl font-semibold">{workspaceConfig.defaultDailyContactGoal}</p>
                <p className="mt-1 text-xs text-[var(--luma-muted)]">contactos manuales, sin spam.</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="mx-auto flex w-full max-w-[1720px] gap-6 px-4 py-4 lg:px-6 xl:py-5">
        <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-72 shrink-0 flex-col rounded-lg border border-white/[0.08] bg-[var(--luma-surface)]/[0.92] p-4 xl:flex">
          <div className="rounded-lg border border-[#C7A45A]/[0.18] bg-[#C7A45A]/[0.08] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#C7A45A]/30 bg-black/20 text-[#F5D78C]">
                <Sparkles size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--luma-ivory)]">{workspaceConfig.brandName}</p>
                <p className="text-xs text-[var(--luma-muted)]">by {workspaceConfig.companyName}</p>
              </div>
            </div>
          </div>

          <nav className="mt-5 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveView(item.key)}
                className={cn("luma-nav-item", activeView === item.key && "luma-nav-item-active")}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/[0.14] p-4">
            <p className="luma-kicker">Daily target</p>
            <p className="mt-2 text-2xl font-semibold">{workspaceConfig.defaultDailyContactGoal}</p>
            <p className="mt-1 text-xs text-[var(--luma-muted)]">contactos manuales, sin spam.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="luma-hero">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[#C7A45A]/30 bg-[#C7A45A]/10 text-[#F5D78C]">Local-first &middot; Manual-safe &middot; Multinicho</Badge>
                <Badge className="border-white/10 bg-white/[0.04] text-white/60">by {workspaceConfig.companyName}</Badge>
                <Badge className="border-white/10 bg-white/[0.04] text-white/60">{routeContextLabel}</Badge>
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--luma-ivory)] md:text-6xl">
                {workspaceConfig.brandName}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--luma-muted)]">
                Prospecci&oacute;n asistida, auditor&iacute;a preliminar y seguimiento comercial.
              </p>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <MiniStat label="Leads" value={metrics.total} />
              <MiniStat label="Listos" value={metrics.ready} />
              <MiniStat label="Hoy" value={metrics.contactedToday} />
            </div>
          </header>

          <div className="mt-4 rounded-lg border border-[#C7A45A]/20 bg-[#C7A45A]/[0.08] p-4 text-sm text-[#F5D78C]">
            Esta consola asiste el contacto manual. No env&iacute;a mensajes autom&aacute;ticamente ni usa APIs de WhatsApp.
          </div>

          <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    sheetsSync.connected
                      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                      : "border-amber-300/20 bg-amber-300/10 text-amber-100"
                  }
                >
                  {sheetsSync.connected ? "Conectado a Sheets" : "Modo local fallback"}
                </Badge>
                {sheetsSync.lastSyncAt && (
                  <Badge className="border-white/10 bg-white/[0.04] text-white/60">
                    Ultima sincronizacion: {formatLocalDateTime(sheetsSync.lastSyncAt)}
                  </Badge>
                )}
                {sheetsSync.isSaving && <Badge className="border-sky-300/20 bg-sky-300/10 text-sky-100">Guardando</Badge>}
                {sheetsSync.error && <Badge className="border-red-300/20 bg-red-300/10 text-red-100">Error de sincronizacion</Badge>}
                {Object.keys(dirtyLeadPatches).length > 0 && (
                  <Badge className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">
                    {Object.keys(dirtyLeadPatches).length} cambio(s) pendientes
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton icon={RefreshCw} onClick={() => syncFromSheets()} disabled={sheetsSync.isSyncing}>
                  {sheetsSync.isSyncing ? "Sincronizando" : "Sincronizar desde Google Sheets"}
                </ActionButton>
                <ActionButton icon={Save} variant="gold" onClick={saveDirtyChangesToSheets} disabled={sheetsSync.isSaving}>
                  Guardar cambios en Sheets
                </ActionButton>
              </div>
            </div>
            {sheetsSync.error && <p className="mt-3 text-xs text-red-100/80">{sheetsSync.error}</p>}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="mt-6 pb-16"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {toast && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-50 max-w-lg rounded-lg border px-5 py-4 text-base font-semibold leading-relaxed shadow-2xl",
            toast.type === "success"
              ? "border-emerald-300/20 bg-emerald-950 text-emerald-100"
              : toast.type === "error"
                ? "border-red-300/20 bg-red-950 text-red-100"
                : "border-white/10 bg-[#121820] text-white/75",
          )}
        >
          {toast.message}
        </div>
      )}
      <LeadDetailDrawer
        lead={detailDrawerLead}
        open={Boolean(detailDrawerLead)}
        saving={sheetsSync.isSaving}
        onClose={closeLeadDetail}
        onCopyMessage={(lead) => copyText(getChannelMessage(lead, (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel), "Mensaje recomendado")}
        onOpenWhatsApp={openWhatsAppManual}
        onOpenInstagram={openInstagramManual}
        onCopyEmail={(lead) => copyText(String(lead.correo || lead.email || ""), "Email")}
        onOpenWeb={openWebManual}
        onOpenDemo={(lead) => window.open(getLeadDemo(lead).url, "_blank", "noopener,noreferrer")}
        onPrepareProposal={openProposalPreparation}
        onSave={saveLeadToSheets}
        onUpdateStatus={updateLeadStatus}
        onAssignChannel={assignLeadChannel}
      />
      <PrepareProposalModal
        lead={proposalDraftLead}
        link={proposalDraftLink}
        note={proposalDraftNote}
        saving={sheetsSync.isSaving}
        onLinkChange={setProposalDraftLink}
        onNoteChange={setProposalDraftNote}
        onClose={closeProposalPreparation}
        onSave={saveProposalPreparation}
        onCopyMessage={(lead) => copyText(getChannelMessage(lead, (lead.last_channel || lead.ultimo_canal_usado || getRecommendedChannel(lead)) as RecommendedChannel), "Mensaje de propuesta")}
        onOpenWhatsApp={openWhatsAppManual}
        onOpenInstagram={openInstagramManual}
        onCopyEmail={(lead) => copyText(String(lead.correo || lead.email || ""), "Email")}
        onOpenDemo={(lead) => window.open(getLeadDemo(lead).url, "_blank", "noopener,noreferrer")}
      />
    </main>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
      <p className="luma-kicker">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--luma-muted)]">{value}</p>
    </div>
  );
}

function MessagePreview({
  title,
  value,
  onCopy,
  secondaryAction,
}: {
  title: string;
  value: string;
  onCopy: () => void;
  secondaryAction?: () => void;
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="luma-kicker">{title}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCopy} className="text-white/[0.45] transition hover:text-[var(--luma-gold)]">
            <Copy size={14} />
          </button>
          {secondaryAction && (
            <button type="button" onClick={secondaryAction} className="text-white/[0.45] transition hover:text-[var(--luma-gold)]">
              <Clipboard size={14} />
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 max-h-28 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[var(--luma-muted)]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/[0.35]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">{value}</p>
    </div>
  );
}

function DatasetActivePanel({
  contacts,
  workspace,
  importReport,
}: {
  contacts: Contact[];
  workspace: AppState["workspace"];
  importReport?: ImportReport;
}) {
  const activeNiches =
    workspace?.activeNiches?.length
      ? workspace.activeNiches
      : Array.from(new Set(contacts.map((lead) => resolveLeadNiche(lead))));
  const primaryNiche = workspace?.activeBatchMainNiche || workspace?.lastDetectedNiches?.[0] || activeNiches[0] || "unknown";
  const datasetStatus = contacts.some((lead) => lead.status === "conflicto_contacto")
    ? "con_conflictos"
    : contacts.some(isReviewLead)
      ? "requiere_revision"
      : "limpio";
  const statusCopy = {
    limpio: "limpio",
    con_conflictos: "con conflictos",
    requiere_revision: "requiere revision",
  }[datasetStatus];

  return (
    <div className="luma-panel p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="luma-kicker">Dataset activo</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">{workspace?.lastImportedFileName || "Sin archivo importado"}</h2>
          <p className="mt-2 text-sm text-[var(--luma-muted)]">
            Batch activo: {workspace?.activeBatchName || workspace?.batchName || "Sin batch activo"}
          </p>
        </div>
        <Badge
          className={cn(
            datasetStatus === "limpio" && "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
            datasetStatus === "con_conflictos" && "border-red-300/20 bg-red-300/10 text-red-100",
            datasetStatus === "requiere_revision" && "border-amber-300/20 bg-amber-300/10 text-amber-100",
          )}
        >
          Estado: {statusCopy}
        </Badge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Modo importacion" value={workspace?.lastImportMode ? (workspace.lastImportMode === "append" ? "Agregar" : "Reemplazar") : "Sin modo"} />
        <MiniStat label="Fecha/hora importacion" value={formatLocalDateTime(workspace?.lastImportDate)} />
        <MiniStat label="Total importado" value={workspace?.activeLeadCount ?? contacts.length} />
        <MiniStat label="Filas validas" value={workspace?.lastValidRows ?? importReport?.imported ?? contacts.length} />
        <MiniStat label="Filas ignoradas" value={workspace?.lastIgnoredRows ?? importReport?.ignoredRows ?? 0} />
        <MiniStat label="Nicho principal detectado" value={getNicheDefinition(primaryNiche).shortLabel} />
        <MiniStat label="Archivo origen lote" value={workspace?.activeBatchSourceFile || workspace?.lastImportedFileName || "Sin archivo"} />
        <MiniStat label="Filas leidas" value={workspace?.lastRowsRead ?? importReport?.rowsRead ?? 0} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {activeNiches.length === 0 ? (
          <Badge className="border-white/10 bg-white/[0.04] text-white/60">Sin nichos activos</Badge>
        ) : (
          activeNiches.map((niche) => (
            <Badge key={niche} className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">
              {getNicheDefinition(niche).shortLabel}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

function ImportHistoryPanel({ history }: { history: ImportHistoryItem[] }) {
  return (
    <div className="luma-panel p-6">
      <p className="luma-kicker">Historial de importaciones</p>
      <h3 className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">Archivos cargados en esta consola</h3>
      {history.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--luma-muted)]">Aun no hay importaciones confirmadas en localStorage.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {history.slice(0, 8).map((item) => (
            <div key={`${item.file_name}-${item.imported_at}`} className="rounded-lg border border-white/[0.08] bg-black/10 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="break-all text-sm font-semibold text-[var(--luma-ivory)]">{item.file_name}</p>
                  <p className="mt-1 text-xs text-[var(--luma-muted)]">
                    {formatLocalDateTime(item.imported_at)} - {item.mode === "append" ? "Agregar" : "Reemplazar"} - {item.batch_name}
                  </p>
                </div>
                <Badge className="border-white/10 bg-white/[0.04] text-white/60">{item.resulting_total} total</Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniStat label="Filas leidas" value={item.rows_read} />
                <MiniStat label="Validas" value={item.valid_rows} />
                <MiniStat label="Ignoradas" value={item.ignored_rows} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.detected_niches.map((niche) => (
                  <Badge key={niche} className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">
                    {getNicheDefinition(niche).shortLabel}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="luma-kicker">{kicker}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--luma-ivory)]">{title}</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-[var(--luma-muted)]">{body}</p>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition",
        active
          ? "border-[#C7A45A]/[0.35] bg-[#C7A45A]/[0.12] text-[#F5D78C]"
          : "border-white/10 bg-white/[0.04] text-white/[0.55] hover:bg-white/[0.07]",
      )}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-[#C7A45A]/[0.35] bg-[#C7A45A]/[0.12] text-[#F5D78C]"
          : "border-white/10 bg-white/[0.035] text-white/[0.52] hover:bg-white/[0.07]",
      )}
    >
      {children}
    </button>
  );
}

function WorkspaceSummary({
  contacts,
  workspace,
  onExport,
  onClear,
}: {
  contacts: Contact[];
  workspace: AppState["workspace"];
  onExport: () => void;
  onClear: () => void;
}) {
  const activeNiches =
    workspace?.activeNiches?.length
      ? workspace.activeNiches
      : Array.from(new Set(contacts.map((lead) => resolveLeadNiche(lead))));

  return (
    <div className="luma-panel p-6">
      <p className="luma-kicker">Gestion del workspace local</p>
      <h3 className="mt-2 text-xl font-semibold text-[var(--luma-ivory)]">Ver dataset activo</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Leads cargados" value={contacts.length} />
        <MiniStat label="Ultimo modo" value={workspace?.lastImportMode ? (workspace.lastImportMode === "append" ? "Agregar" : "Reemplazar") : "Sin modo"} />
        <MiniStat label="Ultimo archivo" value={workspace?.lastImportedFileName || "Sin importar"} />
        <MiniStat
          label="Fecha importacion"
          value={formatLocalDateTime(workspace?.lastImportDate)}
        />
        <MiniStat label="Filas validas" value={workspace?.lastValidRows ?? contacts.length} />
        <MiniStat label="Filas ignoradas" value={workspace?.lastIgnoredRows ?? 0} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {activeNiches.length === 0 ? (
          <Badge className="border-white/10 bg-white/[0.04] text-white/60">Sin nichos activos</Badge>
        ) : (
          activeNiches.map((niche) => (
            <Badge key={niche} className="border-[#C7A45A]/25 bg-[#C7A45A]/10 text-[#F5D78C]">
              {getNicheDefinition(niche).shortLabel}
            </Badge>
          ))
        )}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[var(--luma-muted)]">
        Esto no borra tus archivos originales. Solo limpia la consola local.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <ActionButton icon={Download} variant="gold" onClick={onExport} disabled={contacts.length === 0}>
          Exportar estado actualizado
        </ActionButton>
        <ActionButton icon={Download} onClick={onExport} disabled={contacts.length === 0}>
          Exportar backup antes de limpiar
        </ActionButton>
        <ActionButton icon={RefreshCw} variant="danger" onClick={onClear}>
          Limpiar workspace local
        </ActionButton>
      </div>
    </div>
  );
}
