import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  limit,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  SEED_BOOKS,
  SEED_COURSES,
  type BookItem,
  type ChatMessageDoc,
  type CourseItem,
  type DirectChat,
  chatIdFor,
} from "../types/content";
import type { UserProfile } from "../types/user";
import { defaultProfile, defaultStats } from "../types/user";

const COURSES_KEY = "devspace-courses";
const BOOKS_KEY = "devspace-books";

function loadLocal<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function saveLocal<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export async function fetchCourses(): Promise<CourseItem[]> {
  try {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CourseItem);
      saveLocal(COURSES_KEY, items);
      return items;
    }
  } catch (e) {
    console.warn("courses firestore fallback", e);
  }
  return loadLocal(COURSES_KEY, SEED_COURSES);
}

export async function saveCourse(course: Omit<CourseItem, "id"> & { id?: string }) {
  const id = course.id || `course-${Date.now()}`;
  const item: CourseItem = { ...course, id, createdAt: course.createdAt || Date.now() };
  try {
    await setDoc(doc(db, "courses", id), item, { merge: true });
  } catch (e) {
    console.warn("saveCourse local", e);
  }
  const all = await fetchCourses();
  const next = [item, ...all.filter((c) => c.id !== id)];
  saveLocal(COURSES_KEY, next);
  return item;
}

export async function removeCourse(id: string) {
  try {
    await deleteDoc(doc(db, "courses", id));
  } catch {
    /* local */
  }
  const all = await fetchCourses();
  saveLocal(
    COURSES_KEY,
    all.filter((c) => c.id !== id)
  );
}

export async function fetchBooks(): Promise<BookItem[]> {
  try {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BookItem);
      saveLocal(BOOKS_KEY, items);
      return items;
    }
  } catch (e) {
    console.warn("books firestore fallback", e);
  }
  return loadLocal(BOOKS_KEY, SEED_BOOKS);
}

export async function saveBook(book: Omit<BookItem, "id"> & { id?: string }) {
  const id = book.id || `book-${Date.now()}`;
  const item: BookItem = { ...book, id, createdAt: book.createdAt || Date.now() };
  try {
    await setDoc(doc(db, "books", id), item, { merge: true });
  } catch (e) {
    console.warn("saveBook local", e);
  }
  const all = await fetchBooks();
  const next = [item, ...all.filter((b) => b.id !== id)];
  saveLocal(BOOKS_KEY, next);
  return item;
}

export async function removeBook(id: string) {
  try {
    await deleteDoc(doc(db, "books", id));
  } catch {
    /* local */
  }
  const all = await fetchBooks();
  saveLocal(
    BOOKS_KEY,
    all.filter((b) => b.id !== id)
  );
}

export async function fetchDevelopers(limitN = 80): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, "users"), orderBy("updatedAt", "desc"), limit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as UserProfile;
      return defaultProfile({
        ...data,
        uid: d.id,
        email: data.email ?? null,
        displayName: data.displayName || "Developer",
        photoURL: data.photoURL ?? null,
        provider: data.provider || "unknown",
        stats: { ...defaultStats(), ...(data.stats || {}) },
        followingIds: data.followingIds || [],
        followerIds: data.followerIds || [],
        phone: data.phone || "",
      });
    });
  } catch (e) {
    console.warn("fetchDevelopers", e);
    return [];
  }
}

export async function ensureChat(
  me: UserProfile,
  other: UserProfile
): Promise<string> {
  const id = chatIdFor(me.uid, other.uid);
  const chat: DirectChat = {
    id,
    members: [me.uid, other.uid],
    memberNames: {
      [me.uid]: me.displayName,
      [other.uid]: other.displayName,
    },
    memberPhotos: {
      [me.uid]: me.photoURL,
      [other.uid]: other.photoURL,
    },
    lastMessage: "",
    updatedAt: Date.now(),
  };
  try {
    await setDoc(doc(db, "chats", id), chat, { merge: true });
  } catch (e) {
    console.warn("ensureChat local", e);
    localStorage.setItem(`devspace-chat-meta-${id}`, JSON.stringify(chat));
  }
  return id;
}

export async function sendChatMessage(
  chatId: string,
  from: UserProfile,
  text: string
) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message is empty");
  }
  if (trimmed.length > 32) {
    throw new Error("Message must be 32 letters or less");
  }

  const msg = {
    chatId,
    fromUid: from.uid,
    fromName: from.displayName,
    fromPhoto: from.photoURL,
    text: text.trim(),
    createdAt: Date.now(),
  };
  try {
    await addDoc(collection(db, "chats", chatId, "messages"), msg);
    await setDoc(
      doc(db, "chats", chatId),
      { lastMessage: text, updatedAt: Date.now() },
      { merge: true }
    );
  } catch (e) {
    console.warn("sendChatMessage local", e);
    const key = `devspace-chat-msgs-${chatId}`;
    const prev = JSON.parse(localStorage.getItem(key) || "[]") as ChatMessageDoc[];
    prev.push({ id: `m-${Date.now()}`, ...msg });
    localStorage.setItem(key, JSON.stringify(prev));
  }
}

export function listenChatMessages(
  chatId: string,
  cb: (msgs: ChatMessageDoc[]) => void
): () => void {
  try {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      q,
      (snap) => {
        cb(
          snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as ChatMessageDoc
          )
        );
      },
      () => {
        const key = `devspace-chat-msgs-${chatId}`;
        const prev = JSON.parse(localStorage.getItem(key) || "[]") as ChatMessageDoc[];
        cb(prev);
      }
    );
  } catch {
    const key = `devspace-chat-msgs-${chatId}`;
    const prev = JSON.parse(localStorage.getItem(key) || "[]") as ChatMessageDoc[];
    cb(prev);
    return () => undefined;
  }
}

export async function fetchMyChats(uid: string): Promise<DirectChat[]> {
  try {
    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", uid),
      orderBy("updatedAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DirectChat);
  } catch (e) {
    console.warn("fetchMyChats orderBy fallback", e);
    // Fallback without orderBy (index missing)
    try {
      const q2 = query(
        collection(db, "chats"),
        where("members", "array-contains", uid),
        limit(50)
      );
      const snap = await getDocs(q2);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as DirectChat)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (e2) {
      console.warn("fetchMyChats", e2);
      return [];
    }
  }
}

/** Live inbox count for sidebar badge */
export function listenMyChats(
  uid: string,
  cb: (chats: DirectChat[]) => void
): () => void {
  try {
    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", uid),
      limit(50)
    );
    return onSnapshot(
      q,
      (snap) => {
        const chats = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as DirectChat)
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        cb(chats);
      },
      async () => {
        cb(await fetchMyChats(uid));
      }
    );
  } catch {
    void fetchMyChats(uid).then(cb);
    return () => undefined;
  }
}
