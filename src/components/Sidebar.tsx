import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  BookOpen,
  PlayCircle,
  Book,
  Sparkles,
  Users,
  Code2,
  FolderKanban,
  Wrench,
  Award,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  Crown,
  Shield,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useAuth } from "../context/AuthContext";
import { listenNotifications } from "../services/notifications";
import { listenMyChats } from "../services/contentStore";

const iconMap: Record<string, LucideIcon> = {
  layout: LayoutDashboard,
  workspace: Boxes,
  "book-open": BookOpen,
  play: PlayCircle,
  book: Book,
  sparkles: Sparkles,
  users: Users,
  "code-2": Code2,
  folder: FolderKanban,
  wrench: Wrench,
  award: Award,
  message: MessageSquare,
  bell: Bell,
  settings: Settings,
  help: HelpCircle,
  admin: Shield,
};

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ active, onNavigate, open, onClose }: SidebarProps) {
  const { profile, logout } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const unsubN = listenNotifications(profile.uid, (items) => {
      setUnreadNotifs(items.filter((n) => !n.read).length);
    });

    // Live total messages (conversations) count
    const unsubC = listenMyChats(profile.uid, (chats) => {
      // If currently viewing Messages, keep badge at 0
      if (active === "messages") {
        setInboxCount(0);
        return;
      }
      setInboxCount(chats.length);
    });

    return () => {
      unsubN();
      unsubC();
    };
  }, [profile?.uid, active]);

  // When user opens Messages, badge goes to 0
  useEffect(() => {
    if (active === "messages") {
      setInboxCount(0);
    }
  }, [active]);

  const baseNav = [
    { id: "dashboard", label: "Dashboard", icon: "layout", badge: null as string | null },
    { id: "workspace", label: "Workspace", icon: "workspace", badge: null },
    { id: "courses", label: "Courses", icon: "book-open", badge: null },
    { id: "videos", label: "Videos", icon: "play", badge: null },
    { id: "books", label: "Books", icon: "book", badge: null },
    { id: "ai", label: "AI Assistant", icon: "sparkles", badge: "New" },
    { id: "community", label: "Community", icon: "users", badge: null },
    { id: "developers", label: "Developers", icon: "code-2", badge: null },
    { id: "projects", label: "Projects", icon: "folder", badge: null },
    { id: "tools", label: "Tools", icon: "wrench", badge: null },
    { id: "certificates", label: "Certificates", icon: "award", badge: null },
    {
      id: "messages",
      label: "Messages",
      icon: "message",
      badge: inboxCount > 0 ? String(inboxCount > 99 ? "99+" : inboxCount) : null,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "bell",
      badge: unreadNotifs > 0 ? String(unreadNotifs > 99 ? "99+" : unreadNotifs) : null,
    },
    { id: "settings", label: "Settings", icon: "settings", badge: null },
    { id: "help", label: "Help & Support", icon: "help", badge: null },
  ];

  const navItems = profile?.isAdmin
    ? [
        ...baseNav.slice(0, 6),
        { id: "admin", label: "Admin", icon: "admin", badge: "Admin" },
        ...baseNav.slice(6),
      ]
    : baseNav;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] dark:bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-green-100 bg-white transition-transform duration-300 dark:border-green-900/40 dark:bg-[#0d1210] lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-green-50 px-5 dark:border-green-900/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-green-200 dark:shadow-green-900/40">
            <Code2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              DevSpace{" "}
              <span className="text-green-600 dark:text-green-400">Pro</span>
            </h1>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "certificates") {
                    window.open(
                      "https://certificatesdev.netlify.app",
                      "_blank",
                      "noopener,noreferrer"
                    );
                    onClose();
                    return;
                  }
                  onNavigate(item.id);
                  onClose();
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900/40"
                    : "text-slate-600 hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950/60 dark:hover:text-green-400"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-green-600 dark:text-slate-500 dark:group-hover:text-green-400"
                  )}
                  strokeWidth={2}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge === "New" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400"
                    )}
                  >
                    New
                  </span>
                )}
                {item.badge === "Admin" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    )}
                  >
                    Admin
                  </span>
                )}
                {item.badge &&
                  item.badge !== "New" &&
                  item.badge !== "Admin" && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        isActive
                          ? "bg-white text-green-700"
                          : "bg-green-600 text-white"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 p-3">
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-5 text-white shadow-lg shadow-green-200 dark:shadow-green-900/30">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-bold">Upgrade to Pro</h3>
              <p className="mt-1 text-xs leading-relaxed text-green-100">
                Unlock more AI hours and premium content.
              </p>
              <button className="mt-4 w-full rounded-xl bg-white py-2.5 text-xs font-bold text-green-700 shadow-sm transition-all hover:bg-green-50">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
