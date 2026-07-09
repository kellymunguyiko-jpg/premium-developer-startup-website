import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { pushNotification } from "./notifications";

export type CallStatus =
  | "ringing"
  | "accepted"
  | "declined"
  | "missed"
  | "ended";

export interface CallInvite {
  channel: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string | null;
  toUid: string;
  toName?: string;
  toPhoto?: string | null;
  status: CallStatus;
  createdAt: number;
  answeredAt?: number;
  endedAt?: number;
}

const localCallKey = (channel: string) => `devspace-call-${channel}`;
const RING_BROADCAST = "devspace-call-ring";

function saveLocalCall(call: CallInvite) {
  try {
    localStorage.setItem(localCallKey(call.channel), JSON.stringify(call));
    // notify same-browser other tabs
    localStorage.setItem(
      RING_BROADCAST,
      JSON.stringify({ ...call, _ts: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

function readLocalCall(channel: string): CallInvite | null {
  try {
    const raw = localStorage.getItem(localCallKey(channel));
    return raw ? (JSON.parse(raw) as CallInvite) : null;
  } catch {
    return null;
  }
}

export async function createCallInvite(data: {
  channel: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string | null;
  toUid: string;
  toName?: string;
  toPhoto?: string | null;
}): Promise<CallInvite> {
  const payload: CallInvite = {
    ...data,
    status: "ringing",
    createdAt: Date.now(),
  };

  try {
    await setDoc(doc(db, "calls", data.channel), payload, { merge: true });
  } catch (e) {
    console.warn("createCallInvite firestore fallback", e);
  }
  saveLocalCall(payload);

  await pushNotification({
    toUid: data.toUid,
    fromUid: data.fromUid,
    fromName: data.fromName,
    fromPhoto: data.fromPhoto,
    type: "video_call",
    title: "Incoming video call",
    body: `${data.fromName} is calling you`,
    meta: { channel: data.channel },
  });

  return payload;
}

export async function updateCallStatus(
  channel: string,
  status: CallStatus,
  extra: Partial<CallInvite> = {}
) {
  const patch = {
    status,
    ...extra,
    ...(status === "accepted" ? { answeredAt: Date.now() } : {}),
    ...(status === "ended" || status === "missed" || status === "declined"
      ? { endedAt: Date.now() }
      : {}),
  };

  try {
    await updateDoc(doc(db, "calls", channel), patch);
  } catch {
    try {
      await setDoc(doc(db, "calls", channel), patch, { merge: true });
    } catch (e) {
      console.warn("updateCallStatus fallback", e);
    }
  }

  const prev = readLocalCall(channel);
  if (prev) {
    saveLocalCall({ ...prev, ...patch, channel: prev.channel });
  } else {
    saveLocalCall({
      channel,
      fromUid: "",
      fromName: "",
      fromPhoto: null,
      toUid: "",
      createdAt: Date.now(),
      ...patch,
      status,
    } as CallInvite);
  }
}

export async function acceptCall(channel: string) {
  await updateCallStatus(channel, "accepted");
}

export async function declineCall(call: CallInvite) {
  await updateCallStatus(call.channel, "declined");
  // optional notify caller via notification
  await pushNotification({
    toUid: call.fromUid,
    fromUid: call.toUid,
    fromName: call.toName || "User",
    fromPhoto: call.toPhoto || null,
    type: "missed_video_call",
    title: "Call declined",
    body: `${call.toName || "User"} declined your video call`,
    meta: { channel: call.channel },
  });
}

export async function endCall(channel: string) {
  await updateCallStatus(channel, "ended");
}

export async function markMissedIfStillRinging(call: {
  channel: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string | null;
  toUid: string;
}) {
  const local = readLocalCall(call.channel);
  if (local && local.status !== "ringing") return;

  // best effort: only mark missed if still ringing
  await updateCallStatus(call.channel, "missed");
  await pushNotification({
    toUid: call.toUid,
    fromUid: call.fromUid,
    fromName: call.fromName,
    fromPhoto: call.fromPhoto,
    type: "missed_video_call",
    title: "Missed video call",
    body: `You missed a video call from ${call.fromName}`,
    meta: { channel: call.channel },
  });
}

/** Listen for incoming ringing calls for this user */
export function listenIncomingCalls(
  uid: string,
  onRing: (call: CallInvite) => void
): () => void {
  let unsubFs: (() => void) | null = null;

  try {
    const q = query(
      collection(db, "calls"),
      where("toUid", "==", uid),
      where("status", "==", "ringing")
    );
    unsubFs = onSnapshot(
      q,
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const call = { channel: change.doc.id, ...change.doc.data() } as CallInvite;
            if (call.status === "ringing" && call.toUid === uid) {
              // ignore stale rings older than 60s
              if (Date.now() - (call.createdAt || 0) < 60_000) {
                onRing(call);
              }
            }
          }
        });
      },
      (err) => console.warn("listenIncomingCalls", err)
    );
  } catch (e) {
    console.warn("listenIncomingCalls setup", e);
  }

  // Same-device multi-tab fallback via localStorage events
  const onStorage = (e: StorageEvent) => {
    if (e.key !== RING_BROADCAST || !e.newValue) return;
    try {
      const call = JSON.parse(e.newValue) as CallInvite;
      if (call.toUid === uid && call.status === "ringing") {
        if (Date.now() - (call.createdAt || 0) < 60_000) onRing(call);
      }
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    unsubFs?.();
    window.removeEventListener("storage", onStorage);
  };
}

/** Listen to a specific call channel status (for caller waiting) */
export function listenCallStatus(
  channel: string,
  onUpdate: (call: CallInvite) => void
): () => void {
  try {
    return onSnapshot(doc(db, "calls", channel), (snap) => {
      if (!snap.exists()) return;
      onUpdate({ channel: snap.id, ...snap.data() } as CallInvite);
    });
  } catch {
    const timer = window.setInterval(() => {
      const local = readLocalCall(channel);
      if (local) onUpdate(local);
    }, 1000);
    return () => window.clearInterval(timer);
  }
}
