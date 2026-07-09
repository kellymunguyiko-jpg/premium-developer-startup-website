import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { VideoItem } from "../types/notifications";

const KEY = "devspace-videos";

const SEED: VideoItem[] = [
  {
    id: "v-react",
    title: "React in 10 minutes",
    about: "Quick intro to components, props, and state.",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk",
    createdAt: Date.now() - 86400000 * 2,
    createdBy: "system",
  },
  {
    id: "v-js",
    title: "JavaScript Crash Course",
    about: "Core JS concepts every developer needs.",
    image:
      "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=450&fit=crop",
    videoUrl: "https://www.youtube.com/embed/PkZNo7MFNFg",
    createdAt: Date.now() - 86400000,
    createdBy: "system",
  },
];

function loadLocal(): VideoItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VideoItem[];
      if (parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  localStorage.setItem(KEY, JSON.stringify(SEED));
  return SEED;
}

function saveLocal(items: VideoItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export async function fetchVideos(): Promise<VideoItem[]> {
  try {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VideoItem);
      saveLocal(items);
      return items;
    }
  } catch (e) {
    console.warn("fetchVideos fallback", e);
  }
  return loadLocal();
}

export async function saveVideo(
  video: Omit<VideoItem, "id"> & { id?: string }
): Promise<VideoItem> {
  const id = video.id || `video-${Date.now()}`;
  const item: VideoItem = {
    ...video,
    id,
    createdAt: video.createdAt || Date.now(),
  };
  try {
    await setDoc(doc(db, "videos", id), item, { merge: true });
  } catch (e) {
    console.warn("saveVideo local", e);
  }
  const all = await fetchVideos();
  saveLocal([item, ...all.filter((v) => v.id !== id)]);
  return item;
}

export async function removeVideo(id: string) {
  try {
    await deleteDoc(doc(db, "videos", id));
  } catch {
    /* local */
  }
  saveLocal((await fetchVideos()).filter((v) => v.id !== id));
}

/** Convert common watch URLs to embeddable ones */
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    return url;
  } catch {
    return url;
  }
}
