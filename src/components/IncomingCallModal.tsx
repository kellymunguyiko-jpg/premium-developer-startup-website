import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import type { CallInvite } from "../services/calls";

interface IncomingCallModalProps {
  call: CallInvite;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({
  call,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Simple ringtone via Web Audio API oscillator pattern
    let ctx: AudioContext | null = null;
    let interval: number | null = null;
    try {
      ctx = new AudioContext();
      const beep = () => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      };
      beep();
      interval = window.setInterval(beep, 1400);
    } catch {
      /* autoplay restrictions */
    }

    return () => {
      if (interval) window.clearInterval(interval);
      void ctx?.close();
      audioRef.current = null;
    };
  }, [call.channel]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-green-500/30 bg-[#0d1210] p-6 text-center shadow-2xl shadow-green-900/40">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20 text-green-400">
          <Video className="h-8 w-8 animate-pulse" />
        </div>

        <img
          src={
            call.fromPhoto ||
            `https://api.dicebear.com/9.x/avataaars/svg?seed=${call.fromUid}&backgroundColor=166534`
          }
          alt={call.fromName}
          className="mx-auto h-20 w-20 rounded-full ring-4 ring-green-600/40"
        />

        <h2 className="mt-4 text-lg font-black text-white">{call.fromName}</h2>
        <p className="mt-1 text-sm text-green-400">Incoming video call…</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Camera + microphone will turn on · Free limit 1:30 after accept
        </p>

        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={onDecline}
            className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500"
            title="Decline"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            onClick={onAccept}
            className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-900/40 transition hover:bg-green-500"
            title="Accept"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-10 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          <span>Decline</span>
          <span>Accept</span>
        </div>
      </div>
    </div>
  );
}
