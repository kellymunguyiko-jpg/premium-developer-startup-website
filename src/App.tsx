import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { StatsGrid } from "./components/StatsGrid";
import { RecentProjects } from "./components/RecentProjects";
import { ContinueLearning } from "./components/ContinueLearning";
import { DeveloperTools } from "./components/DeveloperTools";
import { ProfileCard } from "./components/ProfileCard";
import { AIAssistant } from "./components/AIAssistant";
import { CommunityFeed } from "./components/CommunityFeed";
import { UpcomingEvents } from "./components/UpcomingEvents";
import { IDEWorkspace } from "./components/ide/IDEWorkspace";
import { AIAssistantPage } from "./components/AIAssistantPage";
import { SettingsPage } from "./components/SettingsPage";
import { AdminPage } from "./components/AdminPage";
import { AIUsageBar } from "./components/AIUsageBar";
import { CoursesPage } from "./components/CoursesPage";
import { BooksPage } from "./components/BooksPage";
import { MessagesPage } from "./components/MessagesPage";
import { CommunityPage } from "./components/CommunityPage";
import { NotificationsPage } from "./components/NotificationsPage";
import { VideosPage } from "./components/VideosPage";
import { ToolsPage } from "./components/ToolsPage";
import { ProjectsPage } from "./components/ProjectsPage";
import { CertificatesPage } from "./components/CertificatesPage";
import { GlobalCallListener } from "./components/GlobalCallListener";
import { InstallAppBanner } from "./components/InstallAppBanner";
import { BlockedPage } from "./components/BlockedPage";
import { LoginPage } from "./components/auth/LoginPage";
import { useAuth } from "./context/AuthContext";
import { firstName, getFollowersCount, getFollowingCount } from "./types/user";
import { cn } from "./utils/cn";

export default function App() {
  const { user, profile, loading } = useAuth();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("json");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7faf7] dark:bg-[#0a0f0c]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm text-slate-500">Loading DevSpace Pro…</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginPage />;
  }

  // Blocked users only see red blocked page
  if (profile.blocked) {
    return <BlockedPage />;
  }

  const isWorkspace = activeNav === "workspace";
  const isAI = activeNav === "ai";
  const isSettings = activeNav === "settings";
  const isAdmin = activeNav === "admin";
  const isCourses = activeNav === "courses";
  const isBooks = activeNav === "books";
  const isMessages = activeNav === "messages";
  const isCommunity = activeNav === "community";
  const isNotifications = activeNav === "notifications";
  const isVideos = activeNav === "videos";
  const isTools = activeNav === "tools";
  const isProjects = activeNav === "projects";
  const isCertificates = activeNav === "certificates";
  const fullBleed = isAI || isMessages;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7faf7] transition-colors dark:bg-[#0a0f0c]">
      <Sidebar
        active={activeNav}
        onNavigate={setActiveNav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Global incoming video call ring + accept UI */}
      <GlobalCallListener />
      {/* Easy Install App banner (Chrome also shows address-bar install icon) */}
      <InstallAppBanner />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onOpenNotifications={() => setActiveNav("notifications")}
          onOpenMessages={() => setActiveNav("messages")}
        />

        <main
          className={cn(
            "min-h-0 flex-1",
            fullBleed
              ? "overflow-hidden p-0"
              : isWorkspace
                ? "overflow-y-auto p-3 sm:p-4"
                : "overflow-y-auto p-4 sm:p-6"
          )}
        >
          {isWorkspace ? (
            <div className="mx-auto max-w-[1600px]">
              <div className="mb-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  Online Coding IDE + DevAI
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Code online · 3h free AI / day · video calls 1:30
                </p>
              </div>
              <IDEWorkspace />
            </div>
          ) : isAI ? (
            <AIAssistantPage onOpenIDE={() => setActiveNav("workspace")} />
          ) : isCourses ? (
            <CoursesPage />
          ) : isBooks ? (
            <BooksPage />
          ) : isVideos ? (
            <VideosPage />
          ) : isTools ? (
            <ToolsPage initialTool={activeTool} />
          ) : isProjects ? (
            <ProjectsPage />
          ) : isCertificates ? (
            <CertificatesPage />
          ) : isMessages ? (
            <MessagesPage />
          ) : isCommunity ? (
            <CommunityPage onOpenMessages={() => setActiveNav("messages")} />
          ) : isNotifications ? (
            <NotificationsPage />
          ) : isSettings ? (
            <SettingsPage onOpenAdmin={() => setActiveNav("admin")} />
          ) : isAdmin ? (
            <AdminPage />
          ) : (
            <div className="mx-auto max-w-[1400px]">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    Welcome back, {firstName(profile.displayName)}! 👋
                  </h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {getFollowersCount(profile)} followers ·{" "}
                    {getFollowingCount(profile)} following
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveNav("ai")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-green-600 px-5 py-2.5 text-sm font-semibold text-green-700 transition-all hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    Open AI Chat
                  </button>
                  <button
                    onClick={() => setActiveNav("workspace")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-green-600 px-5 py-2.5 text-sm font-semibold text-green-700 transition-all hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    Open Online IDE
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all hover:bg-green-700 dark:shadow-green-900/30">
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    New Project
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="space-y-5 xl:col-span-8 2xl:col-span-9">
                  <StatsGrid />
                  <RecentProjects />
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <ContinueLearning />
                    <DeveloperTools
                      onOpenTools={(id) => {
                        if (id) setActiveTool(id);
                        setActiveNav("tools");
                      }}
                    />
                  </div>
                  <CommunityFeed />
                </div>
                <div className="space-y-5 xl:col-span-4 2xl:col-span-3">
                  <ProfileCard onViewProfile={() => setActiveNav("settings")} />
                  <AIUsageBar />
                  <AIAssistant onOpenChat={() => setActiveNav("ai")} />
                  <UpcomingEvents />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
