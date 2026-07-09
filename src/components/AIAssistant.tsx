import {
  Bot,
  Code2,
  Bug,
  Lightbulb,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { firstName } from "../types/user";

const actions = [
  { label: "Generate Code", icon: Code2 },
  { label: "Explain Error", icon: Bug },
  { label: "Project Ideas", icon: Lightbulb },
  { label: "Improve Code", icon: Sparkles },
];

interface AIAssistantProps {
  onOpenChat?: () => void;
}

export function AIAssistant({ onOpenChat }: AIAssistantProps) {
  const { profile } = useAuth();
  const name = firstName(profile?.displayName || "Developer");

  return (
    <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          AI Assistant{" "}
          <span className="font-semibold text-slate-400">(DevAI)</span>
        </h2>
        <button
          onClick={onOpenChat}
          className="text-xs font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          New Chat
        </button>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl bg-green-50/50 p-3 dark:bg-green-950/40">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
            Hi {name}! 👋
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            How can I help you today? (3h free AI / day)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={onOpenChat}
            className="flex items-center gap-2 rounded-xl border border-green-50 bg-green-50/20 px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 transition-all hover:border-green-200 hover:bg-white hover:text-green-700 hover:shadow-sm dark:border-green-900/30 dark:bg-green-950/20 dark:text-slate-400 dark:hover:border-green-800 dark:hover:bg-[#0d1210] dark:hover:text-green-400"
          >
            <action.icon className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
            {action.label}
          </button>
        ))}
      </div>

      <button
        onClick={onOpenChat}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-xs font-bold text-white shadow-md shadow-green-200 transition-all hover:bg-green-700 hover:shadow-lg active:scale-[0.98] dark:shadow-green-900/30"
      >
        Open DevAI Chat <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
