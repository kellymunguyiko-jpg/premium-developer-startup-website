import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Phone,
  Search,
  Send,
  UserPlus,
  UserCheck,
  Video,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../types/user";
import {
  getFollowersCount,
  getFollowingCount,
  isFollowingUser,
} from "../types/user";
import type { ChatMessageDoc, DirectChat } from "../types/content";
import {
  ensureChat,
  fetchDevelopers,
  fetchMyChats,
  listenChatMessages,
  sendChatMessage,
} from "../services/contentStore";
import { createCallInvite } from "../services/calls";
import { VideoCallModal } from "./VideoCallModal";
import { cn } from "../utils/cn";

export function MessagesPage() {
  const { profile, toggleFollow } = useAuth();
  const [devs, setDevs] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<DirectChat[]>([]);
  const [q, setQ] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [peer, setPeer] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessageDoc[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [callChannel, setCallChannel] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState<string | null>(null);
  const MAX_MESSAGE_CHARS = 32; // max 32 letters/characters per message

  const charCount = text.length;
  const overCharLimit = charCount > MAX_MESSAGE_CHARS;

  useEffect(() => {
    if (!profile) return;
    void (async () => {
      setLoading(true);
      const [d, c] = await Promise.all([
        fetchDevelopers(),
        fetchMyChats(profile.uid),
      ]);
      setDevs(d.filter((x) => x.uid !== profile.uid));
      setChats(c);
      setLoading(false);
    })();
  }, [profile?.uid]);

  useEffect(() => {
    if (!activeChatId) return;
    return listenChatMessages(activeChatId, setMessages);
  }, [activeChatId]);

  const filteredDevs = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return devs;
    return devs.filter((d) =>
      `${d.displayName} ${d.role} ${d.email || ""} ${d.phone || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [devs, q]);

  if (!profile) return null;

  const openChatWith = async (dev: UserProfile) => {
    const id = await ensureChat(profile, dev);
    setActiveChatId(id);
    setPeer(dev);
    const c = await fetchMyChats(profile.uid);
    setChats(c);
  };

  const onFollowDev = async (dev: UserProfile) => {
    setFollowBusy(dev.uid);
    const nowFollowing = await toggleFollow(dev);
    setDevs((prev) =>
      prev.map((d) => {
        if (d.uid !== dev.uid) return d;
        const followers = new Set(d.followerIds || []);
        if (nowFollowing) followers.add(profile.uid);
        else followers.delete(profile.uid);
        const next = {
          ...d,
          followerIds: Array.from(followers),
          stats: {
            ...d.stats,
            followers: followers.size,
            following: getFollowingCount(d),
          },
        };
        if (peer?.uid === dev.uid) setPeer(next);
        return next;
      })
    );
    setFollowBusy(null);
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !text.trim()) return;
    if (overCharLimit) return; // block send over 32 letters
    setSending(true);
    try {
      await sendChatMessage(activeChatId, profile, text.trim());
      setText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const callPeer = () => {
    if (!peer) return;
    if (peer.phone) {
      window.location.href = `tel:${peer.phone}`;
    } else {
      alert(`${peer.displayName} has not added a phone number yet.`);
    }
  };

  const startVideoCall = async () => {
    if (!peer || !profile) return;
    const channel = `call_${[profile.uid, peer.uid].sort().join("_").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 48)}_${Date.now()}`;
    await createCallInvite({
      channel,
      fromUid: profile.uid,
      fromName: profile.displayName,
      fromPhoto: profile.photoURL,
      toUid: peer.uid,
      toName: peer.displayName,
      toPhoto: peer.photoURL,
    });
    setCallChannel(channel);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-6xl overflow-hidden rounded-2xl border border-green-50 bg-white shadow-sm dark:border-green-900/40 dark:bg-[#0d1210]">
      {/* Left: search + developers */}
      <aside className="flex w-full max-w-xs flex-col border-r border-green-50 dark:border-green-900/40 sm:w-80">
        <div className="border-b border-green-50 p-3 dark:border-green-900/40">
          <h1 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
            Messages
          </h1>
          <p className="mb-2 text-[11px] font-semibold text-green-700 dark:text-green-400">
            {chats.length} message{chats.length === 1 ? "" : "s"} in inbox
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search developers..."
              className="h-10 w-full rounded-xl border border-green-100 bg-green-50/30 pl-9 pr-3 text-xs outline-none focus:border-green-300 dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            </div>
          ) : (
            <>
              {chats.length > 0 && (
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Recent chats
                </p>
              )}
              {chats.map((c) => {
                const otherId = c.members.find((m) => m !== profile.uid) || "";
                const name = c.memberNames?.[otherId] || "Developer";
                const photo = c.memberPhotos?.[otherId];
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveChatId(c.id);
                      const found = devs.find((d) => d.uid === otherId);
                      setPeer(
                        found || {
                          ...profile,
                          uid: otherId,
                          displayName: name,
                          photoURL: photo || null,
                        }
                      );
                    }}
                    className={cn(
                      "mb-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-green-50 dark:hover:bg-green-950/40",
                      activeChatId === c.id && "bg-green-50 dark:bg-green-950/50"
                    )}
                  >
                    <img
                      src={
                        photo ||
                        `https://api.dicebear.com/9.x/avataaars/svg?seed=${otherId}&backgroundColor=bbf7d0`
                      }
                      alt=""
                      className="h-9 w-9 rounded-full bg-green-100"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {name}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {c.lastMessage || "Start chatting"}
                      </p>
                    </div>
                  </button>
                );
              })}

              <p className="mt-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                All developers
              </p>
              {filteredDevs.map((dev) => {
                const following = isFollowingUser(profile, dev.uid);
                return (
                  <div
                    key={dev.uid}
                    className="mb-1 flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-green-50 dark:hover:bg-green-950/40"
                  >
                    <button
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => void openChatWith(dev)}
                    >
                      <img
                        src={
                          dev.photoURL ||
                          `https://api.dicebear.com/9.x/avataaars/svg?seed=${dev.uid}&backgroundColor=bbf7d0`
                        }
                        alt=""
                        className="h-9 w-9 rounded-full bg-green-100"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                          {dev.displayName}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {getFollowersCount(dev)} followers · {dev.role}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => void onFollowDev(dev)}
                      disabled={followBusy === dev.uid}
                      className={cn(
                        "rounded-lg p-1.5 disabled:opacity-50",
                        following
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "text-slate-400 hover:bg-green-50 hover:text-green-700"
                      )}
                      title={following ? "Following" : "Follow"}
                    >
                      {followBusy === dev.uid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : following ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => void openChatWith(dev)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-700"
                      title="Chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {filteredDevs.length === 0 && !loading && (
                <p className="px-3 py-8 text-center text-xs text-slate-400">
                  No developers found. Users appear after they sign in.
                </p>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Right: chat */}
      <div className="hidden min-w-0 flex-1 flex-col sm:flex">
        {activeChatId && peer ? (
          <>
            <div className="flex h-14 items-center justify-between border-b border-green-50 px-4 dark:border-green-900/40">
              <div className="flex items-center gap-2">
                <img
                  src={
                    peer.photoURL ||
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${peer.uid}&backgroundColor=bbf7d0`
                  }
                  alt=""
                  className="h-9 w-9 rounded-full"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {peer.displayName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {getFollowersCount(peer)} followers ·{" "}
                    {getFollowingCount(peer)} following ·{" "}
                    {peer.phone || "No phone"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={callPeer}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </button>
                <button
                  onClick={() => void startVideoCall()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
                >
                  <Video className="h-3.5 w-3.5" />
                  Video (1:30)
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.fromUid === profile.uid;
                return (
                  <div
                    key={m.id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2 text-xs",
                        mine
                          ? "bg-green-600 text-white"
                          : "bg-green-50 text-slate-700 dark:bg-green-950/50 dark:text-slate-200"
                      )}
                    >
                      {!mine && (
                        <p className="mb-0.5 text-[10px] font-bold opacity-70">
                          {m.fromName}
                        </p>
                      )}
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={onSend}
              className="border-t border-green-50 p-3 dark:border-green-900/40"
            >
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <input
                    value={text}
                    maxLength={MAX_MESSAGE_CHARS}
                    onChange={(e) => {
                      // Max 32 letters/characters, single line
                      const next = e.target.value
                        .replace(/\n/g, " ")
                        .slice(0, MAX_MESSAGE_CHARS);
                      setText(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!overCharLimit && text.trim()) {
                          void onSend(e as unknown as React.FormEvent);
                        }
                      }
                    }}
                    placeholder="Max 32 letters..."
                    className={`h-11 w-full rounded-xl border bg-green-50/30 px-3 text-sm outline-none dark:bg-green-950/20 dark:text-slate-100 ${
                      overCharLimit
                        ? "border-red-400 focus:border-red-500"
                        : "border-green-100 focus:border-green-300 dark:border-green-900/50"
                    }`}
                  />
                  <div className="mt-1 flex items-center justify-between px-1">
                    <p
                      className={`text-[10px] font-semibold ${
                        overCharLimit || charCount >= MAX_MESSAGE_CHARS
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    >
                      {charCount}/{MAX_MESSAGE_CHARS} letters
                      {charCount >= MAX_MESSAGE_CHARS
                        ? " · Max 32 letters"
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={sending || !text.trim() || overCharLimit}
                  className="mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  title={
                    overCharLimit
                      ? "Max 32 letters only"
                      : "Send"
                  }
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <MessageSquare className="h-10 w-10 text-green-600/40" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Chat with developers
            </p>
            <p className="max-w-xs text-xs text-slate-400">
              Search a developer, follow them, then open chat or call if they
              added a phone number.
            </p>
          </div>
        )}
      </div>

      {callChannel && peer && profile && (
        <VideoCallModal
          open={!!callChannel}
          channel={callChannel}
          isCaller
          me={{
            uid: profile.uid,
            displayName: profile.displayName,
            photoURL: profile.photoURL,
          }}
          peer={{
            uid: peer.uid,
            displayName: peer.displayName,
            photoURL: peer.photoURL,
          }}
          onClose={() => setCallChannel(null)}
        />
      )}
    </div>
  );
}
