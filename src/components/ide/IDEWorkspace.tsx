import { useCallback, useEffect, useMemo, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
  Play,
  Save,
  Download,
  Settings2,
  Maximize2,
  Minimize2,
  Code2,
  Loader2,
  Share2,
  Copy,
  Check,
  Users,
  Wifi,
  Keyboard,
  Bot,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { FileExplorer } from "./FileExplorer";
import { EditorTabs } from "./EditorTabs";
import { Terminal, type TerminalLine } from "./Terminal";
import { NewFileModal } from "./NewFileModal";
import { IDEAIChat } from "./IDEAIChat";
import {
  createInitialTree,
  findFileById,
  updateFileContent,
  addFileToTree,
  deleteFromTree,
  languageOptions,
  type FileNode,
} from "../../data/ideFiles";
import { cn } from "../../utils/cn";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

let lineId = 0;
const nextId = () => `line-${++lineId}`;

const STORAGE_KEY = "devspace-ide-files";

function loadTree(): FileNode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as FileNode[];
  } catch {
    /* ignore */
  }
  return createInitialTree();
}

function extractJsOutput(code: string): string[] {
  const outputs: string[] = [];
  const logs = code.match(/console\.log\(([\s\S]*?)\);?/g) ?? [];
  for (const log of logs) {
    const inner = log
      .replace(/^console\.log\(/, "")
      .replace(/\);?$/, "")
      .trim();

    if (
      (inner.startsWith('"') && inner.endsWith('"')) ||
      (inner.startsWith("'") && inner.endsWith("'")) ||
      (inner.startsWith("`") && inner.endsWith("`") && !inner.includes("${"))
    ) {
      outputs.push(inner.slice(1, -1));
      continue;
    }

    if (inner.includes("greet(") || /Hello,.*Welcome to DevSpace/.test(code)) {
      if (!outputs.includes("Hello, Iradukunda Dev! Welcome to DevSpace Pro.")) {
        outputs.push("Hello, Iradukunda Dev! Welcome to DevSpace Pro.");
      }
      continue;
    }

    if (inner.includes("introduce") || inner.includes("me.")) {
      outputs.push(
        "Iradukunda Dev is a Full Stack Developer skilled in React, Node.js, TypeScript, Python"
      );
      continue;
    }

    if (inner.includes("forEach") || inner.includes("projects")) {
      outputs.push("1. E-commerce", "2. Portfolio", "3. AI Chatbot");
      continue;
    }
  }

  if (outputs.length === 0) {
    outputs.push(
      "Hello, Iradukunda Dev! Welcome to DevSpace Pro.",
      "1. E-commerce",
      "2. Portfolio",
      "3. AI Chatbot"
    );
  }

  return [...new Set(outputs)];
}

function simulateRun(
  language: string,
  filename: string,
  code: string
): TerminalLine[] {
  const lines: TerminalLine[] = [
    {
      id: nextId(),
      type: "info",
      text: `▶ Running ${filename} (${language}) online...`,
    },
  ];

  if (language === "javascript" || language === "typescript") {
    extractJsOutput(code).forEach((text) =>
      lines.push({ id: nextId(), type: "output", text })
    );
  } else if (language === "python") {
    lines.push(
      {
        id: nextId(),
        type: "output",
        text: "Hello, Iradukunda Dev! Welcome to DevSpace Pro.",
      },
      { id: nextId(), type: "output", text: "1. E-commerce" },
      { id: nextId(), type: "output", text: "2. Portfolio" },
      { id: nextId(), type: "output", text: "3. AI Chatbot" },
      {
        id: nextId(),
        type: "output",
        text: "Iradukunda — Full Stack Developer",
      }
    );
  } else if (
    [
      "java",
      "cpp",
      "c",
      "csharp",
      "go",
      "rust",
      "kotlin",
      "swift",
      "php",
      "ruby",
      "shell",
    ].includes(language)
  ) {
    lines.push(
      {
        id: nextId(),
        type: "output",
        text: "Hello, Iradukunda Dev! Welcome to DevSpace Pro.",
      },
      { id: nextId(), type: "output", text: "1. E-commerce" },
      { id: nextId(), type: "output", text: "2. Portfolio" },
      { id: nextId(), type: "output", text: "3. AI Chatbot" }
    );
  } else if (language === "sql") {
    lines.push(
      {
        id: nextId(),
        type: "info",
        text: "Connected to DevSpace PostgreSQL (cloud)",
      },
      {
        id: nextId(),
        type: "output",
        text: " name            | role                   | skill_count",
      },
      {
        id: nextId(),
        type: "output",
        text: "-----------------+------------------------+-------------",
      },
      {
        id: nextId(),
        type: "output",
        text: " Iradukunda Dev  | Full Stack Developer   |           3",
      },
      {
        id: nextId(),
        type: "output",
        text: " Alice Johnson   | Frontend Engineer      |           2",
      },
      {
        id: nextId(),
        type: "output",
        text: " Marcus Chen     | Backend Engineer       |           2",
      },
      { id: nextId(), type: "success", text: "(3 rows)" }
    );
  } else if (language === "html") {
    lines.push(
      { id: nextId(), type: "success", text: "✓ HTML validated successfully" },
      {
        id: nextId(),
        type: "info",
        text: "Preview ready — open in browser tab",
      }
    );
  } else if (language === "json") {
    try {
      JSON.parse(code);
      lines.push({ id: nextId(), type: "success", text: "✓ Valid JSON" });
    } catch {
      lines.push({ id: nextId(), type: "error", text: "✗ Invalid JSON syntax" });
    }
  } else {
    lines.push(
      {
        id: nextId(),
        type: "output",
        text: "Hello, Iradukunda Dev! Welcome to DevSpace Pro.",
      },
      {
        id: nextId(),
        type: "info",
        text: `Executed ${filename} successfully`,
      }
    );
  }

  lines.push({
    id: nextId(),
    type: "success",
    text: `✓ Finished in ${(Math.random() * 200 + 50).toFixed(0)}ms · Online runtime`,
  });

  return lines;
}

const onlineUsers = [
  { name: "You", color: "bg-green-500", self: true },
  { name: "Alice", color: "bg-emerald-400", self: false },
  { name: "Marcus", color: "bg-lime-500", self: false },
];

export function IDEWorkspace() {
  const { isDark, toggleTheme } = useTheme();
  const { recordProjectSaved } = useAuth();
  const [tree, setTree] = useState<FileNode[]>(loadTree);
  const [openFileIds, setOpenFileIds] = useState<string[]>(["file-main-js"]);
  const [activeFileId, setActiveFileId] = useState<string | null>("file-main-js");
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: nextId(),
      type: "info",
      text: "DevSpace Online IDE v2.1 — AI-powered coding workspace",
    },
    {
      id: nextId(),
      type: "success",
      text: "Connected · Type 'help' · Press Run ▶ · Open DevAI with Ctrl/⌘+I",
    },
  ]);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [running, setRunning] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  }, [tree]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (mod && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      } else if (mod && e.key === "b") {
        e.preventDefault();
        setExplorerOpen((v) => !v);
      } else if (mod && e.key === "j") {
        e.preventDefault();
        setTerminalCollapsed((v) => !v);
      } else if (mod && e.key === "i") {
        e.preventDefault();
        setAiOpen((v) => !v);
      } else if (mod && e.key === "n" && e.shiftKey) {
        e.preventDefault();
        setShowNewFile(true);
      } else if (mod && e.key === "d" && e.shiftKey) {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId, tree, toggleTheme]);

  const openFiles = useMemo(() => {
    return openFileIds
      .map((id) => findFileById(tree, id))
      .filter((f): f is FileNode => f !== null && f.type === "file");
  }, [openFileIds, tree]);

  const activeFile = useMemo(
    () => (activeFileId ? findFileById(tree, activeFileId) : null),
    [activeFileId, tree]
  );

  const monacoLanguage = useMemo(() => {
    if (!activeFile?.language) return "plaintext";
    const lang = languageOptions.find((l) => l.id === activeFile.language);
    return lang?.monaco ?? activeFile.language;
  }, [activeFile]);

  const openFile = useCallback((id: string) => {
    setOpenFileIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveFileId(id);
  }, []);

  const closeFile = useCallback(
    (id: string) => {
      setOpenFileIds((prev) => {
        const next = prev.filter((fid) => fid !== id);
        if (activeFileId === id) {
          setActiveFileId(next[next.length - 1] ?? null);
        }
        return next;
      });
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [activeFileId]
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!activeFileId || value === undefined) return;
      setTree((prev) => updateFileContent(prev, activeFileId, value));
      setDirtyIds((prev) => new Set(prev).add(activeFileId));
    },
    [activeFileId]
  );

  const handleSave = useCallback(() => {
    if (!activeFileId) return;
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(activeFileId);
      return next;
    });
    setSavedFlash(true);
    setTerminalLines((prev) => [
      ...prev,
      {
        id: nextId(),
        type: "success",
        text: `✓ Saved ${activeFile?.name ?? "file"} to cloud workspace`,
      },
    ]);
    void recordProjectSaved();
    setTimeout(() => setSavedFlash(false), 1500);
  }, [activeFile, activeFileId, recordProjectSaved]);

  const handleRun = useCallback(() => {
    if (!activeFile || activeFile.type !== "file") return;
    setRunning(true);
    setTerminalCollapsed(false);

    setTimeout(() => {
      const result = simulateRun(
        activeFile.language ?? "plaintext",
        activeFile.name,
        activeFile.content ?? ""
      );
      setTerminalLines((prev) => [...prev, ...result]);
      setRunning(false);
    }, 350 + Math.random() * 450);
  }, [activeFile]);

  const handleDownload = useCallback(() => {
    if (!activeFile?.content) return;
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFile]);

  const handleShare = useCallback(async () => {
    const link = `${window.location.origin}${window.location.pathname}?ide=shared&file=${activeFile?.name ?? "main"}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTerminalLines((prev) => [
        ...prev,
        {
          id: nextId(),
          type: "success",
          text: `✓ Share link copied — collaborators can open this workspace online`,
        },
      ]);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setTerminalLines((prev) => [
        ...prev,
        { id: nextId(), type: "info", text: `Share: ${link}` },
      ]);
    }
  }, [activeFile]);

  const handleNewFile = useCallback(
    (name: string, language: string, content: string) => {
      const id = `file-${Date.now()}`;
      const file: FileNode = {
        id,
        name,
        type: "file",
        language,
        content,
      };
      setTree((prev) => addFileToTree(prev, "folder-src", file));
      openFile(id);
      setTerminalLines((prev) => [
        ...prev,
        {
          id: nextId(),
          type: "info",
          text: `Created ${name} · language: ${language}`,
        },
      ]);
    },
    [openFile]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const file = findFileById(tree, id);
      setTree((prev) => deleteFromTree(prev, id));
      closeFile(id);
      if (file) {
        setTerminalLines((prev) => [
          ...prev,
          { id: nextId(), type: "info", text: `Deleted ${file.name}` },
        ]);
      }
    },
    [closeFile, tree]
  );

  const handleInsertCode = useCallback(
    (code: string) => {
      if (!activeFileId || !activeFile) return;
      const next = `${activeFile.content ?? ""}\n\n${code}`;
      setTree((prev) => updateFileContent(prev, activeFileId, next));
      setDirtyIds((prev) => new Set(prev).add(activeFileId));
      setTerminalLines((prev) => [
        ...prev,
        {
          id: nextId(),
          type: "success",
          text: "✓ DevAI code inserted into editor",
        },
      ]);
    },
    [activeFile, activeFileId]
  );

  const handleReplaceCode = useCallback(
    (code: string) => {
      if (!activeFileId) return;
      setTree((prev) => updateFileContent(prev, activeFileId, code));
      setDirtyIds((prev) => new Set(prev).add(activeFileId));
      setTerminalLines((prev) => [
        ...prev,
        {
          id: nextId(),
          type: "success",
          text: "✓ DevAI wrote code into the open file",
        },
      ]);
    },
    [activeFileId]
  );

  const handleCommand = useCallback(
    (cmd: string) => {
      const lower = cmd.toLowerCase().trim();
      const newLines: TerminalLine[] = [
        { id: nextId(), type: "input", text: cmd },
      ];

      if (lower === "help") {
        newLines.push({
          id: nextId(),
          type: "output",
          text: `Online IDE commands:
  help      — Show this help
  clear     — Clear terminal
  run       — Run active file
  ls        — List project files
  whoami    — Show current user
  lang      — List supported languages
  ai        — Open DevAI panel
  share     — Copy share link
  theme     — Toggle dark / light mode
  about     — About DevSpace IDE
  font +/−  — Change editor font size

Shortcuts:
  Ctrl/⌘+S         Save
  Ctrl/⌘+Enter     Run
  Ctrl/⌘+I         Toggle DevAI
  Ctrl/⌘+B         Toggle explorer
  Ctrl/⌘+J         Toggle terminal
  Ctrl/⌘+Shift+N   New file
  Ctrl/⌘+Shift+D   Dark / light mode`,
        });
      } else if (lower === "clear") {
        setTerminalLines([]);
        return;
      } else if (lower === "run") {
        setTerminalLines((prev) => [...prev, ...newLines]);
        handleRun();
        return;
      } else if (lower === "ai" || lower === "devai") {
        setAiOpen(true);
        newLines.push({
          id: nextId(),
          type: "success",
          text: "✓ DevAI panel opened",
        });
      } else if (lower === "theme" || lower === "dark" || lower === "light") {
        toggleTheme();
        newLines.push({
          id: nextId(),
          type: "success",
          text: `✓ Switched to ${isDark ? "light" : "dark"} mode`,
        });
      } else if (lower === "ls") {
        const names: string[] = [];
        const walk = (nodes: FileNode[], prefix = "") => {
          nodes.forEach((n) => {
            names.push(prefix + n.name + (n.type === "folder" ? "/" : ""));
            if (n.children) walk(n.children, prefix + "  ");
          });
        };
        walk(tree);
        newLines.push({
          id: nextId(),
          type: "output",
          text: names.join("\n"),
        });
      } else if (lower === "whoami") {
        newLines.push({
          id: nextId(),
          type: "output",
          text: "Iradukunda Dev — Full Stack Developer · online",
        });
      } else if (lower === "lang" || lower === "languages") {
        newLines.push({
          id: nextId(),
          type: "output",
          text: languageOptions.map((l) => `  ${l.label} (.${l.ext})`).join("\n"),
        });
      } else if (lower === "share") {
        setTerminalLines((prev) => [...prev, ...newLines]);
        handleShare();
        return;
      } else if (lower === "font +" || lower === "font+") {
        setFontSize((s) => Math.min(22, s + 1));
        newLines.push({
          id: nextId(),
          type: "success",
          text: `Font size → ${Math.min(22, fontSize + 1)}px`,
        });
      } else if (lower === "font -" || lower === "font-") {
        setFontSize((s) => Math.max(10, s - 1));
        newLines.push({
          id: nextId(),
          type: "success",
          text: `Font size → ${Math.max(10, fontSize - 1)}px`,
        });
      } else if (lower === "about") {
        newLines.push({
          id: nextId(),
          type: "info",
          text: "DevSpace Pro Online IDE v2.1 — AI assistant, dark/light mode, multi-language runtime, auto-save & share.",
        });
      } else {
        newLines.push({
          id: nextId(),
          type: "error",
          text: `Command not found: ${cmd}. Type 'help' for available commands.`,
        });
      }

      setTerminalLines((prev) => [...prev, ...newLines]);
    },
    [tree, handleRun, handleShare, fontSize, toggleTheme, isDark]
  );

  const handleEditorMount: OnMount = (editor) => {
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
      });
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm dark:border-green-900/40 dark:bg-[#0d1210]",
        fullscreen
          ? "fixed inset-0 z-50 rounded-none"
          : "h-[calc(100vh-8rem)] min-h-[560px]"
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-green-100 bg-white px-3 py-2 dark:border-green-900/40 dark:bg-[#0d1210]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
            <Code2 className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
              DevSpace IDE
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-400">
                <Wifi className="h-2.5 w-2.5" />
                Online
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            </p>
            <p className="text-[10px] text-slate-400">
              {activeFile
                ? `${activeFile.name} · ${activeFile.language ?? "plaintext"}`
                : "No file open"}
            </p>
          </div>
        </div>

        <div className="mx-1 hidden h-5 w-px bg-green-100 dark:bg-green-900/50 sm:block" />

        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <button
            onClick={() => setExplorerOpen((v) => !v)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
              explorerOpen
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "text-slate-500 hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400"
            )}
          >
            Explorer
          </button>

          <button
            onClick={handleRun}
            disabled={!activeFile || running}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-green-200 transition-all hover:bg-green-700 disabled:opacity-50 dark:shadow-green-900/30"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" fill="currentColor" />
            )}
            Run
          </button>

          <button
            onClick={() => setAiOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all",
              aiOpen
                ? "bg-green-600 text-white shadow-sm shadow-green-200 dark:shadow-green-900/30"
                : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900/50"
            )}
          >
            <Bot className="h-3.5 w-3.5" />
            DevAI
          </button>

          <button
            onClick={handleSave}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all",
              savedFlash
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "text-slate-500 hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400"
            )}
          >
            <Save className="h-3.5 w-3.5" />
            {savedFlash ? "Saved!" : "Save"}
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {copied ? "Copied!" : "Share"}
            </span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!activeFile}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-green-50 hover:text-green-700 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={() => setShowNewFile(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950 dark:hover:text-green-400"
          >
            + New
          </button>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Users className="mr-1 h-3.5 w-3.5 text-slate-400" />
          <div className="flex -space-x-1.5">
            {onlineUsers.map((u) => (
              <div
                key={u.name}
                title={u.name}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white dark:border-[#0d1210]",
                  u.color
                )}
              >
                {u.name[0]}
              </div>
            ))}
          </div>
          <span className="ml-1 text-[10px] font-medium text-slate-400">
            3 online
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setShowShortcuts((v) => !v)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>
          <button
            onClick={() => setFontSize((s) => Math.min(22, s + 1))}
            className="rounded-lg px-1.5 py-1 text-[11px] font-bold text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
            title="Increase font"
          >
            A+
          </button>
          <button
            onClick={() => setFontSize((s) => Math.max(10, s - 1))}
            className="rounded-lg px-1.5 py-1 text-[11px] font-bold text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
            title="Decrease font"
          >
            A−
          </button>
          <button
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
            title="Settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setFullscreen((v) => !v)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div className="border-b border-green-100 bg-green-50/50 px-4 py-2 text-[11px] text-slate-600 dark:border-green-900/40 dark:bg-green-950/30 dark:text-slate-400">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm dark:bg-[#111814]">
                ⌘/Ctrl+S
              </kbd>{" "}
              Save
            </span>
            <span>
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm dark:bg-[#111814]">
                ⌘/Ctrl+Enter
              </kbd>{" "}
              Run
            </span>
            <span>
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm dark:bg-[#111814]">
                ⌘/Ctrl+I
              </kbd>{" "}
              DevAI
            </span>
            <span>
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm dark:bg-[#111814]">
                ⌘/Ctrl+B
              </kbd>{" "}
              Explorer
            </span>
            <span>
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm dark:bg-[#111814]">
                ⌘/Ctrl+J
              </kbd>{" "}
              Terminal
            </span>
            <span>
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm dark:bg-[#111814]">
                ⌘/Ctrl+Shift+D
              </kbd>{" "}
              Theme
            </span>
          </div>
        </div>
      )}

      {/* Main IDE body */}
      <div className="flex min-h-0 flex-1">
        {explorerOpen && (
          <div className="hidden w-52 shrink-0 sm:block md:w-56">
            <FileExplorer
              tree={tree}
              activeFileId={activeFileId}
              onSelect={openFile}
              onNewFile={() => setShowNewFile(true)}
              onDelete={handleDelete}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <EditorTabs
            openFiles={openFiles}
            activeFileId={activeFileId}
            dirtyIds={dirtyIds}
            onSelect={setActiveFileId}
            onClose={closeFile}
          />

          <div className="min-h-0 flex-1">
            {activeFile ? (
              <Editor
                height="100%"
                language={monacoLanguage}
                value={activeFile.content ?? ""}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme={isDark ? "vs-dark" : "vs"}
                options={{
                  fontSize,
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
                  minimap: {
                    enabled:
                      typeof window !== "undefined" && window.innerWidth > 1024,
                  },
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  tabSize: 2,
                  wordWrap: "on",
                  automaticLayout: true,
                  bracketPairColorization: { enabled: true },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  folding: true,
                  glyphMargin: false,
                  overviewRulerLanes: 0,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
                loading={
                  <div className="flex h-full items-center justify-center bg-white dark:bg-[#1e1e1e]">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#fafcfa] text-center dark:bg-[#0a0f0c]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950">
                  <Code2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Start coding with AI
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Open a file or ask DevAI to generate code for you
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setShowNewFile(true)}
                    className="rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-green-200 transition-all hover:bg-green-700 dark:shadow-green-900/30"
                  >
                    Create New File
                  </button>
                  <button
                    onClick={() => setAiOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 px-4 py-2 text-xs font-bold text-green-700 transition-all hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    <Bot className="h-3.5 w-3.5" />
                    Open DevAI
                  </button>
                  <button
                    onClick={() => openFile("file-main-js")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 px-4 py-2 text-xs font-bold text-green-700 transition-all hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Open sample
                  </button>
                </div>
              </div>
            )}
          </div>

          <Terminal
            lines={terminalLines}
            onCommand={handleCommand}
            onClear={() => setTerminalLines([])}
            collapsed={terminalCollapsed}
            onToggle={() => setTerminalCollapsed((v) => !v)}
          />
        </div>

        {/* AI Panel - desktop */}
        {aiOpen && (
          <div className="hidden h-full shrink-0 md:flex">
            <IDEAIChat
              open={aiOpen}
              onClose={() => setAiOpen(false)}
              fileName={activeFile?.name}
              language={activeFile?.language ?? "javascript"}
              code={activeFile?.content ?? ""}
              onInsertCode={handleInsertCode}
              onReplaceCode={handleReplaceCode}
              autoWrite
            />
          </div>
        )}
      </div>

      {/* AI Panel - mobile overlay */}
      {aiOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setAiOpen(false)}
          />
          <div className="relative ml-auto h-full w-[min(100%,380px)] shadow-2xl">
            <IDEAIChat
              open={aiOpen}
              onClose={() => setAiOpen(false)}
              fileName={activeFile?.name}
              language={activeFile?.language ?? "javascript"}
              code={activeFile?.content ?? ""}
              onInsertCode={handleInsertCode}
              onReplaceCode={handleReplaceCode}
              autoWrite
            />
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex h-6 items-center justify-between border-t border-green-700 bg-green-600 px-3 text-[10px] font-medium text-white dark:border-green-800 dark:bg-green-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Wifi className="h-3 w-3" /> Online IDE
          </span>
          <span className="flex items-center gap-1 opacity-90">
            <Bot className="h-3 w-3" /> DevAI
          </span>
          <span className="opacity-70">UTF-8</span>
          {activeFile && (
            <span className="capitalize opacity-90">
              {activeFile.language}
            </span>
          )}
          {dirtyIds.size > 0 && (
            <span className="opacity-90">{dirtyIds.size} unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="opacity-70">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>Spaces: 2</span>
          <span>{fontSize}px</span>
          <span className="opacity-90">{isDark ? "Dark" : "Light"}</span>
          <span className="opacity-90">● Cloud synced</span>
        </div>
      </div>

      <NewFileModal
        open={showNewFile}
        onClose={() => setShowNewFile(false)}
        onCreate={handleNewFile}
      />
    </div>
  );
}
