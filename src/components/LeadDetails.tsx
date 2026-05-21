"use client";

import React from "react";
import { 
  X, 
  ExternalLink, 
  MessageSquare, 
  Target, 
  AlertCircle,
  Link as LinkIcon,
  StickyNote
} from "lucide-react";
import { Contact, ContactStatus } from "@/types";
import { STATUS_CONFIG } from "./ContactList";
import { cn } from "@/lib/utils";

interface LeadDetailsProps {
  contact: Contact | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ContactStatus) => void;
  onSaveNotes: (id: string, notes: string) => void;
}

export const LeadDetails = ({ contact, onClose, onUpdateStatus, onSaveNotes }: LeadDetailsProps) => {
  if (!contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-white/20">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white">{contact.name || "Detalles del Lead"}</h2>
            <p className="text-white/40 text-sm">{contact.businessName || "Empresa no especificada"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(STATUS_CONFIG) as ContactStatus[]).filter(s => s !== 'sending' && s !== 'failed').map((status) => {
              const cfg = STATUS_CONFIG[status];
              if (!cfg) return null;
              const isSelected = contact.status === status;
              return (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(contact.id, status)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    isSelected 
                      ? "bg-[#25D366]/20 border-[#25D366]/50 text-[#25D366]" 
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-white/50"
                  )}
                >
                  <cfg.icon size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Audit Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} />
                Dolor Probable
              </h3>
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-200/70 leading-relaxed italic">
                {contact.painPoint || "No hay observaciones internas cargadas."}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} />
                Ángulo de Contacto
              </h3>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-sm text-blue-200/70 leading-relaxed italic">
                {contact.contactAngle || "Pendiente de definir ángulo comercial."}
              </div>
            </div>
          </div>

          {/* Suggested Message */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={14} />
              Mensaje Sugerido (Personalizado)
            </h3>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
              {contact.suggestedMessage || "Carga un mensaje sugerido desde el tracker."}
            </div>
          </div>

          {/* Links and Source */}
          <div className="flex flex-wrap gap-4">
            {contact.sourceUrl && (
              <a 
                href={contact.sourceUrl} 
                target="_blank" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/10 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-all"
              >
                <LinkIcon size={14} />
                Ver Perfil / Auditoría
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
              <StickyNote size={14} />
              Notas Internas
            </h3>
            <textarea
              defaultValue={contact.notes}
              onBlur={(e) => onSaveNotes(contact.id, e.target.value)}
              placeholder="Anota detalles de la llamada, objeciones o próximos pasos..."
              className="input-field min-h-[120px] text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
          <button onClick={onClose} className="btn-primary py-2 px-8">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
