import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Phone,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../types/user";
import {
  getFollowersCount,
  getFollowingCount,
  isFollowingUser,
} from "../types/user";
import { ensureChat, fetchDevelopers } from "../services/contentStore";

export function CommunityPage({
  onOpenMessages,
}: {
  onOpenMessages?: (peerUid?: string) => void;
}) {
  const { profile, toggleFollow } = useAuth();
  const [devs, setDevs] = useState<UserProfile[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const list = await fetchDevelopers();
      setDevs(list.filter((d) => d.uid !== profile?.uid));
      setLoading(false);
    })();
  }, [profile?.uid]);

  // Keep local cards in sync when my followingIds change
  useEffect(() => {
    if (!profile) return;
    setDevs((prev) =>
      prev.map((d) => {
        const iFollow = isFollowingUser(profile, d.uid);
        const followers = new Set(d.followerIds || []);
        // Ensure my uid is reflected in their followerIds for display
        if (iFollow) followers.add(profile.uid);
        else followers.delete(profile.uid);
        return {
          ...d,
          followerIds: Array.from(followers),
          stats: {
            ...d.stats,
            followers: followers.size,
            following: getFollowingCount(d),
          },
        };
      })
    );
  }, [profile?.followingIds?.join(","), profile?.uid]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return devs;
    return devs.filter((d) =>
      `${d.displayName} ${d.role} ${d.bio} ${d.email || ""} ${d.phone || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [devs, q]);

  if (!profile) return null;

  const startChat = async (dev: UserProfile) => {
    await ensureChat(profile, dev);
    onOpenMessages?.(dev.uid);
  };

  const onFollowClick = async (dev: UserProfile) => {
    setBusyUid(dev.uid);
    const nowFollowing = await toggleFollow(dev);
    setDevs((prev) =>
      prev.map((d) => {
        if (d.uid !== dev.uid) return d;
        const followers = new Set(d.followerIds || []);
        if (nowFollowing) followers.add(profile.uid);
        else followers.delete(profile.uid);
        return {
          ...d,
          followerIds: Array.from(followers),
          stats: {
            ...d.stats,
            followers: followers.size,
            following: getFollowingCount(d),
          },
        };
      })
    );
    setBusyUid(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          <Users className="h-6 w-6 text-green-600" />
          Community
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search developers · follow · chat · call
        </p>
        <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-400">
          You: {getFollowersCount(profile)} followers ·{" "}
          {getFollowingCount(profile)} following
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search another developer by name, role, phone..."
          className="h-12 w-full rounded-2xl border border-green-100 bg-white pl-11 pr-4 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-[#111814] dark:text-slate-100"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((dev) => {
            const following = isFollowingUser(profile, dev.uid);
            const followersCount = getFollowersCount(dev);
            const followingCount = getFollowingCount(dev);
            return (
              <article
                key={dev.uid}
                className="rounded-2xl border border-green-50 bg-white p-4 shadow-sm dark:border-green-900/40 dark:bg-[#111814]"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={
                      dev.photoURL ||
                      `https://api.dicebear.com/9.x/avataaars/svg?seed=${dev.uid}&backgroundColor=bbf7d0`
                    }
                    alt={dev.displayName}
                    className="h-12 w-12 rounded-full bg-green-100"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {dev.displayName}
                    </h3>
                    <p className="text-xs text-slate-400">{dev.role}</p>
                    {dev.bio && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                        {dev.bio}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        {followersCount}
                      </span>{" "}
                      followers ·{" "}
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {followingCount}
                      </span>{" "}
                      following
                      {dev.phone ? ` · 📞 ${dev.phone}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => void onFollowClick(dev)}
                    disabled={busyUid === dev.uid}
                    className={`inline-flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold disabled:opacity-60 ${
                      following
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {busyUid === dev.uid ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : following ? (
                      <UserCheck className="h-3.5 w-3.5" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    {following ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={() => void startChat(dev)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-green-200 py-2 text-[11px] font-bold text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </button>
                  <button
                    onClick={() => {
                      if (dev.phone) window.location.href = `tel:${dev.phone}`;
                      else alert("This developer has not added a phone number.");
                    }}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-green-200 py-2 text-[11px] font-bold text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </button>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-slate-400">
              No developers found yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
