import { Code2, Clock, GraduationCap, Bot, GitBranch } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { LucideIcon } from "lucide-react";

export function StatsGrid() {
  const { profile } = useAuth();
  const stats = profile?.stats;

  const items: {
    id: string;
    label: string;
    value: string;
    change: string;
    icon: LucideIcon;
  }[] = [
    {
      id: "projects",
      label: "Total Projects",
      value: String(stats?.totalProjects ?? 0),
      change: "Saved from IDE",
      icon: Code2,
    },
    {
      id: "hours",
      label: "Coding Hours",
      value: `${(stats?.codingHours ?? 0).toFixed(1)}h`,
      change: "Tracked while active",
      icon: Clock,
    },
    {
      id: "courses",
      label: "Courses Completed",
      value: String(stats?.coursesCompleted ?? 0),
      change: "Learning progress",
      icon: GraduationCap,
    },
    {
      id: "ai",
      label: "AI Uses",
      value: String(stats?.aiUses ?? 0),
      change: "DevAI requests",
      icon: Bot,
    },
    {
      id: "github",
      label: "GitHub Activity",
      value: String(stats?.githubActivity ?? 0),
      change: profile?.provider === "github" ? "GitHub account" : "Synced later",
      icon: GitBranch,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="card-hover rounded-2xl border border-green-50 bg-white p-4 shadow-sm dark:border-green-900/40 dark:bg-[#111814]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              {stat.label}
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-1.5 text-[11px] font-medium text-green-600 dark:text-green-400">
              {stat.change}
            </p>
          </div>
        );
      })}
    </div>
  );
}
