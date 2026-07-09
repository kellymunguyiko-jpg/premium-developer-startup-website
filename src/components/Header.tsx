import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  MessageSquare,
  Globe,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  LogOut,
  Download,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { listenNotifications } from "../services/notifications";
import { getFollowersCount } from "../types/user";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface HeaderProps {
  onMenuClick: () => void;
  onOpenNotifications?: () => void;
  onOpenMessages?: () => void;
}

export function Header({
  onMenuClick,
  onOpenNotifications,
  onOpenMessages,
}: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { profile, logout } = useAuth();
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!profile) return;
    return listenNotifications(profile.uid, (items) => {
      setUnread(items.filter((n) => !n.read).length);
    });
  }, [profile?.uid]);

  const avatar =
    profile?.photoURL ||
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${profile?.uid || "guest"}&backgroundColor=bbf7d0`;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-green-50 bg-white/90 px-4 backdrop-blur-md dark:border-green-900/40 dark:bg-[#0d1210]/90 sm:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden min-w-0 max-w-xl flex-1 md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search for courses, videos, books, tools..."
          className="h-10 w-full rounded-full border border-green-100 bg-green-50/40 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-green-300 focus:bg-white focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-green-700 dark:focus:bg-[#111814] dark:focus:ring-green-900/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {canInstall && !isInstalled && (
          <button
            onClick={() => void install()}
            className="hidden items-center gap-1 rounded-xl bg-green-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-green-700 sm:inline-flex"
            title="Install App"
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </button>
        )}
        <button
          onClick={onOpenNotifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-green-600 px-0.5 text-[8px] font-bold text-white ring-2 ring-white dark:ring-[#0d1210]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <button
          onClick={onOpenMessages}
          className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400 sm:flex"
        >
          <MessageSquare className="h-[18px] w-[18px]" />
        </button>

        <button className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400 sm:flex">
          <Globe className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </button>

        <button
          onClick={() => void logout()}
          className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 sm:flex"
          title="Sign out"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-green-100 dark:bg-green-900/50 sm:block" />

        <button className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 transition-all hover:bg-green-50 dark:hover:bg-green-950">
          <img
            src={avatar}
            alt={profile?.displayName || "User"}
            className="h-8 w-8 rounded-full bg-green-100 ring-2 ring-green-100 dark:bg-green-900 dark:ring-green-900"
          />
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">
              {profile?.displayName || "Developer"}
            </p>
            <p className="text-[10px] leading-tight text-slate-400">
              {profile ? getFollowersCount(profile) : 0} followers
            </p>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
        </button>
      </div>
    </header>
  );
}
