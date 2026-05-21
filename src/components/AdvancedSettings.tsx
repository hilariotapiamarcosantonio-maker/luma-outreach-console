"use client";

import React from "react";
import { Shield, Zap, Timer, Layers, Filter, MessageSquareDashed } from "lucide-react";
import { SendConfig } from "@/types";
import { cn } from "@/lib/utils";

interface AdvancedSettingsProps {
  config: SendConfig;
  onChange: (config: SendConfig) => void;
}

export const AdvancedSettings = ({ config, onChange }: AdvancedSettingsProps) => {
  return (
    <div className="glass-card flex flex-col gap-6">
      <h2 className="text-xl font-bold flex items-center gap-2 text-white">
        <Shield className="text-[#25D366]" size={24} />
        Filtros y Seguridad
      </h2>

      <div className="space-y-6">
        {/* Toggle: Skip Already Contacted */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer" 
             onClick={() => onChange({ ...config, skipAlreadyContacted: !config.skipAlreadyContacted })}>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sm text-white/90 flex items-center gap-2">
              <Filter size={16} className="text-blue-400" />
              Evitar Duplicados
            </span>
            <span className="text-[11px] text-white/40">
              No enviar mensajes a leads ya contactados.
            </span>
          </div>
          <div className={cn(
            "w-10 h-5 rounded-full transition-all relative",
            config.skipAlreadyContacted ? "bg-[#25D366]" : "bg-white/10"
          )}>
            <div className={cn(
              "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
              config.skipAlreadyContacted ? "right-1" : "left-1"
            )} />
          </div>
        </div>

        {/* Toggle: Use Suggested Message */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
             onClick={() => onChange({ ...config, useSuggestedMessage: !config.useSuggestedMessage })}>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sm text-white/90 flex items-center gap-2">
              <MessageSquareDashed size={16} className="text-purple-400" />
              Usar Mensajes del Tracker
            </span>
            <span className="text-[11px] text-white/40">
              Prioriza el mensaje sugerido de tu Excel sobre la plantilla general.
            </span>
          </div>
          <div className={cn(
            "w-10 h-5 rounded-full transition-all relative",
            config.useSuggestedMessage ? "bg-[#25D366]" : "bg-white/10"
          )}>
            <div className={cn(
              "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
              config.useSuggestedMessage ? "right-1" : "left-1"
            )} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Timer size={14} />
            Intervalo de Seguridad (seg)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-white/40">Mínimo</span>
              <input
                type="number"
                value={config.minDelay}
                onChange={(e) => onChange({ ...config, minDelay: Number(e.target.value) })}
                className="input-field py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-white/40">Máximo</span>
              <input
                type="number"
                value={config.maxDelay}
                onChange={(e) => onChange({ ...config, maxDelay: Number(e.target.value) })}
                className="input-field py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} />
            Pausas por Lotes
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-white/40">Tamaño del Lote</span>
              <input
                type="number"
                value={config.batchSize}
                onChange={(e) => onChange({ ...config, batchSize: Number(e.target.value) })}
                className="input-field py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-white/40">Espera (seg)</span>
              <input
                type="number"
                value={config.batchDelay}
                onChange={(e) => onChange({ ...config, batchDelay: Number(e.target.value) })}
                className="input-field py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} />
            Limite de prueba por sesion
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={config.maxSessionSends}
            onChange={(e) => onChange({ ...config, maxSessionSends: Number(e.target.value) })}
            className="input-field py-2 text-sm"
          />
          <p className="text-[11px] text-white/40">
            Para hoy dejalo entre 3 y 5. El sistema se detiene solo al llegar al limite.
          </p>
        </div>
      </div>
    </div>
  );
};
