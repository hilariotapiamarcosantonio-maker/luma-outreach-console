"use client";

import React from "react";
import { MessageSquare, Info } from "lucide-react";

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  availableVariables: string[];
}

export const TemplateEditor = ({ value, onChange, availableVariables }: TemplateEditorProps) => {
  return (
    <div className="glass-card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="text-[#25D366]" size={24} />
          Plantilla del Mensaje
        </h2>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe tu mensaje aquí... Usa [Nombre] para personalizar."
        className="input-field min-h-[200px] resize-none text-lg leading-relaxed"
      />

      <div className="flex flex-wrap gap-2 mt-2">
        {availableVariables.map((variable) => (
          <button
            key={variable}
            onClick={() => onChange(value + ` [${variable}]`)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-full text-xs transition-all text-white/60"
          >
            + {variable}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-300 text-sm">
        <Info size={18} className="shrink-0 mt-0.5" />
        <p>
          Consejo: Usa variaciones en tus mensajes para evitar que WhatsApp detecte patrones de spam.
        </p>
      </div>
    </div>
  );
};
