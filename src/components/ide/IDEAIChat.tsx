import { useEffect, useRef, useState } from "react";
import {
  Bot,
  X,
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
  ArrowDownToLine,
  FilePenLine,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "../../utils/cn";
import {
  chatWithCohere,
  isCohereConfigured,
  type ChatTurn,
} from "../../services/cohere";
import { useAuth } from "../../context/AuthContext";
import { aiRemainingMs, firstName } from "../../types/user";

export type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: string;
  language?: string;
  wroteToFile?: boolean;
  error?: boolean;
};

interface IDEAIChatProps {
  open: boolean;
  onClose: () => void;
  fileName?: string;
  language?: string;
  code?: string;
  onInsertCode: (code: string) => void;
  onReplaceCode: (code: string) => void;
  /** Auto-write generated code into the open file */
  autoWrite?: boolean;
}

const quickActions = [
  {
    id: "explain",
    label: "Explain code",
    icon: Lightbulb,
    prompt: "Explain this code clearly. Do not rewrite the whole file unless a short example helps.",
  },
  {
    id: "improve",
    label: "Improve code",
    icon: Wand2,
    prompt:
      "Improve and refactor this code. Return the full improved file in a fenced code block so I can write it into my editor.",
  },
  {
    id: "fix",
    label: "Find bugs",
    icon: Bug,
    prompt:
      "Find bugs and fix them. Return the full fixed file in a fenced code block.",
  },
  {
    id: "generate",
    label: "Generate code",
    icon: Code2,
    prompt:
      "Generate a useful complete example for this language/file. Return the full code in a fenced code block ready to write into the file.",
  },
];

let msgId = 0;
const nextMsgId = () => `ai-msg-${++msgId}`;

export function IDEAIChat({
  open,
  onClose,
  fileName = "untitled",
  language = "javascript",
  code = "",
  onInsertCode,
  onReplaceCode,
  autoWrite = true,
}: IDEAIChatProps) {
  const { consumeAIUsage, profile } = useAuth();
  const configured = isCohereConfigured();
  const greetName = firstName(profile?.displayName || "Developer");
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: nextMsgId(),
      role: "assistant",
      content: configured
        ? `Hi ${greetName}! 👋 I'm **DevAI** powered by **Cohere**.

I can explain, improve, debug, and generate code for **${fileName}**.

You get **3 free AI hours every day**. When you ask me to write or fix code, I'll put it into your open file automatically.`
        : `⚠️ Cohere API key is missing.

Add \`VITE_COHERE_API_KEY\` to your \`.env\` file and restart the app.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildHistory = (): ChatTurn[] =>
    messages
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.role,
        content: m.code
          ? `${m.content}\n\n\`\`\`${m.language || language}\n${m.code}\n\`\`\``
          : m.content,
      }));

  const sendPrompt = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || loading) return;

    if (!configured) {
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId(), role: "user", content: text },
        {
          id: nextMsgId(),
          role: "assistant",
          content:
            "Cohere API key is not configured. Set VITE_COHERE_API_KEY in .env and restart.",
          error: true,
        },
      ]);
      return;
    }

    if (profile && aiRemainingMs(profile.stats) <= 0) {
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId(), role: "user", content: text },
        {
          id: nextMsgId(),
          role: "assistant",
          content:
            "⏳ Free 3-hour AI quota used. Upgrade to Pro for more DevAI time.",
          error: true,
        },
      ]);
      return;
    }

    const userMsg: AIMessage = {
      id: nextMsgId(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const allowed = await consumeAIUsage(45_000);
      if (!allowed) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            role: "assistant",
            content:
              "⏳ Free AI quota exhausted (3 hours). Upgrade to continue.",
            error: true,
          },
        ]);
        setLoading(false);
        return;
      }

      const result = await chatWithCohere({
        prompt: text,
        fileName,
        language,
        code,
        history: buildHistory(),
      });

      let wroteToFile = false;
      if (result.code && autoWrite && result.shouldWriteToFile) {
        onReplaceCode(result.code);
        wroteToFile = true;
      }

      const assistantMsg: AIMessage = {
        id: nextMsgId(),
        role: "assistant",
        content: wroteToFile
          ? `${result.text}\n\n✅ **Code written into \`${fileName}\`**`
          : result.text,
        code: result.code,
        language: result.language || language,
        wroteToFile,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reach Cohere API";
      setMessages((prev) => [
        ...prev,
        {
          id: nextMsgId(),
          role: "assistant",
          content: `❌ **DevAI error:** ${message}

Check your API key, network, and Cohere account limits.`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return (
    <div className="flex h-full w-full flex-col border-l border-green-100 bg-white dark:border-green-900/40 dark:bg-[#0d1210] md:w-80 lg:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-green-50 px-3 py-2.5 dark:border-green-900/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-sm shadow-green-200 dark:shadow-green-900/40">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
              DevAI
              <span className="rounded bg-green-100 px-1 py-0.5 text-[9px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-400">
                Cohere
              </span>
            </p>
            <p className="flex items-center gap-1 text-[10px] text-slate-400">
              {configured ? (
                <>
                  <Wifi className="h-2.5 w-2.5 text-green-500" />
                  Live · {language}
                </>
              ) : (
                <>
                  <WifiOff className="h-2.5 w-2.5 text-red-400" />
                  API key missing
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
          title="Close AI"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* File context */}
      <div className="border-b border-green-50 px-3 py-2 dark:border-green-900/40">
        <p className="truncate text-[10px] text-slate-400">
          Editing:{" "}
          <span className="font-semibold text-green-700 dark:text-green-400">
            {fileName}
          </span>
          {autoWrite && (
            <span className="ml-2 rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-bold text-green-700 dark:bg-green-950 dark:text-green-400">
              Auto-write ON
            </span>
          )}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-1.5 border-b border-green-50 p-2 dark:border-green-900/40">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => void sendPrompt(action.prompt)}
            disabled={loading || !configured}
            className="flex items-center gap-1.5 rounded-lg border border-green-50 bg-green-50/40 px-2 py-1.5 text-left text-[10px] font-semibold text-slate-600 transition-all hover:border-green-200 hover:bg-white hover:text-green-700 disabled:opacity-50 dark:border-green-900/40 dark:bg-green-950/30 dark:text-slate-400 dark:hover:border-green-800 dark:hover:bg-[#111814] dark:hover:text-green-400"
          >
            <action.icon className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                msg.role === "assistant"
                  ? msg.error
                    ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                    : "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {msg.role === "assistant" ? (
                <Sparkles className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
                msg.role === "assistant"
                  ? msg.error
                    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "bg-green-50/60 text-slate-700 dark:bg-green-950/40 dark:text-slate-300"
                  : "bg-green-600 text-white"
              )}
            >
              <div className="whitespace-pre-wrap">
                {msg.content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
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
                        className="rounded bg-black/10 px-1 font-mono text-[11px] dark:bg-white/10"
                      >
                        {part.slice(1, -1)}
                      </code>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>

              {msg.wroteToFile && (
                <div className="mt-2 flex items-center gap-1 rounded-md bg-green-600/15 px-2 py-1 text-[10px] font-bold text-green-700 dark:text-green-400">
                  <FilePenLine className="h-3 w-3" />
                  Written to open file
                </div>
              )}

              {msg.code && (
                <div className="mt-2 overflow-hidden rounded-lg border border-green-200/60 bg-[#0d1117] dark:border-green-800/50">
                  <div className="flex items-center justify-between border-b border-white/5 px-2 py-1">
                    <span className="text-[10px] font-medium text-slate-400">
                      {msg.language ?? language}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.code!)}
                      className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                      title="Copy code"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <pre className="max-h-48 overflow-auto p-2 font-mono text-[10px] leading-relaxed text-slate-300">
                    {msg.code}
                  </pre>
                  <div className="flex gap-1 border-t border-white/5 p-1.5">
                    <button
                      onClick={() => onInsertCode(msg.code!)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md bg-green-600/20 px-2 py-1.5 text-[10px] font-bold text-green-400 transition-colors hover:bg-green-600/30"
                    >
                      <ArrowDownToLine className="h-3 w-3" />
                      Insert
                    </button>
                    <button
                      onClick={() => onReplaceCode(msg.code!)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-300 transition-colors hover:bg-white/10"
                    >
                      <FilePenLine className="h-3 w-3" />
                      Write file
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="rounded-xl bg-green-50/60 px-3 py-2 text-[12px] text-slate-500 dark:bg-green-950/40 dark:text-slate-400">
              DevAI is calling Cohere...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-green-50 p-2 dark:border-green-900/40"
      >
        <div className="flex items-end gap-2 rounded-xl border border-green-100 bg-green-50/30 p-2 focus-within:border-green-300 focus-within:ring-2 focus-within:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:focus-within:border-green-700 dark:focus-within:ring-green-900/30">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendPrompt(input);
              }
            }}
            rows={2}
            placeholder="Ask DevAI to write or fix code..."
            disabled={!configured || loading}
            className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-50 dark:text-slate-200 dark:placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !configured}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[9px] text-slate-400">
          Powered by DevSpace · Auto-writes code into open file
        </p>
      </form>
    </div>
  );
}
