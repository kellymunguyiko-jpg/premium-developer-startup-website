export type AuthProviderId = "google" | "github" | "password" | "unknown";

export interface UserStats {
  totalProjects: number;
  codingHours: number;
  coursesCompleted: number;
  aiUses: number;
  githubActivity: number;
  /** Daily free AI quota (3 hours) */
  aiQuotaMs: number;
  /** AI used today (ms) */
  aiUsedMs: number;
  /** YYYY-MM-DD for daily reset */
  aiUsageDate: string;
  followers: number;
  following: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  role: string;
  bio: string;
  phone: string;
  provider: AuthProviderId;
  isAdmin: boolean;
  /** Admin can block users from the platform */
  blocked?: boolean;
  blockedAt?: number;
  blockedReason?: string;
  stats: UserStats;
  profileCompletion: number;
  followingIds: string[];
  followerIds: string[];
  createdAt: number;
  updatedAt: number;
  lastCodingAt: number | null;
}

export const REQUIRED_FOLLOW_EMAIL = "kellymunguyiko@gmail.com";
export const WHATSAPP_PAY_NUMBER = "250780000000"; // set real WhatsApp number in .env VITE_WHATSAPP_NUMBER
export const APP_VERSION = "1.0.0";

export const FREE_AI_QUOTA_MS = 3 * 60 * 60 * 1000; // 3 hours per day

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function defaultStats(): UserStats {
  return {
    totalProjects: 0,
    codingHours: 0,
    coursesCompleted: 0,
    aiUses: 0,
    githubActivity: 0,
    aiQuotaMs: FREE_AI_QUOTA_MS,
    aiUsedMs: 0,
    aiUsageDate: todayKey(),
    followers: 0,
    following: 0,
  };
}

/** Reset daily AI usage if the day changed */
export function withDailyAIReset(stats: UserStats): UserStats {
  const base = { ...defaultStats(), ...stats, aiQuotaMs: FREE_AI_QUOTA_MS };
  const today = todayKey();
  if (base.aiUsageDate !== today) {
    return {
      ...base,
      aiUsedMs: 0,
      aiUsageDate: today,
    };
  }
  return base;
}

export function defaultProfile(
  partial: Pick<UserProfile, "uid" | "email" | "displayName" | "photoURL" | "provider"> &
    Partial<UserProfile>
): UserProfile {
  const now = Date.now();
  return {
    uid: partial.uid,
    email: partial.email,
    displayName: partial.displayName || "Developer",
    photoURL: partial.photoURL,
    role: partial.role || "Full Stack Developer",
    bio: partial.bio || "",
    phone: partial.phone || "",
    provider: partial.provider,
    isAdmin: partial.isAdmin ?? false,
    blocked: partial.blocked ?? false,
    blockedAt: partial.blockedAt,
    blockedReason: partial.blockedReason,
    stats: withDailyAIReset(partial.stats || defaultStats()),
    profileCompletion: partial.profileCompletion ?? 40,
    followingIds: partial.followingIds || [],
    followerIds: partial.followerIds || [],
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    lastCodingAt: partial.lastCodingAt ?? null,
  };
}

export function aiUsagePercent(stats: UserStats): number {
  const s = withDailyAIReset(stats);
  if (!s.aiQuotaMs) return 0;
  return Math.min(100, Math.round((s.aiUsedMs / s.aiQuotaMs) * 100));
}

export function aiRemainingMs(stats: UserStats): number {
  const s = withDailyAIReset(stats);
  return Math.max(0, s.aiQuotaMs - s.aiUsedMs);
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function firstName(displayName: string): string {
  const n = (displayName || "Developer").trim();
  return n.split(/\s+/)[0] || "Developer";
}

/** Always prefer array lengths for accurate follow counts */
export function getFollowersCount(user: {
  followerIds?: string[];
  stats?: { followers?: number };
}): number {
  const fromIds = user.followerIds?.length;
  if (typeof fromIds === "number") return fromIds;
  return user.stats?.followers || 0;
}

export function getFollowingCount(user: {
  followingIds?: string[];
  stats?: { following?: number };
}): number {
  const fromIds = user.followingIds?.length;
  if (typeof fromIds === "number") return fromIds;
  return user.stats?.following || 0;
}

export function isFollowingUser(
  me: { followingIds?: string[] } | null | undefined,
  targetUid: string
): boolean {
  return Boolean(me?.followingIds?.includes(targetUid));
}
