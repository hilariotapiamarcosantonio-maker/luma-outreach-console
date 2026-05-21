export type NicheKey =
  | "real_estate"
  | "developers"
  | "academy"
  | "beauty"
  | "route_products"
  | "printing_graphics"
  | "professional_services"
  | "b2b_services"
  | "unknown";

export type RecommendedChannel =
  | "whatsapp"
  | "instagram"
  | "email"
  | "linkedin"
  | "llamada"
  | "web"
  | "manual"
  | "sin_canal";
export type ImportMode = "replace" | "append";

export type ContactStatus =
  | "pending"
  | "listo_contacto"
  | "sin_accion_por_ahora"
  | "contacted"
  | "replied"
  | "respondio"
  | "interested"
  | "follow_up"
  | "appointment"
  | "call"
  | "diagnostico"
  | "reunion_pendiente"
  | "proposal_sent"
  | "propuesta_enviada"
  | "negotiating"
  | "closed"
  | "lost"
  | "not_interested"
  | "needs_review"
  | "sin_canal"
  | "datos_incompletos"
  | "conflicto_contacto"
  | "mensaje_faltante"
  | "buscar_canal"
  | "discarded"
  | "referred"
  | "sending"
  | "failed";

export interface Contact {
  id: string;

  // Legacy compatibility fields.
  name: string;
  businessName?: string;
  priority?: string;
  phone: string;
  status: ContactStatus;
  lastContactDate?: string;
  nextStep?: string;
  notes?: string;
  suggestedMessage?: string;
  painPoint?: string;
  contactAngle?: string;
  sourceUrl?: string;
  email?: string;
  instagram?: string;
  city?: string;
  sourceFile?: string;
  importedRow?: number;
  imported_at?: string;
  variables: Record<string, unknown>;
  sentCount: number;

  // Unified lead fields for Luma Outreach Console.
  nicho?: NicheKey | string;
  prioridad?: string;
  nombre_negocio?: string;
  nombre_persona?: string;
  cargo_rol?: string;
  empresa_marca?: string;
  web?: string;
  audit_domain?: string;
  audit_slug?: string;
  reporte_luma?: string;
  whatsapp?: string;
  telefono?: string;
  correo?: string;
  facebook?: string;
  linkedin?: string;
  ciudad_zona?: string;
  fuente_dato?: string;
  fuente_auditoria?: string;
  senal_comercial?: string;
  dolor_probable?: string;
  oportunidad_visible?: string;
  oferta_recomendada?: string;
  angulo_contacto?: string;
  mensaje_whatsapp?: string;
  mensaje_instagram?: string;
  asunto_email?: string;
  mensaje_email?: string;
  mensaje_recomendado_safe?: string;
  estado?: ContactStatus | string;
  tipo_respuesta?: string;
  proximo_paso?: string;
  fecha_contacto?: string;
  fecha_seguimiento?: string;
  notas?: string;
  score_interno?: string | number;
  score_captacion?: string | number;
  score_autoridad?: string | number;
  score_medicion?: string | number;
  score_seguimiento?: string | number;
  score_mobile?: string | number;
  ultimo_canal_usado?: RecommendedChannel | string;
  cantidad_contactos?: number;
  fecha_ultima_actualizacion?: string;
  atributos_nicho_json?: string;
  metricas_publicas_json?: string;
  audit_raw_ref?: string;
  csv_raw_ref?: string;
  batch_name?: string;
  imported_file_name?: string;
  followup_due_date?: string;
  last_interaction_date?: string;
  attempt_count?: number;
  last_channel?: RecommendedChannel | string;
  conversation_summary?: string;
  propuesta_link?: string;
  material_link?: string;
  monto_estimado?: string | number;
  fecha_propuesta?: string;
  decision_status?: string;
  active_batch_name?: string;
  active_batch_created_at?: string;
  active_batch_order?: number;
}

export interface SendConfig {
  minDelay: number;
  maxDelay: number;
  batchSize: number;
  batchDelay: number;
  maxSessionSends: number;
  skipAlreadyContacted: boolean;
  useSuggestedMessage: boolean;
}

export interface ImportReport {
  fileName: string;
  sheetName?: string;
  rowsRead: number;
  totalRows: number;
  imported: number;
  updated: number;
  skippedEmpty: number;
  skippedNoPhone: number;
  skippedHeaderLike: number;
  skippedStructural: number;
  skippedTooEmpty: number;
  preservedStatuses: number;
  headerRow: number;
  detectedColumns: string[];
  ignoredRows: number;
  channelCounts: Record<RecommendedChannel, number>;
  nichesDetected: string[];
  possibleTrashRows: string[];
}

export interface ImportHistoryItem {
  file_name: string;
  imported_at: string;
  mode: ImportMode;
  rows_read: number;
  valid_rows: number;
  ignored_rows: number;
  resulting_total: number;
  detected_niches: string[];
  batch_name: string;
}

export interface WorkspaceMeta {
  activeLeadCount: number;
  lastImportedFileName?: string;
  lastImportDate?: string;
  lastImportMode?: ImportMode;
  activeNiches: string[];
  batchName?: string;
  lastRowsRead?: number;
  lastValidRows?: number;
  lastIgnoredRows?: number;
  lastDetectedNiches?: string[];
  datasetStatus?: "limpio" | "con_conflictos" | "requiere_revision";
  activeBatchName?: string;
  activeBatchCreatedAt?: string;
  activeBatchSourceFile?: string;
  activeBatchMainNiche?: string;
  activeBatchLeadIds?: string[];
}

export interface AppState {
  contacts: Contact[];
  template: string;
  config: SendConfig;
  isPaused: boolean;
  isSending: boolean;
  currentIndex: number;
  sessionSentCount: number;
  sourceFileName?: string;
  campaignName?: string;
  importReport?: ImportReport;
  importHistory?: ImportHistoryItem[];
  workspace?: WorkspaceMeta;
}
