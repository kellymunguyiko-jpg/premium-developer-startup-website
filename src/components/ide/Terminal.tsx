import { useEffect, useRef, useState } from "react";
import {
  Terminal as TerminalIcon,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../utils/cn";

export type TerminalLine = {
  id: string;
  type: "input" | "output" | "error" | "info" | "success";
  text: string;
};

interface TerminalProps {
  lines: TerminalLine[];
  onCommand: (cmd: string) => void;
  onClear: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Terminal({
  lines,
  onCommand,
  onClear,
  collapsed,
  onToggle,
}: TerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    onCommand(cmd);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next =
        historyIndex === -1
          ? history.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex >= history.length - 1) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        const next = historyIndex + 1;
        setHistoryIndex(next);
        setInput(history[next]);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col border-t border-green-200 bg-[#0d1117] transition-all dark:border-green-900/50",
        collapsed ? "h-9" : "h-48 sm:h-56"
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/5 bg-[#161b22] px-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-3.5 w-3.5 text-green-400" />
          <span className="text-[11px] font-semibold text-slate-300">
            Terminal
          </span>
          <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[9px] font-medium text-green-400">
            online
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="rounded p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            title="Clear terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggle}
            className="rounded p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          className="flex flex-1 flex-col overflow-hidden"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[12px] leading-relaxed">
            {lines.map((line) => (
              <div
                key={line.id}
                className={cn(
                  "whitespace-pre-wrap break-all",
                  line.type === "input" && "text-green-400",
                  line.type === "output" && "text-slate-300",
                  line.type === "error" && "text-red-400",
                  line.type === "info" && "text-sky-400",
                  line.type === "success" && "text-emerald-400"
                )}
              >
                {line.type === "input" && (
                  <span className="mr-2 text-green-600">❯</span>
                )}
                {line.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-white/5 px-3 py-1.5"
          >
            <span className="font-mono text-[12px] text-green-600">❯</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent font-mono text-[12px] text-slate-200 outline-none placeholder:text-slate-600"
              placeholder="Type a command... (help, clear, run, ls)"
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </div>
      )}
    </div>
  );
}
