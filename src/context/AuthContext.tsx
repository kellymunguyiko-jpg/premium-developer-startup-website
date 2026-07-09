import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";
import { auth, db, googleProvider, githubProvider } from "../lib/firebase";
import {
  defaultProfile,
  defaultStats,
  type AuthProviderId,
  type UserProfile,
  type UserStats,
  FREE_AI_QUOTA_MS,
  aiRemainingMs,
  withDailyAIReset,
  todayKey,
} from "../types/user";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  firestoreReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signInAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: {
    displayName?: string;
    role?: string;
    bio?: string;
    photoURL?: string;
    phone?: string;
  }) => Promise<void>;
  recordCodingTime: (ms: number) => Promise<void>;
  recordProjectSaved: () => Promise<void>;
  consumeAIUsage: (durationMs?: number) => Promise<boolean>;
  /** Returns true if now following, false if unfollowed */
  toggleFollow: (target: UserProfile) => Promise<boolean>;
  setUserBlocked: (
    targetUid: string,
    blocked: boolean,
    reason?: string
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  listUsers: () => Promise<UserProfile[]>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const localKey = (uid: string) => `devspace-profile-${uid}`;
/** Every new signup auto-follows this account */
export const DEFAULT_FOLLOW_EMAIL = "kellymunguyiko@gmail.com";
const AUTO_FOLLOW_FLAG = (uid: string) => `devspace-autofollow-${uid}`;
// Keep auto-follow mandatory for all users (signup/login)

function isPermissionError(e: unknown): boolean {
  const code =
    e && typeof e === "object" && "code" in e
      ? String((e as { code: string }).code)
      : "";
  const msg = e instanceof Error ? e.message : String(e);
  return (
    code.includes("permission-denied") ||
    msg.toLowerCase().includes("missing or insufficient permissions") ||
    msg.toLowerCase().includes("permission")
  );
}

function friendlyAuthError(e: unknown): string {
  const code =
    e && typeof e === "object" && "code" in e
      ? String((e as { code: string }).code)
      : "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "This email is already registered. Sign in instead.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Wrong password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/popup-blocked": "Popup blocked. Allow popups for this site.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email using another sign-in method.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
  };
  if (code && map[code]) return map[code];
  if (isPermissionError(e)) {
    return "Firestore permissions blocked. Using local profile for now — deploy open rules in Firebase Console.";
  }
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: string }).message)
      : "Authentication failed";
  return msg
    .replace("Firebase: ", "")
    .replace(/\(auth\/[^)]+\)\.?/g, "")
    .trim();
}

function detectProvider(user: User): AuthProviderId {
  const id = user.providerData[0]?.providerId;
  if (id === "google.com") return "google";
  if (id === "github.com") return "github";
  if (id === "password") return "password";
  return "unknown";
}

function loadLocalProfile(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(localKey(uid));
    if (!raw) return null;
    const data = JSON.parse(raw) as UserProfile;
    return {
      ...defaultProfile({
        uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        provider: data.provider || "unknown",
      }),
      ...data,
      phone: data.phone || "",
      followingIds: data.followingIds || [],
      followerIds: data.followerIds || [],
      stats: withDailyAIReset({ ...defaultStats(), ...(data.stats || {}) }),
    };
  } catch {
    return null;
  }
}

function saveLocalProfile(profile: UserProfile) {
  try {
    localStorage.setItem(localKey(profile.uid), JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

async function ensureUserDoc(
  user: User,
  forceAdmin = false
): Promise<{ profile: UserProfile; firestoreReady: boolean }> {
  const provider = detectProvider(user);
  const base = defaultProfile({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split("@")[0] || "Developer",
    photoURL: user.photoURL,
    provider,
    isAdmin: forceAdmin || provider === "password",
    profileCompletion: user.photoURL && user.displayName ? 70 : 45,
  });

  // Prefer local cache first for instant UI
  const local = loadLocalProfile(user.uid);

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const merged: UserProfile = {
        ...base,
        ...data,
        email: user.email,
        photoURL: user.photoURL || data.photoURL || null,
        displayName:
          data.displayName || user.displayName || base.displayName,
        isAdmin: forceAdmin || data.isAdmin === true,
        provider: data.provider || provider,
        phone: data.phone || base.phone || "",
        followingIds: data.followingIds || base.followingIds || [],
        followerIds: data.followerIds || base.followerIds || [],
        stats: withDailyAIReset({
          ...defaultStats(),
          ...(data.stats || {}),
          aiQuotaMs: FREE_AI_QUOTA_MS,
        }),
        updatedAt: Date.now(),
      };
      // merge write — more reliable than updateDoc
      await setDoc(
        ref,
        { ...merged, updatedAt: Date.now() },
        { merge: true }
      );
      saveLocalProfile(merged);
      return { profile: merged, firestoreReady: true };
    }

    const profile: UserProfile = {
      ...base,
      isAdmin: forceAdmin || false,
      stats: withDailyAIReset(local?.stats || base.stats),
      role: local?.role || base.role,
      bio: local?.bio || "",
      phone: local?.phone || "",
      followingIds: local?.followingIds || [],
      followerIds: local?.followerIds || [],
      profileCompletion: local?.profileCompletion || base.profileCompletion,
    };

    await setDoc(ref, profile, { merge: true });
    saveLocalProfile(profile);
    return { profile, firestoreReady: true };
  } catch (e) {
    console.warn("Firestore profile fallback:", e);
    // Permission denied or offline → local profile so app still works
    if (local) {
      const merged = {
        ...local,
        email: user.email,
        photoURL: user.photoURL || local.photoURL,
        displayName:
          local.displayName || user.displayName || base.displayName,
        isAdmin: forceAdmin || local.isAdmin,
        updatedAt: Date.now(),
      };
      saveLocalProfile(merged);
      return { profile: merged, firestoreReady: false };
    }

    const profile = {
      ...base,
      isAdmin: forceAdmin || false,
    };
    saveLocalProfile(profile);
    return { profile, firestoreReady: false };
  }
}

async function persistProfile(
  profile: UserProfile
): Promise<boolean> {
  saveLocalProfile(profile);
  try {
    await setDoc(doc(db, "users", profile.uid), profile, { merge: true });
    return true;
  } catch (e) {
    console.warn("persistProfile fallback local only:", e);
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firestoreReady, setFirestoreReady] = useState(true);
  const codingTickRef = useRef<number | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }
    const { profile: p, firestoreReady: ok } = await ensureUserDoc(
      auth.currentUser
    );
    setProfile(p);
    setFirestoreReady(ok);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const { profile: p, firestoreReady: ok } = await ensureUserDoc(u);
          setProfile(p);
          setFirestoreReady(ok);
          if (!ok) {
            setError(
              "Firestore rules blocked cloud sync. Profile is saved locally. Open Firebase → Firestore → Rules and allow authenticated users."
            );
          }
        } catch (e) {
          console.error(e);
          setError(friendlyAuthError(e));
          // still try local
          const local = loadLocalProfile(u.uid);
          if (local) {
            setProfile(local);
            setFirestoreReady(false);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Live follower count: when someone follows you, number updates immediately
  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as UserProfile;
        setProfile((prev) => {
          if (!prev || prev.uid !== user.uid) return prev;
          const followerIds = data.followerIds || prev.followerIds || [];
          const followingIds = data.followingIds || prev.followingIds || [];
          const next: UserProfile = {
            ...prev,
            ...data,
            uid: user.uid,
            followerIds,
            followingIds,
            stats: withDailyAIReset({
              ...defaultStats(),
              ...(prev.stats || {}),
              ...(data.stats || {}),
              followers: followerIds.length,
              following: followingIds.length,
            }),
          };
          saveLocalProfile(next);
          return next;
        });
      },
      (err) => console.warn("live profile snapshot", err)
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !profile) {
      if (codingTickRef.current) {
        window.clearInterval(codingTickRef.current);
        codingTickRef.current = null;
      }
      return;
    }

    codingTickRef.current = window.setInterval(() => {
      void recordCodingTimeInternal(60_000);
    }, 60_000);

    return () => {
      if (codingTickRef.current) {
        window.clearInterval(codingTickRef.current);
        codingTickRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, profile?.uid]);

  const recordCodingTimeInternal = async (ms: number) => {
    const u = auth.currentUser;
    if (!u) return;
    setProfile((prev) => {
      if (!prev) return prev;
      const hours = (prev.stats?.codingHours || 0) + ms / 3_600_000;
      const next: UserProfile = {
        ...prev,
        stats: {
          ...defaultStats(),
          ...prev.stats,
          codingHours: Math.round(hours * 100) / 100,
        },
        lastCodingAt: Date.now(),
        updatedAt: Date.now(),
      };
      void persistProfile(next);
      return next;
    });
  };

  const wrapAuth = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e: unknown) {
      setError(friendlyAuthError(e));
      throw e;
    }
  };

  const autoFollowDefaultAccount = async (me: UserProfile) => {
    // Required: every user must follow kellymunguyiko@gmail.com before using the app
    if ((me.email || "").toLowerCase() === DEFAULT_FOLLOW_EMAIL) {
      localStorage.setItem(AUTO_FOLLOW_FLAG(me.uid), "1");
      return me;
    }

    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", DEFAULT_FOLLOW_EMAIL),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        // Target not registered yet — retry next login
        return me;
      }
      const targetDoc = snap.docs[0];
      const target = { uid: targetDoc.id, ...targetDoc.data() } as UserProfile;

      const following = new Set(me.followingIds || []);
      const already = following.has(target.uid);
      if (!already) following.add(target.uid);

      const nextMe: UserProfile = {
        ...me,
        followingIds: Array.from(following),
        stats: {
          ...defaultStats(),
          ...me.stats,
          following: following.size,
          followers: (me.followerIds || []).length,
        },
        updatedAt: Date.now(),
      };
      await persistProfile(nextMe);

      if (!already) {
        const followers = new Set(target.followerIds || []);
        followers.add(me.uid);
        await setDoc(
          doc(db, "users", target.uid),
          {
            followerIds: Array.from(followers),
            stats: {
              ...defaultStats(),
              ...(target.stats || {}),
              followers: followers.size,
              following: (target.followingIds || []).length,
            },
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        try {
          const { pushNotification } = await import("../services/notifications");
          await pushNotification({
            toUid: target.uid,
            fromUid: me.uid,
            fromName: me.displayName,
            fromPhoto: me.photoURL,
            type: "follow",
            title: "New follower",
            body: `${me.displayName} started following you`,
          });
        } catch {
          /* ignore */
        }
      }

      localStorage.setItem(AUTO_FOLLOW_FLAG(me.uid), "1");
      return nextMe;
    } catch (e) {
      console.warn("autoFollowDefaultAccount", e);
      return me;
    }
  };

  const afterLogin = async (u: User, forceAdmin = false) => {
    const { profile: p, firestoreReady: ok } = await ensureUserDoc(
      u,
      forceAdmin
    );
    // Auto-follow kellymunguyiko@gmail.com after signup/login (once)
    const withFollow = await autoFollowDefaultAccount(p);
    setProfile(withFollow);
    setFirestoreReady(ok);
    if (!ok) {
      setError(
        "Signed in successfully. Cloud sync is blocked by Firestore rules — data is saved on this device until rules are fixed."
      );
    }
  };

  const signInWithGoogle = useCallback(async () => {
    await wrapAuth(async () => {
      const cred = await signInWithPopup(auth, googleProvider);
      await afterLogin(cred.user);
    });
  }, []);

  const signInWithGithub = useCallback(async () => {
    await wrapAuth(async () => {
      const cred = await signInWithPopup(auth, githubProvider);
      await afterLogin(cred.user);
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await wrapAuth(async () => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await afterLogin(cred.user, false);
    });
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      await wrapAuth(async () => {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
        await afterLogin(cred.user, false);
      });
    },
    []
  );

  const signInAdmin = useCallback(async (email: string, password: string) => {
    await wrapAuth(async () => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const { profile: p, firestoreReady: ok } = await ensureUserDoc(
        cred.user,
        true
      );
      const adminProfile: UserProfile = {
        ...p,
        isAdmin: true,
        provider: "password",
        updatedAt: Date.now(),
      };
      await persistProfile(adminProfile);
      setProfile(adminProfile);
      setFirestoreReady(ok);
      if (!ok) {
        setError(
          "Admin signed in. Cloud sync blocked by Firestore rules — admin flag is local until rules are fixed."
        );
      }
    });
  }, []);

  const logout = useCallback(async () => {
    await fbSignOut(auth);
    setProfile(null);
    setError(null);
  }, []);

  const updateUserProfile = useCallback(
    async (data: {
      displayName?: string;
      role?: string;
      bio?: string;
      photoURL?: string;
      phone?: string;
    }) => {
      const u = auth.currentUser;
      if (!u) throw new Error("Not signed in");

      if (data.displayName || data.photoURL) {
        try {
          await updateProfile(u, {
            displayName: data.displayName ?? u.displayName ?? undefined,
            photoURL: data.photoURL ?? u.photoURL ?? undefined,
          });
        } catch {
          /* ignore auth profile update issues */
        }
      }

      setProfile((prev) => {
        if (!prev) return prev;
        const name = (data.displayName ?? prev.displayName ?? "").trim();
        const role = (data.role ?? prev.role ?? "").trim();
        const bio = (data.bio ?? prev.bio ?? "").trim();
        const phone = (data.phone ?? prev.phone ?? "").trim();
        const photo = data.photoURL ?? prev.photoURL ?? u.photoURL;
        let completion = 25;
        if (name) completion += 15;
        if (role) completion += 15;
        if (bio) completion += 15;
        if (photo) completion += 15;
        if (phone) completion += 15;

        const next: UserProfile = {
          ...prev,
          displayName: name || prev.displayName,
          role: role || prev.role,
          bio,
          phone,
          photoURL: photo || null,
          profileCompletion: Math.min(100, completion),
          updatedAt: Date.now(),
        };
        void persistProfile(next);
        return next;
      });
    },
    []
  );

  const recordCodingTime = useCallback(async (ms: number) => {
    await recordCodingTimeInternal(ms);
  }, []);

  const recordProjectSaved = useCallback(async () => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next: UserProfile = {
        ...prev,
        stats: {
          ...defaultStats(),
          ...prev.stats,
          totalProjects: (prev.stats?.totalProjects || 0) + 1,
        },
        updatedAt: Date.now(),
      };
      void persistProfile(next);
      return next;
    });
  }, []);

  const consumeAIUsage = useCallback(async (durationMs = 30_000) => {
    const current = profile;
    if (!current) return false;

    // Daily free trial: 3 hours per day (resets each day)
    const stats = withDailyAIReset({
      ...defaultStats(),
      ...current.stats,
      aiQuotaMs: FREE_AI_QUOTA_MS,
    });

    if (aiRemainingMs(stats) <= 0) {
      // keep reset date persisted
      const exhausted: UserProfile = {
        ...current,
        stats,
        updatedAt: Date.now(),
      };
      setProfile(exhausted);
      await persistProfile(exhausted);
      return false;
    }

    const nextUsed = Math.min(stats.aiQuotaMs, stats.aiUsedMs + durationMs);
    const nextStats: UserStats = {
      ...stats,
      aiUsedMs: nextUsed,
      aiUses: (stats.aiUses || 0) + 1,
      aiUsageDate: todayKey(),
      aiQuotaMs: FREE_AI_QUOTA_MS,
    };
    const next: UserProfile = {
      ...current,
      stats: nextStats,
      updatedAt: Date.now(),
    };
    setProfile(next);
    await persistProfile(next);
    return true;
  }, [profile]);

  const toggleFollow = useCallback(async (target: UserProfile) => {
    if (!profile || profile.uid === target.uid) return false;

    const following = new Set(profile.followingIds || []);
    const wasFollowing = following.has(target.uid);
    if (wasFollowing) following.delete(target.uid);
    else following.add(target.uid);

    const myFollowerIds = [...(profile.followerIds || [])];
    const nextMe: UserProfile = {
      ...profile,
      followingIds: Array.from(following),
      followerIds: myFollowerIds,
      stats: {
        ...defaultStats(),
        ...profile.stats,
        following: following.size,
        followers: myFollowerIds.length,
      },
      updatedAt: Date.now(),
    };

    // Optimistic UI update for current user (Following count)
    setProfile(nextMe);
    await persistProfile(nextMe);

    // Update target user followers count in Firestore
    const targetRef = doc(db, "users", target.uid);
    let targetFollowers = new Set(target.followerIds || []);
    try {
      const snap = await getDoc(targetRef);
      const data = (snap.exists() ? snap.data() : target) as UserProfile;
      targetFollowers = new Set(data.followerIds || target.followerIds || []);
      if (wasFollowing) targetFollowers.delete(profile.uid);
      else targetFollowers.add(profile.uid);

      const targetFollowingIds = data.followingIds || target.followingIds || [];
      await setDoc(
        targetRef,
        {
          uid: target.uid,
          email: data.email ?? target.email ?? null,
          displayName: data.displayName || target.displayName,
          photoURL: data.photoURL ?? target.photoURL ?? null,
          followerIds: Array.from(targetFollowers),
          followingIds: targetFollowingIds,
          stats: {
            ...defaultStats(),
            ...(data.stats || {}),
            followers: targetFollowers.size,
            following: targetFollowingIds.length,
          },
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("toggleFollow target update", e);
      // Local fallback so UI can still show updated count for target in lists
      if (wasFollowing) targetFollowers.delete(profile.uid);
      else targetFollowers.add(profile.uid);
      try {
        const key = `devspace-profile-${target.uid}`;
        const raw = localStorage.getItem(key);
        const base = raw ? (JSON.parse(raw) as UserProfile) : target;
        const localTarget: UserProfile = {
          ...base,
          followerIds: Array.from(targetFollowers),
          stats: {
            ...defaultStats(),
            ...(base.stats || {}),
            followers: targetFollowers.size,
            following: (base.followingIds || []).length,
          },
          updatedAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(localTarget));
      } catch {
        /* ignore */
      }
    }

    if (!wasFollowing) {
      try {
        const { pushNotification } = await import("../services/notifications");
        await pushNotification({
          toUid: target.uid,
          fromUid: profile.uid,
          fromName: profile.displayName || "A developer",
          fromPhoto: profile.photoURL,
          type: "follow",
          title: "New follower",
          body: `${profile.displayName || "Someone"} started following you`,
          meta: { followerUid: profile.uid },
        });
      } catch (e) {
        console.warn("follow notification", e);
      }
    }

    return !wasFollowing;
  }, [profile]);

  const setUserBlocked = useCallback(
    async (targetUid: string, blocked: boolean, reason = "") => {
      if (!profile?.isAdmin) {
        throw new Error("Only admins can block users");
      }
      if (targetUid === profile.uid) {
        throw new Error("You cannot block yourself");
      }
      const ref = doc(db, "users", targetUid);
      await setDoc(
        ref,
        {
          blocked,
          blockedAt: blocked ? Date.now() : null,
          blockedReason: blocked ? reason || "Blocked by admin" : "",
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    },
    [profile]
  );

  const listUsers = useCallback(async () => {
    try {
      const q = query(
        collection(db, "users"),
        orderBy("updatedAt", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as UserProfile;
        return defaultProfile({
          ...data,
          uid: d.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          provider: data.provider || "unknown",
          phone: data.phone || "",
          followingIds: data.followingIds || [],
          followerIds: data.followerIds || [],
          stats: withDailyAIReset({
            ...defaultStats(),
            ...(data.stats || {}),
          }),
        });
      });
    } catch (e) {
      if (isPermissionError(e)) {
        // fallback: only current user
        if (profile) return [profile];
        throw new Error(
          "Missing Firestore permissions to list users. Update rules so admins can read /users."
        );
      }
      throw e;
    }
  }, [profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      error,
      firestoreReady,
      signInWithGoogle,
      signInWithGithub,
      signInWithEmail,
      signUpWithEmail,
      signInAdmin,
      logout,
      updateUserProfile,
      recordCodingTime,
      recordProjectSaved,
      consumeAIUsage,
      toggleFollow,
      setUserBlocked,
      refreshProfile,
      clearError: () => setError(null),
      listUsers,
    }),
    [
      user,
      profile,
      loading,
      error,
      firestoreReady,
      signInWithGoogle,
      signInWithGithub,
      signInWithEmail,
      signUpWithEmail,
      signInAdmin,
      logout,
      updateUserProfile,
      recordCodingTime,
      recordProjectSaved,
      consumeAIUsage,
      toggleFollow,
      setUserBlocked,
      refreshProfile,
      listUsers,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
