import { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Clock } from "lucide-react";
import { VIDEO_CALL_LIMIT_SEC } from "../types/notifications";
import {
  endCall as endCallDoc,
  markMissedIfStillRinging,
  listenCallStatus,
} from "../services/calls";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

interface VideoCallModalProps {
  open: boolean;
  channel: string;
  isCaller: boolean;
  me: { uid: string; displayName: string; photoURL: string | null };
  peer: { uid: string; displayName: string; photoURL: string | null };
  onClose: () => void;
}

export function VideoCallModal({
  open,
  channel,
  isCaller,
  me,
  peer,
  onClose,
}: VideoCallModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(VIDEO_CALL_LIMIT_SEC);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteJoined, setRemoteJoined] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const localViewRef = useRef<HTMLDivElement>(null);
  const remoteViewRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    endedRef.current = false;
    setSecondsLeft(VIDEO_CALL_LIMIT_SEC);
    setError(null);
    setJoined(false);
    setRemoteJoined(false);

    let cancelled = false;

    // Watch remote hangup / decline
    const unsubStatus = listenCallStatus(channel, (call) => {
      if (call.status === "declined" && isCaller) {
        setError("Call was declined");
        void endCall(true, false);
      }
      if (call.status === "ended" && !endedRef.current) {
        void endCall(true, false);
      }
    });

    const start = async () => {
      if (!APP_ID) {
        setError("Missing VITE_AGORA_APP_ID");
        return;
      }
      try {
        // Request browser camera + microphone permissions first
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          // release probe stream — Agora will re-acquire devices
          stream.getTracks().forEach((t) => t.stop());
        } catch (permErr) {
          console.error(permErr);
          setError(
            "Camera or microphone permission denied. Allow camera & sound, then try again."
          );
          return;
        }

        AgoraRTC.setLogLevel(3);
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") {
            const el = remoteViewRef.current;
            if (el) {
              el.innerHTML = "";
              user.videoTrack?.play(el, { fit: "cover" });
            }
            setRemoteJoined(true);
          }
          if (mediaType === "audio") {
            user.audioTrack?.setVolume(100);
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", (user: IAgoraRTCRemoteUser) => {
          if (!user.hasVideo) setRemoteJoined(false);
        });

        client.on("user-left", () => setRemoteJoined(false));

        // numeric uid from string hash
        const uidNum =
          Math.abs(
            Array.from(me.uid).reduce((a, c) => a + c.charCodeAt(0), 0)
          ) % 100000000;

        await client.join(APP_ID, channel, null, uidNum);
        if (cancelled) return;

        // Explicitly enable camera + microphone tracks
        const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            AEC: true,
            ANS: true,
            AGC: true,
          },
          {
            encoderConfig: "480p_1",
            facingMode: "user",
          }
        );
        await mic.setEnabled(true);
        await cam.setEnabled(true);
        localAudioRef.current = mic;
        localVideoRef.current = cam;
        setMicOn(true);
        setCamOn(true);

        if (localViewRef.current) {
          localViewRef.current.innerHTML = "";
          cam.play(localViewRef.current, { fit: "cover" });
        }

        await client.publish([mic, cam]);
        setJoined(true);

        timerRef.current = window.setInterval(() => {
          setSecondsLeft((s) => {
            if (s <= 1) {
              void endCall(false);
              return 0;
            }
            return s - 1;
          });
        }, 1000);
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : String(e);
        if (/NotAllowed|Permission|Denied/i.test(msg)) {
          setError(
            "Please allow Camera and Microphone in your browser settings for video call."
          );
        } else if (/NotFound|Device/i.test(msg)) {
          setError("No camera or microphone found on this device.");
        } else {
          setError(msg || "Failed to start video call.");
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      unsubStatus();
      void cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, channel]);

  const cleanup = async () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      localAudioRef.current?.stop();
      localAudioRef.current?.close();
      localVideoRef.current?.stop();
      localVideoRef.current?.close();
      localAudioRef.current = null;
      localVideoRef.current = null;
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
    } catch {
      /* ignore */
    }
  };

  const endCall = async (manual: boolean, markEnd = true) => {
    if (endedRef.current) return;
    endedRef.current = true;

    // If caller and remote never joined → missed call notification
    if (isCaller && !remoteJoined && manual) {
      await markMissedIfStillRinging({
        channel,
        fromUid: me.uid,
        fromName: me.displayName,
        fromPhoto: me.photoURL,
        toUid: peer.uid,
      });
    } else if (markEnd) {
      await endCallDoc(channel);
    }

    await cleanup();
    onClose();
  };

  const toggleMic = async () => {
    const track = localAudioRef.current;
    if (!track) return;
    const next = !micOn;
    await track.setEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    const track = localVideoRef.current;
    if (!track) return;
    const next = !camOn;
    await track.setEnabled(next);
    setCamOn(next);
    if (next && localViewRef.current) {
      localViewRef.current.innerHTML = "";
      track.play(localViewRef.current, { fit: "cover" });
    }
  };

  if (!open) return null;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowTime = secondsLeft <= 15;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0f0c]">
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        <div>
          <p className="text-sm font-bold text-white">
            Video call · {peer.displayName}
          </p>
          <p className="text-[11px] text-slate-400">
            Camera + sound enabled · Free limit 1:30 ·{" "}
            {remoteJoined ? "Connected" : "Waiting…"}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            lowTime
              ? "bg-red-500/20 text-red-300"
              : "bg-green-500/20 text-green-300"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          {mm}:{ss}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={remoteViewRef}
          className="absolute inset-0 bg-slate-900"
        />
        {!remoteJoined && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <img
              src={
                peer.photoURL ||
                `https://api.dicebear.com/9.x/avataaars/svg?seed=${peer.uid}&backgroundColor=166534`
              }
              alt=""
              className="h-20 w-20 rounded-full ring-4 ring-green-600/30"
            />
            <p className="text-sm font-bold text-white">{peer.displayName}</p>
            <p className="text-xs text-slate-400">
              {isCaller ? "Calling…" : "Connecting…"}
            </p>
          </div>
        )}

        <div
          ref={localViewRef}
          className="absolute bottom-4 right-4 h-36 w-28 overflow-hidden rounded-xl border-2 border-green-500/40 bg-black shadow-xl sm:h-44 sm:w-32"
        />
      </div>

      {error && (
        <div className="bg-red-500/20 px-4 py-2 text-center text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-[#0d1210] px-4 py-4">
        <button
          onClick={() => void toggleMic()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={() => void toggleCam()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          title={camOn ? "Camera off" : "Camera on"}
        >
          {camOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={() => void endCall(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500"
          title="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
        <span className="text-[11px] text-slate-500">
          {joined ? "Live" : "Starting…"}
        </span>
      </div>
    </div>
  );
}
