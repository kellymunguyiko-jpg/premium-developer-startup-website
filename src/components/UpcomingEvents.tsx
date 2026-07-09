import { ArrowRight, Radio } from "lucide-react";
import { events } from "../data/dashboard";

export function UpcomingEvents() {
  return (
    <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Upcoming Events</h2>
        <button className="flex items-center gap-1 text-xs font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 rounded-xl border border-green-50 bg-green-50/20 p-3 transition-all hover:border-green-100 hover:bg-white hover:shadow-sm dark:border-green-900/30 dark:bg-green-950/20 dark:hover:border-green-800 dark:hover:bg-[#0d1210]"
          >
            <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-green-50 dark:bg-green-950">
              <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                {event.month}
              </span>
              <span className="text-lg font-black leading-none text-slate-900 dark:text-white">
                {event.day}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                {event.title}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                <Radio className="h-3 w-3 text-green-500" />
                {event.meta}
              </p>
              <button className="mt-2 rounded-lg border border-green-200 px-3 py-1 text-[10px] font-bold text-green-700 transition-all hover:bg-green-600 hover:text-white dark:border-green-800 dark:text-green-400 dark:hover:bg-green-600 dark:hover:text-white">
                Register Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
