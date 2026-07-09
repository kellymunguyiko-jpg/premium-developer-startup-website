import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Code2,
  Bug,
  Lightbulb,
  Wand2,
  Copy,
  Check,
  Loader2,
  User,
  Plus,
  Trash2,
  MessageSquare,
  Wifi,
  WifiOff,
  BookOpen,
  Rocket,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  chatGeneralAI,
  isCohereConfigured,
  type ChatTurn,
} from "../services/cohereChat";
import { useAuth } from "../context/AuthContext";
import { AIUsageBar } from "./AIUsageBar";
import { aiRemainingMs, firstName } from "../types/user";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: string;
  language?: string;
  error?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const STORAGE_KEY = "devspace-ai-chats";

const suggestions = [
  {
    icon: Code2,
    title: "Generate code",
    prompt: "Write a clean React login form with validation using Tailwind CSS.",
  },
  {
    icon: Bug,
    title: "Explain an error",
    prompt:
      "Explain what TypeError: Cannot read properties of undefined means and how to fix it in JavaScript.",
  },
  {
    icon: Lightbulb,
    title: "Project ideas",
    prompt:
      "Give me 5 full-stack project ideas for a portfolio, with tech stack for each.",
  },
  {
    icon: Wand2,
    title: "Improve code",
    prompt:
      "Show best practices to refactor messy JavaScript into clean modern ES modules.",
  },
  {
    icon: BookOpen,
    title: "Learn path",
    prompt:
      "Create a 30-day learning path to become a full stack developer (React + Node.js).",
  },
  {
    icon: Rocket,
    title: "Build API",
    prompt:
      "Design a REST API for a task manager with endpoints, models, and example Node/Express code.",
  },
];

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${++idCounter}`;

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ChatSession[];
  } catch {
    /* ignore */
  }
  return [];
}

function createEmptySession(userName = "Developer"): ChatSession {
  const name = firstName(userName);
  return {
    id: `chat-${Date.now()}`,
    title: "New chat",
    updatedAt: Date.now(),
    messages: [
      {
        id: nextId(),
        role: "assistant",
        content: isCohereConfigured()
          ? `Hi ${name}! 👋 I'm **DevAI**, your AI Assistant powered by **Cohere**.

You have **3 free hours of AI every day**.

Ask me anything about coding, debugging, project ideas, or learning.

Try a suggestion below or type your question.`
          : `⚠️ Cohere API key is missing.

Add \`VITE_COHERE_API_KEY\` to \`.env\` and restart the app.`,
      },
    ],
  };
}

function extractCodeFromText(text: string): {
  explanation: string;
  code?: string;
  language?: string;
} {
  const fence = /```([a-zA-Z0-9_+-]*)\s*\n([\s\S]*?)```/;
  const match = text.match(fence);
  if (!match) return { explanation: text };
  return {
    explanation: text.replace(match[0], "").replace(/\n{3,}/g, "\n\n").trim() || "Here's the code:",
    language: match[1] || "javascript",
    code: match[2].replace(/\n$/, ""),
  };
}

export function AIAssistantPage({
  onOpenIDE,
}: {
  onOpenIDE?: () => void;
}) {
  const { consumeAIUsage, profile } = useAuth();
  const configured = isCohereConfigured();
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = loadSessions();
    return saved.length > 0
      ? saved
      : [createEmptySession(profile?.displayName || "Developer")];
  });
  const [activeId, setActiveId] = useState(() => sessions[0]?.id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  const updateActive = (updater: (s: ChatSession) => ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === active.id ? updater(s) : s))
    );
  };

  const newChat = () => {
    const session = createEmptySession(profile?.displayName || "Developer");
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
  };

  const deleteChat = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const empty = createEmptySession();
        setActiveId(empty.id);
        return [empty];
      }
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  };

  const send = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || loading || !active) return;

    if (!configured) {
      updateActive((s) => ({
        ...s,
        updatedAt: Date.now(),
        messages: [
          ...s.messages,
          { id: nextId(), role: "user", content: text },
          {
            id: nextId(),
            role: "assistant",
            content:
              "Cohere API key is not configured. Set VITE_COHERE_API_KEY in .env and restart.",
            error: true,
          },
        ],
      }));
      return;
    }

    if (profile && aiRemainingMs(profile.stats) <= 0) {
      updateActive((s) => ({
        ...s,
        updatedAt: Date.now(),
        messages: [
          ...s.messages,
          { id: nextId(), role: "user", content: text },
          {
            id: nextId(),
            role: "assistant",
            content:
              "⏳ Your free **3 hours / day** AI quota is used up. Come back tomorrow for a fresh free trial, or upgrade to Pro.",
            error: true,
          },
        ],
      }));
      return;
    }

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
    };

    const history: ChatTurn[] = active.messages
      .filter((m) => !m.error)
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.code
          ? `${m.content}\n\n\`\`\`${m.language || "javascript"}\n${m.code}\n\`\`\``
          : m.content,
      }));

    updateActive((s) => {
      const title =
        s.title === "New chat"
          ? text.slice(0, 42) + (text.length > 42 ? "…" : "")
          : s.title;
      return {
        ...s,
        title,
        updatedAt: Date.now(),
        messages: [...s.messages, userMsg],
      };
    });
    setInput("");
    setLoading(true);

    try {
      const allowed = await consumeAIUsage(45_000);
      if (!allowed) {
        updateActive((s) => ({
          ...s,
          updatedAt: Date.now(),
          messages: [
            ...s.messages,
            {
              id: nextId(),
              role: "assistant",
              content:
                "⏳ Free AI quota exhausted (**3 hours today**). Resets tomorrow, or upgrade to Pro.",
              error: true,
            },
          ],
        }));
        setLoading(false);
        return;
      }

      const result = await chatGeneralAI({
        prompt: text,
        history,
      });

      // Prefer code from service parse; also re-parse text if needed
      let code = result.code;
      let language = result.language;
      let content = result.text;

      if (!code) {
        const parsed = extractCodeFromText(result.text);
        code = parsed.code;
        language = parsed.language;
        content = parsed.explanation;
      }

      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: "assistant",
        content,
        code,
        language,
      };

      updateActive((s) => ({
        ...s,
        updatedAt: Date.now(),
        messages: [...s.messages, assistantMsg],
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reach Cohere API";
      updateActive((s) => ({
        ...s,
        updatedAt: Date.now(),
        messages: [
          ...s.messages,
          {
            id: nextId(),
            role: "assistant",
            content: `❌ **Error:** ${message}\n\nCheck your API key, network, and Cohere limits.`,
            error: true,
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const showWelcome =
    active &&
    active.messages.length <= 1 &&
    active.messages[0]?.role === "assistant";

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-white dark:bg-[#0d1210]">
      {/* Chat history panel (does NOT hide main app sidebar) */}
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-green-50 bg-green-50/20 transition-[width] duration-200 dark:border-green-900/40 dark:bg-[#0a0f0c]",
          historyOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-green-50 px-3 dark:border-green-900/40">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Chats
          </p>
          <button
            onClick={newChat}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-green-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 transition-colors",
                session.id === active?.id
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : "text-slate-600 hover:bg-green-50 dark:text-slate-400 dark:hover:bg-green-950/40"
              )}
              onClick={() => setActiveId(session.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                {session.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(session.id);
                }}
                className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat — full height top to bottom */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-green-50 px-4 dark:border-green-900/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
              title={historyOpen ? "Hide chat list" : "Show chat list"}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-green-200 dark:shadow-green-900/30">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                AI Assistant
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-400">
                  Cohere
                </span>
              </h1>
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                {configured ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    Live chat · DevAI
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-400" />
                    API key missing
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={newChat}
              className="hidden items-center gap-1.5 rounded-xl border border-green-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-green-50 dark:border-green-900/50 dark:text-slate-400 dark:hover:bg-green-950 sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>
            {onOpenIDE && (
              <button
                onClick={onOpenIDE}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-green-700"
              >
                <Code2 className="h-3.5 w-3.5" />
                Open IDE
              </button>
            )}
          </div>
        </div>

        {/* Messages — fills remaining height */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {active?.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    msg.role === "assistant"
                      ? msg.error
                        ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                        : "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>

                <div
                  className={cn(
                    "max-w-[min(100%,640px)] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                    msg.role === "assistant"
                      ? msg.error
                        ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : "bg-green-50/70 text-slate-700 dark:bg-green-950/40 dark:text-slate-300"
                      : "bg-green-600 text-white"
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {msg.content
                      .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
                      .map((part, i) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong key={i} className="font-bold">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        if (part.startsWith("`") && part.endsWith("`")) {
                          return (
                            <code
                              key={i}
                              className="rounded bg-black/10 px-1 font-mono text-[12px] dark:bg-white/10"
                            >
                              {part.slice(1, -1)}
                            </code>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                  </div>

                  {msg.code && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-green-200/50 bg-[#0d1117] dark:border-green-800/40">
                      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
                        <span className="text-[11px] font-medium text-slate-400">
                          {msg.language || "code"}
                        </span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.code!)}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-green-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="max-h-72 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                        {msg.code}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {showWelcome && configured && (
              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => void send(s.prompt)}
                    disabled={loading}
                    className="flex items-start gap-3 rounded-2xl border border-green-50 bg-white p-3.5 text-left transition-all hover:border-green-200 hover:shadow-md hover:shadow-green-100/40 disabled:opacity-50 dark:border-green-900/40 dark:bg-[#111814] dark:hover:border-green-800 dark:hover:shadow-green-900/20"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                        {s.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">
                        {s.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-2xl bg-green-50/70 px-4 py-3 text-[13px] text-slate-500 dark:bg-green-950/40 dark:text-slate-400">
                  DevAI is thinking with Cohere...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer — pinned to bottom */}
        <div className="shrink-0 border-t border-green-50 bg-white p-3 sm:p-4 dark:border-green-900/40 dark:bg-[#0d1210]">
          <div className="mx-auto mb-3 max-w-3xl">
            <AIUsageBar compact />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="mx-auto max-w-3xl"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-green-100 bg-green-50/30 p-2 shadow-sm focus-within:border-green-300 focus-within:ring-2 focus-within:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:focus-within:border-green-700 dark:focus-within:ring-green-900/30">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={2}
                placeholder="Message DevAI… (coding help, ideas, debug, learn)"
                disabled={!configured || loading}
                className="max-h-36 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-50 dark:text-slate-200 dark:placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || !configured}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-md shadow-green-200 transition-all hover:bg-green-700 disabled:opacity-40 dark:shadow-green-900/30"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              Powered by DevSpace · Enter to send · Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
