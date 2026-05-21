"use client";

import React from "react";
import { CheckCircle2, ExternalLink, Pause, Play, Settings2, Square, Trash2 } from "lucide-react";

interface ControlPanelProps {
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onClear: () => void;
  isSending: boolean;
  isPaused: boolean;
  progress: number;
  total: number;
  activeContactName?: string;
  blockedContactName?: string;
  isCoolingDown: boolean;
  sessionSentCount: number;
  sessionLimit: number;
  onMarkSent: () => void;
  onOpenBlocked: () => void;
}

export const ControlPanel = ({
  onStart,
  onPause,
  onStop,
  onClear,
  isSending,
  isPaused,
  progress,
  total,
  activeContactName,
  blockedContactName,
  isCoolingDown,
  sessionSentCount,
  sessionLimit,
  onMarkSent,
  onOpenBlocked,
}: ControlPanelProps) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="glass-card flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings2 className="text-[#25D366]" size={24} />
          Panel de Control
        </h2>
        <div className="text-sm text-white/50">
          {progress} / {total} Completados
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-white/45">
        <span className="rounded-full bg-white/5 px-3 py-1">
          Sesion: {sessionSentCount} / {sessionLimit}
        </span>
        {isCoolingDown && (
          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-yellow-300">
            Pausa de seguridad activa
          </span>
        )}
      </div>

      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-[#25D366] h-full transition-all duration-500 shadow-[0_0_10px_rgba(37,211,102,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!isSending || isPaused ? (
          <button onClick={onStart} className="btn-primary">
            <Play size={20} fill="currentColor" />
            {isPaused ? "Reanudar" : "Comenzar"}
          </button>
        ) : (
          <button onClick={onPause} className="btn-primary bg-yellow-500 hover:bg-yellow-600">
            <Pause size={20} fill="currentColor" />
            Pausar
          </button>
        )}

        <button 
          onClick={onStop} 
          disabled={!isSending}
          className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 py-3 px-6 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Square size={20} fill="currentColor" />
          Detener
        </button>

        <button 
          onClick={onClear}
          disabled={isSending}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 py-3 px-6 rounded-xl transition-all disabled:opacity-30"
        >
          <Trash2 size={20} />
          Limpiar
        </button>
      </div>

      {activeContactName && (
        <div className="rounded-xl border border-[#25D366]/20 bg-[#25D366]/10 p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold text-[#25D366]">Ventana abierta: {activeContactName}</p>
            <p className="text-xs text-white/45 mt-1">
              Cuando cierres la ventana de WhatsApp, se marca como contactado y se prepara el siguiente.
            </p>
          </div>
          <button onClick={onMarkSent} className="btn-primary py-2 px-4 w-fit">
            <CheckCircle2 size={18} />
            Marcar enviado y continuar
          </button>
        </div>
      )}

      {blockedContactName && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold text-red-300">El navegador bloqueo la ventana para {blockedContactName}</p>
            <p className="text-xs text-white/45 mt-1">
              Abrela con este boton y permite pop-ups para localhost si quieres que el flujo continue solo.
            </p>
          </div>
          <button onClick={onOpenBlocked} className="flex w-fit items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15">
            <ExternalLink size={18} />
            Abrir WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};
