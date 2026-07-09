import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { AppNotification, NotificationType } from "../types/notifications";

const localKey = (uid: string) => `devspace-notifs-${uid}`;

function loadLocal(uid: string): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(localKey(uid)) || "[]") as AppNotification[];
  } catch {
    return [];
  }
}

function saveLocal(uid: string, items: AppNotification[]) {
  localStorage.setItem(localKey(uid), JSON.stringify(items.slice(0, 100)));
}

export async function pushNotification(input: {
  toUid: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string | null;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, string>;
}) {
  if (input.toUid === input.fromUid) return;

  const payload: Omit<AppNotification, "id"> = {
    toUid: input.toUid,
    fromUid: input.fromUid,
    fromName: input.fromName,
    fromPhoto: input.fromPhoto,
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
    createdAt: Date.now(),
    meta: input.meta,
  };

  // Always keep a local copy so Notifications UI works even if Firestore rules fail
  const localId = `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const list = loadLocal(input.toUid);
  list.unshift({ id: localId, ...payload });
  saveLocal(input.toUid, list);

  // Broadcast to other tabs for same browser testing
  try {
    localStorage.setItem(
      `devspace-notif-broadcast-${input.toUid}`,
      JSON.stringify({ id: localId, ...payload, _ts: Date.now() })
    );
  } catch {
    /* ignore */
  }

  try {
    await addDoc(collection(db, "notifications"), payload);
  } catch (e) {
    console.warn("pushNotification firestore failed (local kept)", e);
  }
}

export function listenNotifications(
  uid: string,
  cb: (items: AppNotification[]) => void
): () => void {
  // Always emit local first
  cb(loadLocal(uid));

  let unsubFs: (() => void) | null = null;

  try {
    // Prefer query without composite index first
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", uid),
      limit(50)
    );
    unsubFs = onSnapshot(
      q,
      (snap) => {
        const cloud = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as AppNotification
        );
        // Merge local + cloud (dedupe by id/title/time)
        const local = loadLocal(uid);
        const map = new Map<string, AppNotification>();
        [...cloud, ...local].forEach((n) => {
          const key = n.id || `${n.type}-${n.fromUid}-${n.createdAt}`;
          if (!map.has(key)) map.set(key, n);
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        saveLocal(uid, merged);
        cb(merged);
      },
      () => {
        cb(loadLocal(uid));
      }
    );
  } catch {
    unsubFs = null;
  }

  // Cross-tab local follow notifications
  const onStorage = (e: StorageEvent) => {
    if (e.key !== `devspace-notif-broadcast-${uid}` || !e.newValue) return;
    try {
      const n = JSON.parse(e.newValue) as AppNotification;
      const list = loadLocal(uid);
      if (!list.some((x) => x.id === n.id)) {
        list.unshift(n);
        saveLocal(uid, list);
      }
      cb(loadLocal(uid));
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);

  // Poll local every few seconds so same-tab follow shows up
  const timer = window.setInterval(() => {
    cb(loadLocal(uid));
  }, 2000);

  return () => {
    unsubFs?.();
    window.removeEventListener("storage", onStorage);
    window.clearInterval(timer);
  };
}

export async function markNotificationRead(id: string, uid: string) {
  try {
    await updateDoc(doc(db, "notifications", id), { read: true });
  } catch {
    const list = loadLocal(uid).map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveLocal(uid, list);
  }
}

export async function markAllNotificationsRead(uid: string, items: AppNotification[]) {
  for (const n of items.filter((x) => !x.read)) {
    await markNotificationRead(n.id, uid);
  }
}

export async function fetchNotificationsOnce(uid: string): Promise<AppNotification[]> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as AppNotification
    );
    saveLocal(uid, items);
    return items;
  } catch {
    return loadLocal(uid);
  }
}

export async function saveNotificationLocalFallback(
  uid: string,
  n: AppNotification
) {
  const list = loadLocal(uid);
  list.unshift(n);
  saveLocal(uid, list);
}

export async function createCallInvite(data: {
  channel: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string | null;
  toUid: string;
}) {
  const payload = {
    ...data,
    status: "ringing" as const,
    createdAt: Date.now(),
  };
  try {
    await setDoc(doc(db, "calls", data.channel), payload, { merge: true });
  } catch (e) {
    console.warn("createCallInvite", e);
    localStorage.setItem(`devspace-call-${data.channel}`, JSON.stringify(payload));
  }
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
}

export async function markMissedCall(data: {
  channel: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string | null;
  toUid: string;
}) {
  try {
    await setDoc(
      doc(db, "calls", data.channel),
      { status: "missed", endedAt: Date.now() },
      { merge: true }
    );
  } catch {
    /* ignore */
  }
  await pushNotification({
    toUid: data.toUid,
    fromUid: data.fromUid,
    fromName: data.fromName,
    fromPhoto: data.fromPhoto,
    type: "missed_video_call",
    title: "Missed video call",
    body: `You missed a video call from ${data.fromName}`,
    meta: { channel: data.channel },
  });
}
