"use client";

import React from "react";
import { 
  Users, 
  UserPlus, 
  FileUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  MessageSquare,
  Calendar,
  Phone,
  UserX,
  Share2,
  ArrowRight
} from "lucide-react";
import { Contact, ContactStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ContactListProps {
  contacts: Contact[];
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
}

export const STATUS_CONFIG: Partial<
  Record<ContactStatus, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }>
> = {
  pending: { label: "Pendiente", color: "text-white/40 bg-white/5", icon: Clock },
  sin_accion_por_ahora: { label: "Sin accion por ahora", color: "text-white/40 bg-white/5", icon: Clock },
  contacted: { label: "Contactado", color: "text-blue-400 bg-blue-400/10", icon: MessageSquare },
  interested: { label: "Interesado", color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle2 },
  follow_up: { label: "Seguimiento", color: "text-yellow-400 bg-yellow-400/10", icon: ArrowRight },
  appointment: { label: "Cita Agendada", color: "text-purple-400 bg-purple-400/10", icon: Calendar },
  call: { label: "Llamada Programada", color: "text-orange-400 bg-orange-400/10", icon: Phone },
  replied: { label: "Respondió", color: "text-green-400 bg-green-400/10", icon: CheckCircle2 },
  not_interested: { label: "No Interesado", color: "text-red-400 bg-red-400/10", icon: UserX },
  referred: { label: "Referido", color: "text-cyan-400 bg-cyan-400/10", icon: Share2 },
  sending: { label: "Enviando", color: "text-[#25D366] bg-[#25D366]/10", icon: Loader2 },
  failed: { label: "Falló", color: "text-red-500 bg-red-500/10", icon: XCircle },
};

export const ContactList = ({ 
  contacts, 
  onImport, 
  onAdd, 
  onSelectContact, 
  selectedContactId 
}: ContactListProps) => {
  
  return (
    <div className="glass-card flex flex-col gap-4 h-full min-h-[600px]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <Users className="text-[#25D366]" size={24} />
          Prospectos ({contacts.length})
        </h2>
        <div className="flex gap-2">
          <label className="bg-white/5 hover:bg-white/10 p-2 rounded-lg cursor-pointer transition-all border border-white/10 group">
            <FileUp size={20} className="group-hover:text-[#25D366]" />
            <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={onImport} />
          </label>
          <button onClick={onAdd} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-all border border-white/10 group">
            <UserPlus size={20} className="group-hover:text-[#25D366]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/10 gap-4">
            <Users size={80} strokeWidth={0.5} />
            <p className="text-lg font-medium">No hay prospectos cargados</p>
            <p className="text-sm opacity-50">Importa tu tracker de WhatsApp para comenzar</p>
          </div>
        ) : (
          contacts.map((contact) => {
            const config = STATUS_CONFIG[contact.status] || STATUS_CONFIG.pending!;
            const Icon = config.icon;

            return (
              <button 
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={cn(
                  "w-full flex flex-col gap-3 p-4 rounded-2xl border transition-all text-left group",
                  selectedContactId === contact.id 
                    ? "bg-[#25D366]/10 border-[#25D366]/40 shadow-[0_0_20px_rgba(37,211,102,0.1)]" 
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                )}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-bold text-white/90 group-hover:text-white transition-colors truncate max-w-[200px]">
                      {contact.name || contact.businessName || "Sin nombre"}
                    </span>
                    <span className="text-xs text-white/30 font-mono">{contact.phone}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    config.color
                  )}>
                    <Icon size={12} className={contact.status === 'sending' ? 'animate-spin' : ''} />
                    {config.label}
                  </div>
                </div>

                {contact.businessName && contact.businessName !== contact.name && (
                  <div className="text-[11px] text-white/40 italic truncate">
                    {contact.businessName}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex gap-2">
                    {contact.sentCount > 0 && (
                      <span className="text-[9px] bg-[#25D366]/20 text-[#25D366] px-1.5 py-0.5 rounded uppercase font-bold">
                        {contact.sentCount} Envío(s)
                      </span>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-white/20 group-hover:text-[#25D366] transition-colors" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
