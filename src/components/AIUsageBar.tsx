import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  aiRemainingMs,
  aiUsagePercent,
  formatDuration,
  FREE_AI_QUOTA_MS,
  withDailyAIReset,
} from "../types/user";
import { cn } from "../utils/cn";

export function AIUsageBar({ compact = false }: { compact?: boolean }) {
  const { profile } = useAuth();
  if (!profile) return null;

  const stats = withDailyAIReset(profile.stats);
  const pct = aiUsagePercent(stats);
  const remaining = aiRemainingMs(stats);
  const exhausted = remaining <= 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-green-50 bg-white shadow-sm dark:border-green-900/40 dark:bg-[#111814]",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Free AI today
            </p>
            <p className="text-[10px] text-slate-400">
              {exhausted
                ? "Quota used — resets tomorrow"
                : `${formatDuration(remaining)} left of 3h / day`}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "text-sm font-black tabular-nums",
            exhausted
              ? "text-red-500"
              : pct > 80
                ? "text-amber-500"
                : "text-green-600 dark:text-green-400"
          )}
        >
          {pct}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-green-100 dark:bg-green-950">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            exhausted
              ? "bg-red-500"
              : pct > 80
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-green-500 to-green-600"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {!compact && (
        <div className="mt-2 flex justify-between text-[10px] text-slate-400">
          <span>
            Used {formatDuration(stats.aiUsedMs || 0)} · {stats.aiUses || 0} AI
            requests
          </span>
          <span>Daily {formatDuration(stats.aiQuotaMs || FREE_AI_QUOTA_MS)}</span>
        </div>
      )}
    </div>
  );
}
