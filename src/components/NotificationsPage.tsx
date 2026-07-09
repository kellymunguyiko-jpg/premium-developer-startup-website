import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Loader2,
  PhoneMissed,
  UserPlus,
  Video,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { AppNotification } from "../types/notifications";
import {
  listenNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";
import { cn } from "../utils/cn";

export function NotificationsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    const unsub = listenNotifications(profile.uid, (list) => {
      setItems(list);
      setLoading(false);
    });
    return unsub;
  }, [profile?.uid]);

  if (!profile) return null;

  const unread = items.filter((n) => !n.read).length;

  const iconFor = (type: AppNotification["type"]) => {
    if (type === "follow") return UserPlus;
    if (type === "missed_video_call") return PhoneMissed;
    if (type === "video_call") return Video;
    return Bell;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inbox · {items.length} total · {unread} unread · follows & missed
            calls
          </p>
        </div>
        <button
          onClick={() =>
            void markAllNotificationsRead(profile.uid, items).then(() =>
              setItems((prev) => prev.map((n) => ({ ...n, read: true })))
            )
          }
          disabled={!unread}
          className="inline-flex items-center gap-1.5 rounded-xl border border-green-100 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-50 disabled:opacity-40 dark:border-green-800 dark:text-green-400"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-green-50 bg-white py-16 text-center dark:border-green-900/40 dark:bg-[#111814]">
          <Bell className="mx-auto h-8 w-8 text-green-600/40" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            No notifications yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Follows and missed video calls will show here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <button
                key={n.id}
                onClick={() => {
                  void markNotificationRead(n.id, profile.uid);
                  setItems((prev) =>
                    prev.map((x) =>
                      x.id === n.id ? { ...x, read: true } : x
                    )
                  );
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  n.read
                    ? "border-green-50 bg-white dark:border-green-900/30 dark:bg-[#111814]"
                    : "border-green-200 bg-green-50/60 dark:border-green-800 dark:bg-green-950/30"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-green-600" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <img
                  src={
                    n.fromPhoto ||
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${n.fromUid}&backgroundColor=bbf7d0`
                  }
                  alt=""
                  className="h-9 w-9 rounded-full bg-green-100"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
