import { MoreVertical, ArrowRight } from "lucide-react";
import { projects } from "../data/dashboard";

function TechIcon({ tech }: { tech: string }) {
  if (tech === "react") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-green-600 dark:text-green-400" fill="currentColor">
          <circle cx="12" cy="12" r="2.2" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(120 12 12)" />
        </svg>
      </div>
    );
  }

  if (tech === "js") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600">
        <span className="text-sm font-black tracking-tight text-white">JS</span>
      </div>
    );
  }

  if (tech === "python") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-green-600 dark:text-green-400" fill="currentColor">
          <path d="M12 2C8.5 2 8 3.5 8 5v2h8V5c0-1.5-.5-3-4-3zm-2 1.5a.75.75 0 110 1.5.75.75 0 010-1.5zM6 8c-1.5 0-3 .5-3 4s1.5 4 3 4h2v-2.5c0-1 .5-1.5 1.5-1.5h7c1 0 1.5-.5 1.5-1.5V8H6zm12 4v2.5c0 1-.5 1.5-1.5 1.5h-7c-1 0-1.5.5-1.5 1.5V20c0 1.5.5 3 4 3s4-1.5 4-3v-2h-8v-1.5c0-1 .5-1.5 1.5-1.5h7c1.5 0 3-.5 3-4s-1.5-4-3-4h-2v2.5c0 1-.5 1.5-1.5 1.5zM14 18.5a.75.75 0 110 1.5.75.75 0 010-1.5z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-green-600 bg-white dark:bg-[#111814]">
      <span className="text-xs font-black tracking-tight text-green-600 dark:text-green-400">JS</span>
    </div>
  );
}

export function RecentProjects() {
  return (
    <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Projects</h2>
        <button className="flex items-center gap-1 text-xs font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative rounded-2xl border border-green-50 bg-green-50/30 p-4 transition-all duration-200 hover:border-green-200 hover:bg-white hover:shadow-md hover:shadow-green-100/50 dark:border-green-900/30 dark:bg-green-950/20 dark:hover:border-green-800 dark:hover:bg-[#0d1210] dark:hover:shadow-green-900/20"
          >
            <button className="absolute right-3 top-3 rounded-lg p-1 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400">
              <MoreVertical className="h-4 w-4" />
            </button>
            <TechIcon tech={project.tech} />
            <h3 className="mt-3 text-[13px] font-bold text-slate-800 dark:text-slate-100">
              {project.title}
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">{project.stack}</p>
            <p className="mt-3 text-[10px] font-medium text-slate-400">
              {project.updated}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
