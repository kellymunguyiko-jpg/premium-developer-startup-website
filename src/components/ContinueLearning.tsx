import { ArrowRight } from "lucide-react";
import { courses } from "../data/dashboard";

function CourseIcon({ tech }: { tech: string }) {
  if (tech === "react") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-800">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-400" fill="currentColor">
          <circle cx="12" cy="12" r="1.8" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.3" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.3" transform="rotate(120 12 12)" />
        </svg>
      </div>
    );
  }

  if (tech === "node") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-800">
        <span className="text-[9px] font-black tracking-tighter text-green-400">
          node
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-800">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-400" fill="currentColor">
        <path d="M12 2C8.5 2 8 3.5 8 5v2h8V5c0-1.5-.5-3-4-3zm-2 1.5a.75.75 0 110 1.5.75.75 0 010-1.5zM6 8c-1.5 0-3 .5-3 4s1.5 4 3 4h2v-2.5c0-1 .5-1.5 1.5-1.5h7c1 0 1.5-.5 1.5-1.5V8H6zm12 4v2.5c0 1-.5 1.5-1.5 1.5h-7c-1 0-1.5.5-1.5 1.5V20c0 1.5.5 3 4 3s4-1.5 4-3v-2h-8v-1.5c0-1 .5-1.5 1.5-1.5h7c1.5 0 3-.5 3-4s-1.5-4-3-4h-2v2.5c0 1-.5 1.5-1.5 1.5zM14 18.5a.75.75 0 110 1.5.75.75 0 010-1.5z" />
      </svg>
    </div>
  );
}

export function ContinueLearning() {
  return (
    <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Continue Learning</h2>
        <button className="flex items-center gap-1 text-xs font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex flex-col gap-3 rounded-xl border border-green-50 bg-green-50/20 p-3 transition-all hover:border-green-100 hover:bg-white hover:shadow-sm dark:border-green-900/30 dark:bg-green-950/20 dark:hover:border-green-800 dark:hover:bg-[#0d1210] sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <CourseIcon tech={course.tech} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  {course.title}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-green-100 dark:bg-green-950">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-green-600 dark:text-green-400">
                    {course.progress}%
                  </span>
                </div>
              </div>
            </div>
            <button className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-green-200 transition-all hover:bg-green-700 hover:shadow-md active:scale-[0.98] dark:shadow-green-900/30">
              Continue
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
