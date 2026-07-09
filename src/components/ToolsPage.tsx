import { useEffect, useMemo, useState } from "react";
import {
  AlignLeft,
  Braces,
  Check,
  Cloud,
  Copy,
  Download,
  Droplet,
  Eraser,
  FileText,
  Image as ImageIcon,
  Loader2,
  QrCode,
  Regex,
  Wand2,
  Wrench,
} from "lucide-react";
import { cn } from "../utils/cn";

type ToolId =
  | "json"
  | "api"
  | "regex"
  | "format"
  | "color"
  | "markdown"
  | "qr"
  | "removebg";

const TOOLS: {
  id: ToolId;
  name: string;
  desc: string;
  icon: typeof Braces;
}[] = [
  { id: "json", name: "JSON Formatter", desc: "Format & validate JSON", icon: Braces },
  { id: "api", name: "API Tester", desc: "Send HTTP requests", icon: Cloud },
  { id: "regex", name: "Regex Tester", desc: "Test regular expressions", icon: Regex },
  { id: "format", name: "Code Formatter", desc: "Beautify code text", icon: AlignLeft },
  { id: "color", name: "Color Picker", desc: "HEX / RGB converter", icon: Droplet },
  { id: "markdown", name: "Markdown Editor", desc: "Write & preview MD", icon: FileText },
  { id: "qr", name: "QR Generator", desc: "Create QR code images", icon: QrCode },
  { id: "removebg", name: "BG Remover", desc: "Remove image background", icon: Eraser },
];

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

function formatJson(input: string, pretty: boolean) {
  const parsed = JSON.parse(input);
  return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
}

function simpleFormatCode(input: string) {
  // lightweight indentation helper (not a full prettier)
  let indent = 0;
  const lines = input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    if (/^[}\])]/.test(line)) indent = Math.max(0, indent - 1);
    out.push(`${"  ".repeat(indent)}${line}`);
    if (/[{\[(]$/.test(line) || /{$/.test(line)) indent += 1;
  }
  return out.join("\n");
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mdToHtml(md: string) {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+)`/gim, "<code>$1</code>")
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-green-600 underline">$1</a>')
    .replace(/\n$/gim, "<br />")
    .replace(/\n/g, "<br />");
}

export function ToolsPage({
  initialTool = "json",
}: {
  initialTool?: ToolId | string;
}) {
  const [active, setActive] = useState<ToolId>(
    (TOOLS.some((t) => t.id === initialTool)
      ? initialTool
      : "json") as ToolId
  );

  // JSON
  const [jsonIn, setJsonIn] = useState('{\n  "hello": "DevSpace"\n}');
  const [jsonOut, setJsonOut] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // API tester
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiUrl, setApiUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [apiBody, setApiBody] = useState("");
  const [apiResult, setApiResult] = useState("");
  const [apiLoading, setApiLoading] = useState(false);

  // Regex
  const [regexPattern, setRegexPattern] = useState("\\b\\w+\\b");
  const [regexFlags, setRegexFlags] = useState("g");
  const [regexText, setRegexText] = useState("DevSpace Pro tools are ready.");
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);

  // Format
  const [codeIn, setCodeIn] = useState("function hello(){console.log('hi')}");
  const [codeOut, setCodeOut] = useState("");

  // Color
  const [hex, setHex] = useState("#16a34a");
  const [rgb, setRgb] = useState({ r: 22, g: 163, b: 74 });

  // Markdown
  const [md, setMd] = useState("# Hello DevSpace\n\nWrite **markdown** here.");

  // QR
  const [qrText, setQrText] = useState("https://devspace.pro");
  const [qrSize, setQrSize] = useState(220);

  // Remove BG
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [bgResult, setBgResult] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (TOOLS.some((t) => t.id === initialTool)) {
      setActive(initialTool as ToolId);
    }
  }, [initialTool]);

  const qrUrl = useMemo(() => {
    const data = encodeURIComponent(qrText || " ");
    return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${data}&margin=10`;
  }, [qrText, qrSize]);

  const doCopy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const runJson = (pretty: boolean) => {
    try {
      setJsonOut(formatJson(jsonIn, pretty));
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      setJsonOut("");
    }
  };

  const runApi = async () => {
    setApiLoading(true);
    setApiResult("");
    try {
      const res = await fetch(apiUrl, {
        method: apiMethod,
        headers:
          apiMethod !== "GET" && apiBody
            ? { "Content-Type": "application/json" }
            : undefined,
        body:
          apiMethod !== "GET" && apiBody.trim() ? apiBody : undefined,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* plain text */
      }
      setApiResult(`Status: ${res.status} ${res.statusText}\n\n${pretty}`);
    } catch (e) {
      setApiResult(e instanceof Error ? e.message : "Request failed");
    } finally {
      setApiLoading(false);
    }
  };

  const runRegex = () => {
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const matches = regexText.match(re) || [];
      setRegexMatches(matches);
      setRegexError(null);
    } catch (e) {
      setRegexError(e instanceof Error ? e.message : "Invalid regex");
      setRegexMatches([]);
    }
  };

  const runRemoveBg = async () => {
    if (!bgFile) {
      setBgError("Choose an image first");
      return;
    }
    const key = import.meta.env.VITE_REMOVE_BG_API_KEY as string | undefined;
    if (!key) {
      setBgError("Missing VITE_REMOVE_BG_API_KEY in .env");
      return;
    }
    setBgLoading(true);
    setBgError(null);
    setBgResult(null);
    try {
      const formData = new FormData();
      formData.append("size", "auto");
      formData.append("image_file", bgFile);

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": key },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${response.status}: ${errText || response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setBgResult(url);
    } catch (e) {
      setBgError(e instanceof Error ? e.message : "Background removal failed");
    } finally {
      setBgLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          <Wrench className="h-6 w-6 text-green-600" />
          Developer Tools
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Working tools · QR · BG remove · API tester · more
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActive(tool.id)}
              className={cn(
                "rounded-2xl border p-3 text-left transition-all",
                active === tool.id
                  ? "border-green-500 bg-green-50 shadow-sm dark:border-green-600 dark:bg-green-950/40"
                  : "border-green-50 bg-white hover:border-green-200 dark:border-green-900/40 dark:bg-[#111814]"
              )}
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {tool.name}
              </p>
              <p className="text-[10px] text-slate-400">{tool.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-green-50 bg-white p-4 shadow-sm dark:border-green-900/40 dark:bg-[#111814] sm:p-5">
        {active === "json" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              JSON Formatter
            </h2>
            <textarea
              value={jsonIn}
              onChange={(e) => setJsonIn(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-green-100 bg-green-50/20 p-3 font-mono text-xs outline-none dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => runJson(true)}
                className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
              >
                Beautify
              </button>
              <button
                onClick={() => runJson(false)}
                className="rounded-xl border border-green-200 px-3 py-2 text-xs font-bold text-green-700 dark:border-green-800 dark:text-green-400"
              >
                Minify
              </button>
              {jsonOut && (
                <button
                  onClick={() => void doCopy(jsonOut)}
                  className="inline-flex items-center gap-1 rounded-xl border border-green-200 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </button>
              )}
            </div>
            {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
            {jsonOut && (
              <pre className="overflow-auto rounded-xl bg-[#0d1117] p-3 font-mono text-xs text-green-300">
                {jsonOut}
              </pre>
            )}
          </div>
        )}

        {active === "api" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              API Tester
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value)}
                className="h-10 rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
                placeholder="https://api.example.com"
              />
              <button
                onClick={() => void runApi()}
                disabled={apiLoading}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-green-600 px-4 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {apiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send
              </button>
            </div>
            {apiMethod !== "GET" && (
              <textarea
                value={apiBody}
                onChange={(e) => setApiBody(e.target.value)}
                rows={4}
                placeholder='{"key":"value"}'
                className="w-full rounded-xl border border-green-100 p-3 font-mono text-xs dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
              />
            )}
            {apiResult && (
              <pre className="max-h-80 overflow-auto rounded-xl bg-[#0d1117] p-3 font-mono text-xs text-slate-200">
                {apiResult}
              </pre>
            )}
          </div>
        )}

        {active === "regex" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Regex Tester
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                className="h-10 rounded-xl border border-green-100 px-3 font-mono text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100 sm:col-span-2"
                placeholder="pattern"
              />
              <input
                value={regexFlags}
                onChange={(e) => setRegexFlags(e.target.value)}
                className="h-10 rounded-xl border border-green-100 px-3 font-mono text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
                placeholder="flags e.g. gi"
              />
            </div>
            <textarea
              value={regexText}
              onChange={(e) => setRegexText(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-green-100 p-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <button
              onClick={runRegex}
              className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
            >
              Test regex
            </button>
            {regexError && <p className="text-xs text-red-500">{regexError}</p>}
            <div className="rounded-xl bg-green-50/50 p-3 text-xs dark:bg-green-950/30">
              <p className="font-bold text-slate-700 dark:text-slate-200">
                Matches ({regexMatches.length})
              </p>
              <ul className="mt-1 list-disc pl-4 text-slate-600 dark:text-slate-400">
                {regexMatches.map((m, i) => (
                  <li key={`${m}-${i}`} className="font-mono">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {active === "format" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Code Formatter
            </h2>
            <textarea
              value={codeIn}
              onChange={(e) => setCodeIn(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-green-100 p-3 font-mono text-xs dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCodeOut(simpleFormatCode(codeIn))}
                className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Format
              </button>
              {codeOut && (
                <button
                  onClick={() => void doCopy(codeOut)}
                  className="rounded-xl border border-green-200 px-3 py-2 text-xs font-bold"
                >
                  Copy
                </button>
              )}
            </div>
            {codeOut && (
              <pre className="overflow-auto rounded-xl bg-[#0d1117] p-3 font-mono text-xs text-green-300">
                {codeOut}
              </pre>
            )}
          </div>
        )}

        {active === "color" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Color Picker
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="color"
                value={hex}
                onChange={(e) => {
                  const value = e.target.value;
                  setHex(value);
                  const rgbVal = hexToRgb(value);
                  if (rgbVal) setRgb(rgbVal);
                }}
                className="h-14 w-20 cursor-pointer rounded-xl border border-green-100 bg-transparent"
              />
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500">HEX</label>
                <input
                  value={hex}
                  onChange={(e) => {
                    setHex(e.target.value);
                    const rgbVal = hexToRgb(e.target.value);
                    if (rgbVal) setRgb(rgbVal);
                  }}
                  className="h-10 w-36 rounded-xl border border-green-100 px-3 font-mono text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
                />
              </div>
              {(["r", "g", "b"] as const).map((k) => (
                <div key={k} className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase text-slate-500">
                    {k}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb[k]}
                    onChange={(e) => {
                      const next = {
                        ...rgb,
                        [k]: Number(e.target.value),
                      };
                      setRgb(next);
                      setHex(rgbToHex(next.r, next.g, next.b));
                    }}
                    className="h-10 w-20 rounded-xl border border-green-100 px-2 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
                  />
                </div>
              ))}
            </div>
            <div
              className="h-16 rounded-2xl border border-green-100"
              style={{ background: hex }}
            />
            <p className="text-xs text-slate-500">
              RGB({rgb.r}, {rgb.g}, {rgb.b}) · {hex}
            </p>
          </div>
        )}

        {active === "markdown" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Markdown Editor
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              <textarea
                value={md}
                onChange={(e) => setMd(e.target.value)}
                rows={12}
                className="w-full rounded-xl border border-green-100 p-3 font-mono text-xs dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
              />
              <div
                className="prose prose-sm max-w-none rounded-xl border border-green-50 bg-green-50/20 p-3 text-sm dark:border-green-900/40 dark:bg-green-950/20 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: mdToHtml(md) }}
              />
            </div>
          </div>
        )}

        {active === "qr" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              QR Code Generator
            </h2>
            <input
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="Text or URL"
              className="h-11 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-500">
                Size: {qrSize}px
              </label>
              <input
                type="range"
                min={120}
                max={400}
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="flex-1"
              />
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <img
                src={qrUrl}
                alt="QR code"
                className="rounded-2xl border border-green-100 bg-white p-2"
                width={qrSize}
                height={qrSize}
              />
              <a
                href={qrUrl}
                download="qrcode.png"
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download QR
              </a>
            </div>
          </div>
        )}

        {active === "removebg" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Background Remover
            </h2>
            <p className="text-xs text-slate-500">
              Powered by remove.bg · upload an image to remove its background
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/30 px-4 py-8 dark:border-green-800 dark:bg-green-950/20">
              <ImageIcon className="h-8 w-8 text-green-600" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {bgFile ? bgFile.name : "Click to choose image"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setBgFile(file);
                  setBgResult(null);
                  setBgError(null);
                  if (file) setBgPreview(URL.createObjectURL(file));
                  else setBgPreview(null);
                }}
              />
            </label>
            <button
              onClick={() => void runRemoveBg()}
              disabled={bgLoading || !bgFile}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {bgLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eraser className="h-4 w-4" />
              )}
              Remove background
            </button>
            {bgError && <p className="text-xs text-red-500">{bgError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {bgPreview && (
                <div>
                  <p className="mb-1 text-[11px] font-bold text-slate-500">
                    Original
                  </p>
                  <img
                    src={bgPreview}
                    alt="Original"
                    className="max-h-64 w-full rounded-xl object-contain bg-slate-100 dark:bg-slate-900"
                  />
                </div>
              )}
              {bgResult && (
                <div>
                  <p className="mb-1 text-[11px] font-bold text-slate-500">
                    No background
                  </p>
                  <img
                    src={bgResult}
                    alt="No background"
                    className="max-h-64 w-full rounded-xl object-contain bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect width=%228%22 height=%228%22 fill=%22%23eee%22/><rect x=%228%22 y=%228%22 width=%228%22 height=%228%22 fill=%22%23eee%22/></svg>')] dark:bg-slate-900"
                  />
                  <a
                    href={bgResult}
                    download="no-bg.png"
                    className="mt-2 inline-flex items-center gap-1 rounded-xl border border-green-200 px-3 py-2 text-xs font-bold text-green-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PNG
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
